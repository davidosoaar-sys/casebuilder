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
        self.assertIn("--- Context file: Nike FY26 report.pdf ---", text)
        self.assertIn("--- Deck inspiration file: Best deck.pptx ---", text)
        self.assertIn("never their numbers", text)
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


if __name__ == "__main__":
    unittest.main()
