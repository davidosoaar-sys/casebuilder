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


if __name__ == "__main__":
    unittest.main()
