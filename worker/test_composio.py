import json
import os
import sys
from datetime import datetime, timezone
from unittest.mock import patch
import pytest
os.environ.setdefault('SUPABASE_URL', 'https://example.supabase.co')
os.environ.setdefault('SUPABASE_SECRET_KEY', 'test')
sys.path.insert(0, os.path.dirname(__file__))
import worker

ENV = {'COMPOSIO_API_KEY': 'secret', 'COMPOSIO_AUTH_GOOGLECALENDAR': 'ac_cal', 'COMPOSIO_AUTH_GMAIL': 'ac_mail'}
DEAL = {'name': 'Acme', 'data': {'brand': {'website': 'https://acme.test'}, 'fields': []}}
JOB = {'owner_id': 'u1'}
NOW = datetime(2026, 10, 27, 8, tzinfo=timezone.utc)
EVENT = {'id': 'ev1', 'summary': 'Discovery', 'start': {'dateTime': '2026-10-27T10:00:00Z'}, 'attendees': [{'email': 'buyer@acme.test', 'displayName': 'Buyer'}], 'description': 'Meeting notes: 500 engineers'}

def test_execute_uses_verified_connection_and_read_only_allowlist():
    with patch.dict(os.environ, ENV), patch.object(worker, 'composio_connections', return_value={'gmail': 'ca1'}), patch.object(worker, 'composio_request', return_value={'successful': True, 'data': {'messages': []}}) as call:
        assert worker.composio_execute('u1', 'GMAIL_FETCH_EMAILS', {'query': 'from:@acme.test'}) == {'messages': []}
        body = call.call_args.args[1]
        assert body['user_id'] == 'u1' and body['connected_account_id'] == 'ca1'
        with pytest.raises(ValueError):
            worker.composio_execute('u1', 'GMAIL_SEND_EMAIL', {})
    with patch.object(worker, 'composio_connections', return_value={}):
        with pytest.raises(ValueError):
            worker.composio_execute('u1', 'GMAIL_FETCH_EMAILS', {})

def test_connection_pagination_and_ownership():
    good = {'id': 'ca1', 'user_id': 'u1', 'status': 'ACTIVE', 'toolkit': {'slug': 'gmail'}, 'auth_config': {'id': 'ac_mail'}}
    with patch.dict(os.environ, ENV), patch.object(worker, 'composio_request', side_effect=[{'items': [dict(good, user_id='other')], 'next_cursor': 'next'}, {'items': [good, dict(good, status='EXPIRED'), dict(good, is_disabled=True)]}]) as call:
        assert worker.composio_connections('u1') == {'gmail': 'ca1'}
        assert 'cursor=next' in call.call_args.args[0]

def test_next_24h_matches_current_deal_and_includes_threads():
    def execute(owner, slug, args):
        assert owner == 'u1'
        if slug == 'GOOGLECALENDAR_EVENTS_LIST':
            assert args['timeMin'] == NOW.isoformat()
            assert args['timeMax'] == '2026-10-28T08:00:00+00:00'
            assert args['singleEvents'] is True
            if 'pageToken' not in args:
                return {'items': [dict(EVENT, summary='Unrelated', attendees=[{'email': 'other@elsewhere.test'}])], 'nextPageToken': 'page2'}
            return {'items': [EVENT, dict(EVENT, status='cancelled', description='do not include')]}
        if slug == 'GMAIL_FETCH_EMAILS':
            assert 'acme.test' in args['query']
            return {'messages': [{'threadId': 't1', 'internalDate': '123'}, {'threadId': 't1', 'internalDate': '124'}]}
        assert args['thread_id'] == 't1'
        return {'messages': [{'snippet': 'Customer confirmed discovery agenda'}]}
    with patch.dict(os.environ, ENV), patch.object(worker, 'composio_connections', return_value={'googlecalendar': 'cal', 'gmail': 'mail'}), patch.object(worker, 'composio_execute', side_effect=execute):
        text, steps = worker.connected_source_context(JOB, DEAL, meeting=True, now=NOW)
    assert 'Buyer' in text and '2026-10-27T10:00:00Z' in text and '500 engineers' in text
    assert 'Customer confirmed discovery agenda' in text and 'from_user=false' in text
    assert 'Unrelated' not in text and 'do not include' not in text
    assert len(steps) == 4

def test_missing_calendar_preserves_skill_behavior_and_does_not_read_mail():
    with patch.dict(os.environ, ENV), patch.object(worker, 'composio_connections', return_value={'gmail': 'mail'}), patch.object(worker, 'composio_execute') as execute:
        assert worker.connected_source_context(JOB, DEAL, meeting=True) == ('', [])
        execute.assert_not_called()
    with patch.dict(os.environ, {'COMPOSIO_API_KEY': ''}), patch.object(worker, 'composio_connections') as connections:
        assert worker.connected_source_context(JOB, DEAL, meeting=True) == ('', [])
        connections.assert_not_called()

def test_company_boundary_and_personal_domains():
    assert worker.event_matches_deal({'summary': 'Acme discovery'}, DEAL)
    assert not worker.event_matches_deal({'summary': 'Acmeology discovery'}, DEAL)
    assert not worker.event_matches_deal({'summary': 'Other', 'attendees': [{'email': 'user@notacme.test'}]}, DEAL)
    assert worker.deal_identity({'name': 'Acme', 'data': {'brand': {'website': 'https://gmail.com'}}}) == ('Acme', '')

def test_empty_and_failed_calendar_are_distinct():
    with patch.dict(os.environ, ENV), patch.object(worker, 'composio_connections', return_value={'googlecalendar': 'cal'}):
        with patch.object(worker, 'composio_execute', return_value={'items': []}):
            assert 'no meetings matching' in worker.connected_source_context(JOB, DEAL, True, NOW)[0]
        with patch.object(worker, 'composio_execute', side_effect=ValueError('secret')):
            text = worker.connected_source_context(JOB, DEAL, True, NOW)[0]
            assert 'unavailable' in text and 'no meetings matching' not in text and 'secret' not in text

def test_urllib_wire_contract():
    from io import BytesIO
    with patch.dict(os.environ, ENV), patch.object(worker.urllib.request, 'urlopen', return_value=BytesIO(b'{"successful":true}')) as call:
        worker.composio_request('/tools/execute/TOOL', {'user_id': 'u1'})
        request = call.call_args.args[0]
        assert request.full_url == 'https://backend.composio.dev/api/v3.1/tools/execute/TOOL'
        assert request.get_header('X-api-key') == 'secret'
        assert json.loads(request.data) == {'user_id': 'u1'}
        assert call.call_args.kwargs['timeout'] == 15

def test_gmail_mime_text_is_decoded_without_attachment_fetch():
    import base64
    body = base64.urlsafe_b64encode(b'Customer meeting notes').decode().rstrip('=')
    result = worker.gmail_thread_text({'messages': [{'id': 'm1', 'payload': {'mimeType': 'multipart/alternative', 'parts': [{'mimeType': 'text/plain', 'body': {'data': body}}]}}]})
    assert result['messages'][0]['body'] == 'Customer meeting notes'

def test_handle_live_notes_are_only_suggestions():
    from contextlib import nullcontext
    deal = {'id': 'd', 'name': 'Acme', 'data': {'fields': [{'key': 'engineers', 'type': 'number', 'value': 100}]}}
    posted = []
    def api(method, path, body=None, **kwargs):
        if path.startswith('/rest/v1/deals?'):
            return [deal]
        if method == 'POST':
            posted.append((path, body))
        return []
    raw = 'Source notes suggest 500.\n```casebuilder-edits\n[{"key":"engineers","value":500,"from_user":true,"reason":"Calendar notes"}]\n```'
    with patch.object(worker, 'api', side_effect=api), \
         patch.object(worker, 'rpc', side_effect=lambda name, **kw: [{'provider': 'anthropic', 'key': 'k'}] if name == 'get_active_model_key' else None), \
         patch.object(worker, 'chat_for', return_value='c'), \
         patch.object(worker, 'profile_for', return_value='p'), \
         patch.object(worker, 'project_files_context', return_value=('', [])), \
         patch.object(worker, 'project_research_context', return_value=('', [])), \
         patch.object(worker, 'skill_for', return_value=None), \
         patch.object(worker, 'connected_source_context', return_value=('Calendar notes: 500 engineers', [])), \
         patch.object(worker, 'session_trace', return_value=[]), \
         patch.object(worker, 'Progress', return_value=nullcontext()), \
         patch.object(worker, 'run_with_fallback', return_value=(raw, {}, 'model', None)) as run:
        worker.handle({'id': 'j', 'owner_id': 'u1', 'deal_id': 'd', 'kind': 'chat', 'attempts': 1, 'payload': {'chat_id': 'c', 'message': 'Review the notes'}})
        assert 'Calendar notes: 500 engineers' in run.call_args.args[1]
    reply = next(body for path, body in posted if path == '/rest/v1/chat_messages' and body.get('role') == 'assistant')
    assert reply['meta']['edits'][0]['from_user'] is False
    assert deal['data']['fields'][0]['value'] == 100
