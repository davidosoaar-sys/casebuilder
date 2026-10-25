# CaseBuilder acceptance checks

Run the offline fixture before a Claude-host demo. Then use the same commands
with enabled real tools on your own Claude instance. Do not claim Claude-host
verification from a Node-only test.

| Check | Pass condition |
| --- | --- |
| Trigger | New, assets, lookup, stakeholders and build route to the intended skill; malformed requests fail clearly. |
| Evidence | Every rendered researched claim has its own supporting URL. Unsourced/disabled-source claims are dropped. Page meaning is checked by the agent, not the URL validator. |
| Uncertainty | Missing fields say not found; two matching people trigger candidate selection. Unknown titles still get a low-confidence nearest-role inference. |
| Case writes | Person lookup does not change the case; Add to deal is explicit. Suggested numeric inputs require separate review. |
| Arithmetic | Only CLI/model computes figures. Missing values remain incomplete; formulas are unchanged. |
| Branding | Official logo remains visible/unmodified; fonts actually load or have explicit fallbacks. No made-up brand assets. |
| Output | Company identity, overview, impact, drivers, changes, alternative and stakeholders have a deliberate layout; one-pager stays a legible one-page summary. |
| Failures | Missing Node, unavailable web, disabled connector and failed asset download yield partial results with reasons; no false success. |

All evidence, case-write and arithmetic checks are hard gates. For visual review,
rate hierarchy, readability, brand fidelity and evidence clarity 1–5 with one
specific observation each; below 4 requires revision. These scores are human
judgments, not deterministic proof of quality. A clean code check is insufficient.

## Claude-host smoke test

1. Load the local plugin in Claude Code with `claude --plugin-dir ./plugin`.
2. Run `/casebuilder:run Northwind Example` with `examples/discovery.txt` attached;
   tell Claude it is a fictional offline fixture, with no live research.
3. Observe creation, source extraction, CLI calculation and requested local outputs.
4. Run `/casebuilder:lookup Alex Example` with web unavailable: it must report the
   limitation, not return an invented person. Test an ambiguous real-name lookup
   separately with enabled browsing.
5. Run assets with `web` disabled: no URL should be fetched. Re-enable web and
   inspect official asset findings for a chosen public company.
6. Confirm candidate research changes nothing until selection; inspect the case
   before and after an explicit addition and a separate suggested-input review.
7. Verify branding/figures in outputs and that no publish step occurred.
