#!/usr/bin/env python3
"""v0.4.1 auth settings on the live Supabase project. Prints only changed keys."""
import json, os, re, urllib.request

root = os.path.expanduser('~/Projects/casebuilder')
env = dict(l.strip().split('=', 1) for l in open(os.path.expanduser('~/.config/casebuilder/supabase-admin.env')) if re.match(r'^[A-Z_]+=', l))
url = re.search(r'VITE_SUPABASE_URL=https://([^.]+)\.', open(f'{root}/.env.local').read()).group(1)
api = f'https://api.supabase.com/v1/projects/{url}/config/auth'
hdr = {'Authorization': f"Bearer {env['SUPABASE_ACCESS_TOKEN']}", 'Content-Type': 'application/json', 'User-Agent': 'casebuilder-setup'}

box = 'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111'
code = '<p style="font-size:28px;font-weight:700;letter-spacing:4px">{{ .Token }}</p>'
want = {
    'security_update_password_require_current_password': True,
    'password_min_length': 10,
    'mailer_notifications_password_changed_enabled': True,
    'mailer_subjects_password_changed_notification': 'Your CaseBuilder password was changed',
    'mailer_templates_password_changed_notification_content': (
        f'<div style="{box}"><h2>Your password was changed</h2>'
        '<p>The password for your CaseBuilder account ({{ .Email }}) was just changed.</p>'
        '<p>If this was you, you can ignore this email.</p>'
        '<p>If it was not you, open CaseBuilder, choose <b>Forgot password?</b> on the sign-in '
        'screen to set a new one, and reply to this email so we can look into it.</p></div>'),
    'mailer_subjects_recovery': 'Your CaseBuilder password reset code: {{ .Token }}',
    'mailer_templates_recovery_content': (
        f'<div style="{box}"><h2>Reset your CaseBuilder password</h2>'
        f'<p>Your reset code is:</p>{code}'
        '<p>Type it into the reset screen. It expires in 1 hour.</p>'
        '<p>If you did not ask for this, ignore this email. Your password stays the same.</p></div>'),
}

def call(method, body=None):
    req = urllib.request.Request(api, method=method, headers=hdr, data=json.dumps(body).encode() if body else None)
    return json.load(urllib.request.urlopen(req))

before = call('GET')
after = call('PATCH', want)
for k, v in want.items():
    ok = after.get(k) == v
    shown = v if not isinstance(v, str) or len(v) < 60 else v[:57] + '...'
    print('OK ' if ok else 'BAD', k, ':', repr(before.get(k))[:40], '->', repr(shown))
