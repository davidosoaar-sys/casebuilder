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
    def execute(owner, slug, args, connections=None):
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


def test_deal_identity_strips_project_label_suffix():
    name, _ = worker.deal_identity({'name': 'Nike \u00b7 sample', 'data': {}})
    assert name == 'Nike'
    assert worker.event_matches_deal({'summary': 'Nike business case review', 'attendees': []}, {'name': 'Nike \u00b7 sample', 'data': {}})
    assert not worker.event_matches_deal({'summary': 'Nikelodeon sync', 'attendees': []}, {'name': 'Nike \u00b7 sample', 'data': {}})


# ---------------------------------------------------------------- new toolkits

ALL_NEW = {'gong': 'g', 'fireflies': 'f', 'googlesheets': 's', 'googledrive': 'd', 'excel': 'x', 'clay': 'c', 'lemlist': 'l', 'canva': 'v', 'figma': 'fi'}
WRITE_WORDS = ('CREATE', 'UPDATE', 'DELETE', 'SEND', 'ADD', 'REMOVE', 'UPLOAD', 'INSERT', 'APPEND', 'CLEAR', 'MOVE', 'COPY', 'SET_', 'RUN_ROUTINE', 'LAUNCH', 'ERASE', 'ASSIGN', 'REPORT_', 'REGISTER', 'PATCH', 'PUT_')


def test_allowlist_is_read_only_and_every_toolkit_is_pinned():
    for slug, toolkit in worker.COMPOSIO_TOOLS.items():
        assert slug.startswith(toolkit.upper() + '_')
        assert not any(w in slug for w in WRITE_WORDS), slug
        assert worker.COMPOSIO_VERSIONS[toolkit]
    assert set(worker.COMPOSIO_VERSIONS) == {'googlecalendar', 'gmail', 'slack', 'hubspot', 'gong', 'fireflies', 'googlesheets', 'excel', 'googledrive', 'figma', 'canva', 'clay', 'lemlist'}


def test_execute_pins_new_toolkit_version_and_uses_given_connections():
    with patch.dict(os.environ, ENV), patch.object(worker, 'composio_connections') as listing, \
         patch.object(worker, 'composio_request', return_value={'successful': True, 'data': {'transcripts': []}}) as call:
        worker.composio_execute('u1', 'FIREFLIES_SEARCH_TRANSCRIPTS', {'keyword': 'Acme'}, connections={'fireflies': 'ca_ff'})
        listing.assert_not_called()
        body = call.call_args.args[1]
        assert body['version'] == '20260826_00' and body['connected_account_id'] == 'ca_ff'
        with pytest.raises(ValueError):
            worker.composio_execute('u1', 'CLAY_RUN_ROUTINE', {}, connections={'clay': 'c'})


GONG_CALLS = {'data': {'calls': [
    {'metaData': {'id': 'c1', 'title': 'Acme discovery', 'started': '2026-10-20T10:00:00Z', 'url': 'https://app.gong.io/call?id=c1'}, 'parties': [{'speakerId': 's1', 'name': 'Dana', 'affiliation': 'External', 'emailAddress': 'dana@acme.test'}]},
    {'metaData': {'id': 'c2', 'title': 'Internal sync', 'started': '2026-10-25T10:00:00Z'}, 'parties': [{'speakerId': 's2', 'emailAddress': 'cfo@acme.test'}]},
    {'metaData': {'id': 'c3', 'title': 'Acmeology intro', 'started': '2026-10-26T10:00:00Z'}, 'parties': [{'emailAddress': 'x@acmeology.test'}]},
], 'records': {}}}
GONG_TRANSCRIPTS = {'callTranscripts': [{'callId': 'c1', 'transcript': [{'speakerId': 's1', 'sentences': [{'text': 'At Acme we have 500 engineers.'}]}]},
                                        {'callId': 'c2', 'transcript': [{'speakerId': 's2', 'sentences': [{'text': 'Budget is 2 million.'}]}]}]}


def fake(responses, calls):
    def execute(owner, slug, args, connections=None):
        assert owner == 'u1'
        calls.append((slug, args))
        value = responses[slug]
        if isinstance(value, Exception):
            raise value
        return value(args) if callable(value) else value
    return execute


def run_context(connections, responses, deal=DEAL, meeting=False):
    calls = []
    with patch.dict(os.environ, ENV), patch.object(worker, 'composio_connections', return_value=connections), \
         patch.object(worker, 'composio_execute', side_effect=fake(responses, calls)):
        text, steps = worker.connected_source_context(JOB, deal, meeting=meeting, now=NOW)
    return text, steps, calls


def test_gong_matches_company_by_title_or_party_domain_and_quotes_transcript():
    text, steps, calls = run_context({'gong': 'g'}, {'GONG_RETRIEVE_FILTERED_CALL_DETAILS': GONG_CALLS, 'GONG_GET_CALL_TRANSCRIPT': GONG_TRANSCRIPTS})
    listing = calls[0][1]
    assert listing['filter__fromDateTime'] == '2026-07-29T08:00:00+00:00' and listing['contentSelector__exposedFields__parties'] is True
    assert calls[1] == ('GONG_GET_CALL_TRANSCRIPT', {'filter': {'callIds': ['c2', 'c1']}})
    assert '500 engineers' in text and 'Dana (External)' in text and 'Budget is 2 million' in text
    assert 'Acmeology' not in text and 'PROPOSED' in text and 'quote' in text
    assert {s['connector'] for s in steps} == {'gong'}


def test_gong_failure_and_empty_are_distinct():
    text = run_context({'gong': 'g'}, {'GONG_RETRIEVE_FILTERED_CALL_DETAILS': ValueError('secret')})[0]
    assert 'gong unavailable; do not infer' in text and 'no calls' not in text and 'secret' not in text
    text = run_context({'gong': 'g'}, {'GONG_RETRIEVE_FILTERED_CALL_DETAILS': {'calls': [], 'records': {}}})[0]
    assert 'Gong: no calls with Acme' in text


def test_fireflies_searches_company_and_reads_bounded_transcript():
    long = [{'speaker_name': 'Sam', 'text': 'filler ' * 50} for _ in range(60)] + [{'speaker_name': 'Buyer', 'text': 'Acme spends 300 hours a month on audits.'}]
    responses = {'FIREFLIES_SEARCH_TRANSCRIPTS': {'transcripts': [{'id': 'old', 'date': 1}, {'id': 't9', 'date': 1761552000000, 'title': 'Acme QBR'}, {'id': 't8', 'date': 5}, {'id': 't7', 'date': 4}]},
                 'FIREFLIES_GET_TRANSCRIPT_BY_ID': lambda a: {'id': a['id'], 'title': 'Acme QBR', 'transcript_url': 'https://app.fireflies.ai/view/' + a['id'], 'summary': {'overview': 'Audit pain'}, 'sentences': long}}
    text, steps, calls = run_context({'fireflies': 'f'}, responses)
    assert calls[0][1] == {'keyword': 'Acme', 'scope': 'all', 'limit': 10, 'from_date': '2026-07-29T08:00:00+00:00'}
    reads = [a['id'] for s, a in calls if s == 'FIREFLIES_GET_TRANSCRIPT_BY_ID']
    assert reads == ['t9', 't8', 't7']  # newest first, capped at three
    assert '300 hours a month on audits' in text and 'Audit pain' in text and 'https://app.fireflies.ai/view/t9' in text
    assert len(text) < worker.LIVE_TOTAL_CHARS + 2000


def test_pre_meeting_brief_reads_only_latest_transcript_and_only_with_a_matching_meeting():
    responses = {'GOOGLECALENDAR_EVENTS_LIST': {'items': [EVENT]}, 'FIREFLIES_SEARCH_TRANSCRIPTS': {'transcripts': [{'id': 'a', 'date': 2}, {'id': 'b', 'date': 1}]},
                 'FIREFLIES_GET_TRANSCRIPT_BY_ID': {'id': 'a', 'sentences': [{'speaker_name': 'Buyer', 'text': 'Latest Acme call notes'}]},
                 'GONG_RETRIEVE_FILTERED_CALL_DETAILS': GONG_CALLS, 'GONG_GET_CALL_TRANSCRIPT': GONG_TRANSCRIPTS,
                 'GOOGLESHEETS_SEARCH_SPREADSHEETS': AssertionError('files are not read for briefs')}
    text, _, calls = run_context({'googlecalendar': 'cal', 'fireflies': 'f', 'gong': 'g', 'googlesheets': 's'}, responses, meeting=True)
    assert [a['id'] for s, a in calls if s == 'FIREFLIES_GET_TRANSCRIPT_BY_ID'] == ['a']
    assert next(a for s, a in calls if s == 'GONG_GET_CALL_TRANSCRIPT')['filter']['callIds'] == ['c2']
    assert 'Latest Acme call notes' in text and 'GOOGLESHEETS' not in str(calls)
    text, _, calls = run_context({'googlecalendar': 'cal', 'fireflies': 'f'}, {'GOOGLECALENDAR_EVENTS_LIST': {'items': []}}, meeting=True)
    assert [s for s, _ in calls] == ['GOOGLECALENDAR_EVENTS_LIST']


def test_sheets_drive_and_excel_read_bounded_ranges_of_company_named_files():
    responses = {
        'GOOGLESHEETS_SEARCH_SPREADSHEETS': {'spreadsheets': [{'id': 'sh1', 'name': 'Acme ROI model', 'webViewLink': 'https://docs.google.com/sh1'}, {'id': 'sh2', 'name': 'Acmeology plan'}]},
        'GOOGLESHEETS_VALUES_GET': {'values': [['Engineers', 500], ['Hours', None]]},
        'GOOGLEDRIVE_FIND_FILE': {'files': [{'id': 'sh1', 'name': 'Acme ROI model', 'mimeType': 'application/vnd.google-apps.spreadsheet'},
                                            {'id': 'doc1', 'name': 'Acme discovery notes', 'mimeType': 'application/vnd.google-apps.document'},
                                            {'id': 'sh3', 'name': 'Acme budget', 'mimeType': 'application/vnd.google-apps.spreadsheet'}]},
        'GOOGLEDRIVE_GET_DOCUMENT': {'body': {'content': [{'paragraph': {'elements': [{'textRun': {'content': 'Acme wants SSO.\n'}}]}},
                                                          {'table': {'tableRows': [{'tableCells': [{'content': [{'paragraph': {'elements': [{'textRun': {'content': 'Seats 800'}}]}}]}]}]}}]}},
        'GOOGLEDRIVE_GET_SPREADSHEET_VALUES': {'values': [['Budget', '2M']]},
        'EXCEL_SEARCH_FILES': {'value': [{'id': 'x1', 'name': 'Acme forecast.xlsx', 'web_url': 'https://onedrive.test/x1', 'parent_reference': {'drive_id': 'drv'}}, {'id': 'x2', 'name': 'Other.xlsx'}]},
        'EXCEL_LIST_WORKSHEETS': {'worksheets': [{'id': 'w2', 'name': 'Notes', 'position': 1}, {'id': 'w1', 'name': 'Model', 'position': 0}]},
        'EXCEL_GET_RANGE': {'values': [['Revenue', 1200000]]},
    }
    text, _, calls = run_context({'googlesheets': 's', 'googledrive': 'd', 'excel': 'x'}, responses)
    args = dict((s, a) for s, a in calls)
    assert args['GOOGLESHEETS_SEARCH_SPREADSHEETS']['query'] == "name contains 'Acme'"
    assert args['GOOGLESHEETS_VALUES_GET'] == {'spreadsheet_id': 'sh1', 'range': 'A1:Z60'}
    assert "name contains 'Acme'" in args['GOOGLEDRIVE_FIND_FILE']['q'] and 'trashed = false' in args['GOOGLEDRIVE_FIND_FILE']['q']
    assert args['GOOGLEDRIVE_GET_SPREADSHEET_VALUES'] == {'spreadsheet_id': 'sh3', 'range': 'A1:Z60'}  # sh1 already read via Sheets
    assert args['EXCEL_SEARCH_FILES']['query'] == 'Acme'
    assert args['EXCEL_LIST_WORKSHEETS'] == {'item_id': 'x1', 'drive_id': 'drv', 'top': 5}
    assert args['EXCEL_GET_RANGE'] == {'item_id': 'x1', 'drive_id': 'drv', 'worksheet_id': 'Model', 'address': 'A1:Z60'}
    assert 'Engineers\t500' in text and 'Acme wants SSO.' in text and 'Seats 800' in text and 'Budget\t2M' in text and 'Revenue\t1200000' in text
    assert 'Acmeology' not in text and 'Other.xlsx' not in text


def test_file_names_with_quotes_are_escaped_in_drive_queries():
    deal = {'name': "O'Neil Labs", 'data': {'fields': []}}
    _, _, calls = run_context({'googledrive': 'd'}, {'GOOGLEDRIVE_FIND_FILE': {'files': []}}, deal=deal)
    assert "name contains 'O\\'Neil Labs'" in calls[0][1]['q']


def test_clay_and_lemlist_records_for_the_company():
    responses = {'CLAY_SEARCH_PEOPLE_OR_COMPANIES': {'data': [{'name': 'Acme', 'domain': 'acme.test', 'size': '501-1,000', 'industry': 'Software'}], 'has_more': False},
                 'LEMLIST_LIST_COMPANIES': {'data': [{'_id': 'co2', 'domain': 'other.test', 'fields': {'name': 'Other'}}, {'_id': 'co1', 'domain': 'acme.test', 'fields': {'name': 'Acme'}}]},
                 'LEMLIST_LIST_COMPANY_NOTES': {'data': [{'note': 'Replied: evaluating Backstage in Q1', 'createdAt': '2026-10-01'}]}}
    text, _, calls = run_context({'clay': 'c', 'lemlist': 'l'}, responses)
    args = dict(calls)
    assert args['CLAY_SEARCH_PEOPLE_OR_COMPANIES'] == {'query': 'select from companies where domain = "acme.test"', 'limit': 1}
    assert args['LEMLIST_LIST_COMPANIES'] == {'search': 'Acme', 'limit': 5}
    assert args['LEMLIST_LIST_COMPANY_NOTES'] == {'companyId': 'co1', 'limit': 10}
    assert '501-1,000' in text and 'evaluating Backstage in Q1' in text and 'other.test' not in text
    nodomain = {'name': 'Acme', 'data': {'fields': []}}
    text, _, calls = run_context({'clay': 'c'}, {}, deal=nodomain)
    assert calls == [] and 'Clay: skipped' in text


def test_canva_titles_only_and_figma_only_linked_files():
    deal = {'name': 'Acme', 'data': {'brand': {'website': 'acme.test'}, 'fields': [{'key': 'notes', 'value': 'Mockups https://www.figma.com/design/AbCdEfGhIjKl123/Acme-portal'}]}}
    responses = {'CANVA_LIST_USER_DESIGNS': {'items': [{'id': 'D1', 'title': 'Acme one-pager', 'urls': {'view_url': 'https://canva.test/D1', 'edit_url': 'https://canva.test/edit'}, 'thumbnail': {'url': 'x'}}, {'id': 'D2', 'title': 'Unrelated'}]},
                 'FIGMA_GET_FILE_METADATA': {'name': 'Acme portal', 'url': 'https://figma.com/design/AbCdEfGhIjKl123', 'last_touched_at': '2026-10-01'},
                 'FIGMA_GET_COMMENTS_IN_A_FILE': {'comments': [{'message': 'Use the Acme green', 'user': {'handle': 'pat'}, 'created_at': '2026-10-02'}]}}
    text, _, calls = run_context({'canva': 'v', 'figma': 'fi'}, responses, deal=deal)
    args = dict(calls)
    assert args['CANVA_LIST_USER_DESIGNS'] == {'query': 'Acme', 'limit': 10, 'ownership': 'any', 'sort_by': 'relevance'}
    assert args['FIGMA_GET_FILE_METADATA'] == {'file_key': 'AbCdEfGhIjKl123'}
    assert 'Acme one-pager' in text and 'https://canva.test/D1' in text and 'canva.test/edit' not in text and 'Unrelated' not in text
    assert 'Use the Acme green' in text
    text, _, calls = run_context({'figma': 'fi'}, {})
    assert calls == [] and 'no Figma file is linked' in text


def test_total_budget_and_time_budget_cap_new_sources():
    huge = {'values': [['x' * 400] * 26] * 60}
    responses = {'GOOGLESHEETS_SEARCH_SPREADSHEETS': {'spreadsheets': [{'id': 's1', 'name': 'Acme a'}, {'id': 's2', 'name': 'Acme b'}, {'id': 's3', 'name': 'Acme c'}]},
                 'GOOGLESHEETS_VALUES_GET': huge}
    text, _, calls = run_context({'googlesheets': 's'}, responses)
    assert len([c for c in calls if c[0] == 'GOOGLESHEETS_VALUES_GET']) == 2
    assert text.count('[truncated]') == 2 and len(text) < 2 * worker.LIVE_FILE_CHARS + 2000
    clock = iter([0, 0, 100, 100, 100, 100])
    with patch.object(worker.time, 'monotonic', side_effect=lambda: next(clock, 100)):
        text, _, calls = run_context({'googlesheets': 's'}, responses)
    assert 'googlesheets unavailable; do not infer' in text


def test_mention_excerpt_keeps_company_windows():
    text = 'a ' * 5000 + 'Acme has 500 engineers' + ' b' * 5000
    out = worker.mention_excerpt(text, 'Acme', limit=2000)
    assert 'Acme has 500 engineers' in out and len(out) <= 2100
    assert worker.mention_excerpt('short', 'Acme') == 'short'
