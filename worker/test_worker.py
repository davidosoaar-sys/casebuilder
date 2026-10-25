"""Tests for the worker's edit parser. Run from worker/: python3 -m unittest test_worker.py"""
import os, sys, unittest

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SECRET_KEY", "test")
sys.path.insert(0, os.path.dirname(__file__))
import worker  # noqa: E402

DEAL = {"name": "Acme", "data": {"name": "Acme", "fields": [
    {"key": "companyName", "type": "text", "value": "Acme"},
    {"key": "archetype", "type": "select", "value": "Enterprise", "options": ["Enterprise", "Scaling tech"]},
    {"key": "engineers", "label": "Engineers", "type": "number", "value": 500, "source": {"state": "input"}},
    {"key": "platformShare", "label": "Platform share", "type": "percent", "value": 30},
    {"key": "weeksPerYear", "type": "number", "value": 48, "structural": True},
    {"key": "hourlyCost", "type": "number", "value": "", "deleted": True},
]}}
FIELDS = worker.editable_fields(DEAL)


def reply(block):
    return f"Updated the headcount.\n```casebuilder-edits\n{block}\n```"


class ParseEdits(unittest.TestCase):
    def test_editable_excludes_text_and_structural(self):
        self.assertEqual([f["key"] for f in FIELDS], ["archetype", "engineers", "platformShare"])

    def test_valid_edit_and_block_removed(self):
        text, edits, rej = worker.parse_edits(reply('[{"key":"engineers","value":1200,"from_user":true,"reason":"You said so."}]'), FIELDS)
        self.assertEqual(text, "Updated the headcount.")
        self.assertEqual(edits, [{"key": "engineers", "value": 1200, "from_user": True, "reason": "You said so."}])
        self.assertEqual(rej, [])

    def test_no_block_means_no_edits(self):
        self.assertEqual(worker.parse_edits("Just an answer.", FIELDS), ("Just an answer.", [], []))

    def test_unknown_structural_and_text_fields_rejected(self):
        _, edits, rej = worker.parse_edits(reply('[{"key":"weeksPerYear","value":50},{"key":"companyName","value":"X"},{"key":"nope","value":1}]'), FIELDS)
        self.assertEqual(edits, [])
        self.assertEqual(len(rej), 3)

    def test_number_cleanup_and_ranges(self):
        _, edits, rej = worker.parse_edits(reply('[{"key":"engineers","value":"1,200"},{"key":"platformShare","value":140}]'), FIELDS)
        self.assertEqual([e["value"] for e in edits], [1200])
        self.assertEqual(len(rej), 1)

    def test_negative_and_text_numbers_rejected(self):
        _, edits, rej = worker.parse_edits(reply('[{"key":"engineers","value":-5},{"key":"platformShare","value":"lots"}]'), FIELDS)
        self.assertEqual(edits, [])
        self.assertEqual(len(rej), 2)

    def test_select_must_match_option(self):
        _, edits, rej = worker.parse_edits(reply('[{"key":"archetype","value":"Scaling tech"},{"key":"archetype","value":"Startup"}]'), FIELDS)
        self.assertEqual(edits, [{"key": "archetype", "value": "Scaling tech", "from_user": False, "reason": ""}])

    def test_bad_json_changes_nothing(self):
        text, edits, rej = worker.parse_edits(reply('[{"key": "engineers", value: 1}]'), FIELDS)
        self.assertEqual(edits, [])
        self.assertEqual(len(rej), 1)
        self.assertEqual(text, "Updated the headcount.")

    def test_prompt_lists_fields_and_history(self):
        p = worker.build_prompt({"kind": "chat", "payload": {"message": "Make it 1,200"}}, DEAL, [{"role": "user", "content": "hi"}])
        self.assertIn("engineers | Engineers", p)
        self.assertNotIn("weeksPerYear", p)
        self.assertIn("user: hi", p)
        self.assertIn("casebuilder-edits", p)
        self.assertIn("never say an earlier update failed", p)


class ParseCommands(unittest.TestCase):
    D = {"data": {**DEAL["data"], "stakeholders": [{"key": "champion", "builtin": True}, {"key": "economic", "builtin": True}]}}

    def block(self, b):
        return f"Running it.\n```casebuilder-commands\n{b}\n```"

    def test_valid_commands_and_block_removed(self):
        text, cmds, rej = worker.parse_commands(self.block('[{"command":"FIND_STAKEHOLDERS","role_key":"champion"},{"command":"SUGGEST_INPUTS","keys":["engineers","nope"]},{"command":"LOOKUP_PERSON","name":"Ada Lovelace","company":"Acme"},{"command":"DISCOVER_BRAND"}]'), self.D)
        self.assertEqual(text, "Running it.")
        self.assertEqual(cmds[0], {"command": "FIND_STAKEHOLDERS", "role_key": "champion"})
        self.assertEqual(cmds[1], {"command": "SUGGEST_INPUTS", "keys": ["engineers"]})
        self.assertEqual(cmds[2], {"command": "LOOKUP_PERSON", "name": "Ada Lovelace", "company": "Acme"})
        self.assertEqual(cmds[3], {"command": "DISCOVER_BRAND"})
        self.assertEqual(rej, [])

    def test_unknown_command_role_and_empty_lookup_rejected(self):
        _, cmds, rej = worker.parse_commands(self.block('[{"command":"DELETE_DEAL"},{"command":"FIND_STAKEHOLDERS","role_key":"ceo"},{"command":"LOOKUP_PERSON"},{"command":"FIND_STAKEHOLDERS","role_key":"all"}]'), self.D)
        self.assertEqual(cmds, [{"command": "FIND_STAKEHOLDERS", "role_key": "all"}])
        self.assertEqual(len(rej), 3)

    def test_capped_and_bad_json(self):
        five = ",".join(['{"command":"DISCOVER_BRAND"}'] * 6)
        _, cmds, rej = worker.parse_commands(self.block(f"[{five}]"), self.D)
        self.assertEqual(len(cmds), worker.MAX_COMMANDS)
        _, cmds, rej = worker.parse_commands(self.block("[{nope"), self.D)
        self.assertEqual(cmds, [])
        self.assertEqual(len(rej), 1)

    def test_edits_and_commands_in_one_reply(self):
        raw = 'Set it and searching.\n```casebuilder-edits\n[{"key":"engineers","value":900,"from_user":true}]\n```\n```casebuilder-commands\n[{"command":"FIND_STAKEHOLDERS","role_key":"economic"}]\n```'
        text, cmds, _ = worker.parse_commands(raw, self.D)
        text, edits, _ = worker.parse_edits(text, worker.editable_fields(self.D))
        self.assertEqual(text, "Set it and searching.")
        self.assertEqual(len(cmds), 1)
        self.assertEqual(edits[0]["value"], 900)

    def test_prompt_lists_commands_and_role_names(self):
        p = worker.build_prompt({"kind": "chat", "payload": {"message": "find the VP", "roles": [{"key": "champion", "role": "Director / VP Engineering", "tag": "Usually the champion"}, {"key": "finance", "role": "Finance / Procurement"}]}}, self.D)
        self.assertIn("FIND_STAKEHOLDERS", p)
        self.assertIn("- champion: Director / VP Engineering (Usually the champion)", p)
        self.assertIn("- finance: Finance / Procurement", p)
        self.assertIn("Never show command names", p)


class PinSearch(unittest.TestCase):
    def test_pins_tavily_once_and_keeps_existing_config(self):
        import tempfile
        with tempfile.TemporaryDirectory() as home:
            os.makedirs(os.path.join(home, "profiles", "acct-x"))
            cfg = os.path.join(home, "profiles", "acct-x", "config.yaml")
            open(cfg, "w").write("model:\n  default: m\n")
            old_home, old_key = worker.HOME, os.environ.get("TAVILY_API_KEY")
            worker.HOME, os.environ["TAVILY_API_KEY"] = home, "k"
            worker._pinned.clear()
            try:
                worker.pin_search("acct-x"); worker._pinned.clear(); worker.pin_search("acct-x")
            finally:
                worker.HOME = old_home
                if old_key is None: os.environ.pop("TAVILY_API_KEY", None)
                else: os.environ["TAVILY_API_KEY"] = old_key
            text = open(cfg).read()
            self.assertIn("model:\n  default: m\n", text)
            self.assertEqual(text.count("web:"), 1)
            self.assertIn("  backend: tavily", text)

    def test_no_key_no_pin(self):
        old = os.environ.pop("TAVILY_API_KEY", None)
        worker._pinned.clear()
        try:
            worker.pin_search("acct-none")  # must not raise or write
        finally:
            if old is not None: os.environ["TAVILY_API_KEY"] = old
        self.assertNotIn("acct-none", worker._pinned)


class Prompt(unittest.TestCase):
    def test_uses_the_users_name_not_chris(self):
        p = worker.build_prompt({"kind": "chat", "payload": {"message": "hi", "user_name": "Amr"}}, DEAL)
        self.assertIn("called Amr", p)
        self.assertNotIn("Chris", p)

    def test_attachments_included_and_capped(self):
        big = "x" * (worker.MAX_ATTACH_CHARS + 5000)
        p = worker.build_prompt({"kind": "chat", "payload": {"message": "see file", "attachments": [{"name": "call.txt", "text": "They have 900 engineers."}, {"name": "big.txt", "text": big}]}}, DEAL)
        self.assertIn("--- file: call.txt ---", p)
        self.assertIn("900 engineers", p)
        self.assertLess(p.count("x"), worker.MAX_ATTACH_CHARS + 100)


SEARCH_RESULT = ('<untrusted_tool_result source="web_search">\nDATA\n\n{"success": true, "data": {"web": ['
                 '{"title": "Backstage releases", "url": "https://github.com/backstage/backstage/releases", "description": "v1.56.2"},'
                 '{"title": "Docs", "url": "https://backstage.io/docs", "description": "d"}]}}\n</untrusted_tool_result>')
EXTRACT_RESULT = ('<untrusted_tool_result source="web_extract">\n{"results": [{"url": "https://www.betakit.com/a", '
                  '"title": "Shopify CTO departs", "content": "...", "error": null}]}\n</untrusted_tool_result>')


def fake_state_db(home, profile, started, calls):
    """A Hermes state.db with the two tables and columns session_trace reads."""
    import json, sqlite3
    d = os.path.join(home, "profiles", profile)
    os.makedirs(d, exist_ok=True)
    db = sqlite3.connect(os.path.join(d, "state.db"))
    db.execute("create table sessions (id text, started_at real)")
    db.execute("create table messages (id integer primary key, session_id text, role text, tool_calls text, tool_call_id text, content text, tool_name text)")
    db.execute("insert into sessions values ('old', ?)", (started - 500,))
    db.execute("insert into messages (session_id, role, tool_calls) values ('old', 'assistant', ?)",
               (json.dumps([{"id": "o1", "function": {"name": "web_search", "arguments": '{"query": "old run"}'}}]),))
    db.execute("insert into sessions values ('new', ?)", (started + 1,))
    for i, (name, args, result) in enumerate(calls):
        db.execute("insert into messages (session_id, role, tool_calls) values ('new', 'assistant', ?)",
                   (json.dumps([{"id": f"c{i}", "function": {"name": name, "arguments": json.dumps(args)}}]),))
        db.execute("insert into messages (session_id, role, tool_call_id, content, tool_name) values ('new', 'tool', ?, ?, ?)",
                   (f"c{i}", result, name))
    db.commit(); db.close()


class Trace(unittest.TestCase):
    def test_search_step_lists_query_and_results(self):
        s = worker.trace_step("web_search", {"query": "Backstage latest release"}, SEARCH_RESULT)
        self.assertEqual(s["provider"], "Tavily")
        self.assertIn("Backstage latest release", s["title"])
        self.assertEqual(s["output"], "2 results")
        self.assertEqual(s["results"][0]["url"], "https://github.com/backstage/backstage/releases")
        self.assertTrue(s["ok"])

    def test_extract_step_names_the_site(self):
        s = worker.trace_step("web_extract", {"urls": ["https://www.betakit.com/a"]}, EXTRACT_RESULT)
        self.assertEqual(s["title"], "Read betakit.com")
        self.assertEqual(s["output"], "Read 1 of 1 page")

    def test_failed_search_is_marked(self):
        s = worker.trace_step("web_search", {"query": "x"}, '{"success": false, "error": "rate limited"}')
        self.assertFalse(s["ok"])

    def test_session_trace_reads_only_this_run_and_skips_tool_search(self):
        import tempfile, time
        with tempfile.TemporaryDirectory() as home:
            t0 = time.time()
            fake_state_db(home, "acct-t", t0, [
                ("tool_search", {"q": "web"}, "{}"),
                ("web_search", {"query": "Backstage latest release"}, SEARCH_RESULT),
                ("web_extract", {"urls": ["https://www.betakit.com/a"]}, EXTRACT_RESULT)])
            old, worker.HOME = worker.HOME, home
            try:
                steps = worker.session_trace("acct-t", t0)
            finally:
                worker.HOME = old
        self.assertEqual([s["tool"] for s in steps], ["web_search", "web_extract"])
        self.assertNotIn("old run", steps[0]["title"])

    def test_missing_db_gives_empty_trace(self):
        self.assertEqual(worker.session_trace("acct-does-not-exist", 0), [])


CONN_DEAL = {"name": "Acme", "data": {"name": "Acme", "connectors": {"gong": True, "slack": False},
             "documents": [{"source": "gong", "name": "Discovery call", "text": "They run 40 squads."},
                           {"source": "slack", "name": "Internal thread", "text": "SECRET-SLACK"}]}}


class Connectors(unittest.TestCase):
    def test_only_switched_on_connectors_are_read(self):
        text, steps = worker.connector_context(CONN_DEAL)
        self.assertIn("40 squads", text)
        self.assertNotIn("SECRET-SLACK", text)
        self.assertEqual([(s["provider"], s["title"]) for s in steps], [("Gong", "Read Discovery call")])

    def test_nothing_on_nothing_read(self):
        self.assertEqual(worker.connector_context({"data": {"documents": CONN_DEAL["data"]["documents"]}}), ("", []))

    def test_chat_prompt_includes_connector_material(self):
        p = worker.build_prompt({"kind": "chat", "payload": {"message": "hi"}}, CONN_DEAL)
        self.assertIn("40 squads", p)
        self.assertNotIn("SECRET-SLACK", p)


class Research(unittest.TestCase):
    TRACE = [worker.trace_step("web_search", {"query": "q"}, SEARCH_RESULT),
             {"tool": "connector", "connector": "gong", "results": [], "input": {}}]

    def test_prompt_has_question_context_and_sources_contract(self):
        p = worker.build_research_prompt({"kind": "research", "payload": {"question": "Who leads platform at Acme?"}}, CONN_DEAL)
        self.assertIn("Who leads platform at Acme?", p)
        self.assertIn("deal with Acme", p)
        self.assertIn(worker.SOURCES_FENCE, p)
        self.assertNotIn("SECRET-SLACK", p)
        self.assertNotIn("casebuilder-edits", p)

    def test_prompt_without_deal(self):
        p = worker.build_research_prompt({"kind": "research", "payload": {"question": "What is Backstage?"}}, None)
        self.assertNotIn("Context:", p)

    def test_sources_kept_only_when_tools_returned_them(self):
        text = ("Backstage is at v1.56.2 [1]. Squads [2]. Made up [3].\n```casebuilder-sources\n"
                '[{"n":1,"url":"https://github.com/backstage/backstage/releases/","title":"Releases"},'
                '{"n":2,"url":"gong","title":"Gong"},'
                '{"n":3,"url":"https://invented.example.com/x","title":"Fake"}]\n```')
        clean, sources, dropped = worker.parse_sources(text, self.TRACE)
        self.assertNotIn("casebuilder-sources", clean)
        self.assertEqual([s["n"] for s in sources], [1, 2])
        self.assertEqual(sources[1]["connector"], "gong")
        self.assertEqual(dropped, 1)

    def test_no_block_no_sources(self):
        self.assertEqual(worker.parse_sources("plain answer", self.TRACE), ("plain answer", [], 0))


class ProjectFiles(unittest.TestCase):
    ROWS = [{"name": "Project instructions", "kind": "instructions", "text": "Always open with the CFO cost target."},
            {"name": "Nike FY26 report.pdf", "kind": "context", "text": "Nike employs 1,400 software engineers."},
            {"name": "Best deck.pptx", "kind": "deck_inspiration", "text": "--- Slide 1 ---\nThe number"}]

    def test_instructions_files_and_inspiration_in_prompt(self):
        text, steps = worker.files_prompt(self.ROWS)
        self.assertIn("Always open with the CFO cost target.", text)
        self.assertIn("--- File: Nike FY26 report.pdf ---", text)
        self.assertIn("--- File: Best deck.pptx ---", text)
        self.assertIn("Never carry another client's numbers", text)
        self.assertEqual([s["title"] for s in steps], ["Read the project instructions", "Read Nike FY26 report.pdf", "Read Best deck.pptx"])

    def test_budget_cuts_and_says_so(self):
        big = [{"name": f"f{i}.txt", "kind": "context", "text": "x" * 70000} for i in range(3)]
        text, steps = worker.files_prompt(big)
        self.assertLessEqual(text.count("x" * 1000), worker.MAX_FILE_CHARS // 1000)
        self.assertIn("Too long to read in full: f1.txt, f2.txt", text)

    def test_chat_prompt_carries_files(self):
        text, _ = worker.files_prompt(self.ROWS)
        p = worker.build_prompt({"kind": "chat", "payload": {"message": "how many engineers?"}}, DEAL, (), text)
        self.assertIn("1,400 software engineers", p)

    def test_no_deal_no_files(self):
        self.assertEqual(worker.project_files_context(None, "u"), ("", []))



class StakeholderBrief(unittest.TestCase):
    MATERIAL = "--- File: call 1.txt ---\nDana (CFO): We need payback inside nine months, or this does not go to the board."

    def block(self, obj):
        import json as _j
        return f"Here it is.\n```{worker.BRIEF_FENCE}\n{_j.dumps(obj)}\n```"

    def test_valid_brief_keeps_real_quote(self):
        b, dropped = worker.parse_brief(self.block({
            "summary": "Supportive if payback is fast.", "stance": "supportive",
            "cares_about": ["payback"], "concerns": ["board approval"],
            "decisions": [{"text": "Payback target is 9 months", "date": "2026-10-20", "source": "call 1.txt"}],
            "open_asks": [{"text": "Send the payback maths", "owner": "us", "status": "open", "source": "call 1.txt"}],
            "quotes": [{"text": "We need payback inside nine months", "source": "call 1.txt"}],
            "next_step": "Lead with payback."}), self.MATERIAL)
        self.assertEqual(dropped, 0)
        self.assertEqual(b["stance"], "supportive")
        self.assertEqual(b["quotes"], [{"text": "We need payback inside nine months", "source": "call 1.txt"}])
        self.assertEqual(b["open_asks"][0]["owner"], "us")

    def test_people_must_appear_in_the_material(self):
        b, _ = worker.parse_brief(self.block({"summary": "x", "people": ["Dana (CFO)", "Ghost Person (CFO)"]}), self.MATERIAL)
        self.assertEqual(b["people"], ["Dana (CFO)"])

    def test_invented_quote_is_dropped(self):
        b, dropped = worker.parse_brief(self.block({"summary": "x", "quotes": [
            {"text": "We will sign this week", "source": "call 1.txt"},
            {"text": "or this does not go to the board", "source": "call 1.txt"}]}), self.MATERIAL)
        self.assertEqual(dropped, 1)
        self.assertEqual([q["text"] for q in b["quotes"]], ["or this does not go to the board"])

    def test_quote_matching_ignores_curly_quotes_and_spacing(self):
        b, dropped = worker.parse_brief(self.block({"summary": "x", "quotes": [{"text": "\u201cWe  need payback\u201d", "source": "f"}]}), self.MATERIAL)
        self.assertEqual(dropped, 0)
        self.assertEqual(len(b["quotes"]), 1)

    def test_bad_values_are_normalised(self):
        b, _ = worker.parse_brief(self.block({"summary": "x", "stance": "LOVES US",
            "open_asks": [{"text": "a", "status": "whenever", "owner": "?"}]}), "")
        self.assertEqual(b["stance"], "unknown")
        self.assertEqual(b["open_asks"][0], {"text": "a", "owner": "us", "status": "open", "source": ""})

    def test_unreadable_or_empty_brief_is_none(self):
        self.assertEqual(worker.parse_brief("no json here", "")[0], None)
        self.assertEqual(worker.parse_brief(self.block({"summary": ""}), "")[0], None)

    def test_brief_leaves_out_project_instructions(self):
        rows = [{"kind": "instructions", "name": "Project instructions", "text": "Open with the CFO cost target."},
                {"kind": "context", "name": "call.txt", "text": "Priya: payback under 12 months."}]
        with_i, _ = worker.files_prompt(rows)
        without, _ = worker.files_prompt([r for r in rows if r.get("kind") != "instructions"])
        self.assertIn("CFO cost target", with_i)
        self.assertNotIn("CFO cost target", without)
        self.assertIn("call.txt", without)

    def test_prompt_is_about_one_stakeholder_and_says_synthesis(self):
        deal = {"name": "Acme", "data": {"name": "Acme", "connectors": {"granola": True},
                "documents": [{"source": "granola", "name": "Kickoff", "text": "notes"}]}}
        p = worker.build_brief_prompt({"payload": {"role": "CFO", "people": ["Dana Whitlock"]}}, deal, "")
        self.assertIn("the CFO (Dana Whitlock) at Acme", p)
        self.assertIn("not a transcript", p)
        self.assertIn("Granola: Kickoff", p)
        self.assertIn(worker.BRIEF_FENCE, p)

if __name__ == "__main__":
    unittest.main()


class ProjectResearchInChat(unittest.TestCase):
    ROWS = [{"payload": {"question": "how many engineers does apple have"}, "created_at": "2026-10-25T20:00:00Z",
             "result": {"text": "Tens of thousands; 20,000 to 70,000 depending on definition [1].",
                        "sources": [{"n": 1, "title": "Apple 10-K", "url": "https://sec.gov/x"}]}},
            {"payload": {"question": "empty"}, "result": {"text": ""}}]

    def test_research_reaches_the_chat_prompt_with_sources(self):
        text, steps = worker.research_prompt(self.ROWS)
        self.assertIn("how many engineers does apple have", text)
        self.assertIn("20,000 to 70,000", text)
        self.assertIn("[1] Apple 10-K https://sec.gov/x", text)
        self.assertEqual(len(steps), 1, "runs with no answer are skipped")
        p = worker.build_prompt({"kind": "chat", "payload": {"message": "can you see my research?"}}, DEAL, (), "", text)
        self.assertIn("Research the user already ran on this project", p)

    def test_no_research_adds_nothing(self):
        self.assertEqual(worker.research_prompt([]), ("", []))


class ApprovalEmail(unittest.TestCase):
    def test_wording_names_the_recipient_address(self):
        m = worker.approval_message("mia@example.com", "Mia Mail", app_url="https://app.example", sender="cb@gmail.com")
        body = m.get_content()
        self.assertIn("Hi Mia,", body)
        self.assertIn("Sign up with mia@example.com, the address this email was sent to.", body)
        self.assertIn("https://app.example", body)
        self.assertNotIn("enter this email", body.lower())
        self.assertEqual(m["To"], "mia@example.com")
        self.assertEqual(m["From"], "CaseBuilder <cb@gmail.com>")
        self.assertNotIn("Hi ,", worker.approval_message("x@y.com", "").get_content())

    def test_claims_sends_and_records(self):
        calls, sent = [], []
        def fake_api(method, path, body=None, prefer=None):
            calls.append((method, path, body))
            if method == "GET":
                return [{"id": "1", "email": "a@x.com", "name": "Ann"}, {"id": "2", "email": "b@x.com", "name": ""}]
            if body == {"approval_email": "sending"}:
                return [] if "id=eq.2" in path else [{"id": "1"}]  # row 2 taken by another worker
            return None
        class FakeSMTP:
            def __enter__(self): return self
            def __exit__(self, *a): return False
            def login(self, u, p): pass
            def send_message(self, m): sent.append(m["To"])
        old = (worker.api, worker.GMAIL_USER, worker.GMAIL_APP_PASSWORD)
        worker.api, worker.GMAIL_USER, worker.GMAIL_APP_PASSWORD = fake_api, "cb@gmail.com", "pw"
        try:
            self.assertEqual(worker.send_approval_emails(smtp_factory=FakeSMTP), 1)
        finally:
            worker.api, worker.GMAIL_USER, worker.GMAIL_APP_PASSWORD = old
        self.assertEqual(sent, ["a@x.com"])
        final = [b for m, p, b in calls if m == "PATCH" and "id=eq.1" in p and b.get("approval_email") == "sent"]
        self.assertEqual(len(final), 1)

    def test_no_credentials_sends_nothing(self):
        old = worker.GMAIL_APP_PASSWORD
        worker.GMAIL_APP_PASSWORD = ""
        try:
            self.assertEqual(worker.send_approval_emails(), 0)
        finally:
            worker.GMAIL_APP_PASSWORD = old


class AnyProvider(unittest.TestCase):
    def test_tiers_map_per_provider(self):
        self.assertEqual(worker.provider_model("anthropic", "claude-opus-5-5"), "claude-opus-5-5")
        self.assertEqual(worker.provider_model("openai", "claude-opus-5-5"), "gpt-5.6-sol")
        self.assertEqual(worker.provider_model("google", "claude-haiku-5-5"), "gemini-3.5-flash-lite")
        self.assertEqual(worker.provider_model("openrouter", "claude-sonnet-5-5"), "anthropic/claude-sonnet-5.5")

    def test_hermes_gets_the_right_flag_env_var_and_model(self):
        import tempfile, subprocess as sp
        seen = {}
        def fake_run(cmd, cwd=None, env=None, capture_output=None, text=None, timeout=None):
            if cmd[0] == "shred":
                os.unlink(cmd[-1]); return sp.CompletedProcess(cmd, 0, "", "")
            seen["cmd"] = cmd
            seen["envfile"] = open(os.path.join(env["HERMES_HOME"], ".env")).read()
            seen["env"] = env
            return sp.CompletedProcess(cmd, 0, "ok", "")
        old = (worker.HOME, worker.subprocess.run)
        with tempfile.TemporaryDirectory() as h:
            os.makedirs(os.path.join(h, "profiles", "p"))
            worker.HOME, worker.subprocess.run = h, fake_run
            os.environ["OPENAI_API_KEY"] = "leak"
            try:
                worker.run_hermes("p", "hi", "sk-or-v1-abc", "claude-opus-5-5", provider="openrouter")
            finally:
                worker.HOME, worker.subprocess.run = old
                os.environ.pop("OPENAI_API_KEY", None)
        cmd = seen["cmd"]
        self.assertEqual(cmd[cmd.index("--provider") + 1], "openrouter")
        self.assertEqual(cmd[cmd.index("-m") + 1], "anthropic/claude-opus-5.5")
        self.assertIn("OPENROUTER_API_KEY=sk-or-v1-abc", seen["envfile"])
        self.assertNotIn("ANTHROPIC_API_KEY", seen["envfile"])
        self.assertNotIn("OPENAI_API_KEY", seen["env"])  # no other key leaks in from the worker's env


class ChatHistory(unittest.TestCase):
    def test_reply_goes_to_the_payload_chat(self):
        cid = "11111111-2222-3333-4444-555555555555"
        self.assertEqual(worker.chat_for({"payload": {"chat_id": cid}, "deal_id": "d", "owner_id": "o"}), cid)

    def test_old_jobs_fall_back_to_the_latest_user_message_chat(self):
        old = worker.api
        worker.api = lambda m, p, b=None, prefer=None: [{"chat_id": "abc"}] if "role=eq.user" in p else []
        try:
            self.assertEqual(worker.chat_for({"payload": {"chat_id": "not-a-uuid"}, "deal_id": "d", "owner_id": "o"}), "abc")
            self.assertIsNone(worker.chat_for({"payload": {}, "owner_id": "o"}))
        finally:
            worker.api = old
