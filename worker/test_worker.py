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


if __name__ == "__main__":
    unittest.main()
