# Manual company discovery checks

Tested locally on v0.26.1, 2026-10-28 to 2026-10-29. Company names were typed into New project in the real app. No sample-project shortcut or seeded brand assets were used. New test deals were created in the signed-in account; existing cases were not edited.

| Typed name | Resolved site | Logo visible on cover | Side image visible | Assessment |
| --- | --- | --- | --- | --- |
| xboxx | xbox.com/en-US/ | No | Yes, Halo campaign | Typo resolved, but logo discovery incomplete. |
| Sony | sony.com/en/ | Yes | Yes, Kando Trip campaign | Cover rendered; concurrent-tab save conflict prevented claiming persistence passed. |
| playstation | PlayStation discovery | No | Yes, PlayStation/SSD artwork | Image rendered, but logo discovery incomplete. |
| git | git-scm.com | Yes | Yes, Pro Git book cover | Literal Git resolved, not GitHub. Book cover is sourced but a weak cover-art choice. |
| nvidia | nvidia.com/location-selector/ | Yes | Yes, NVIDIA DSX/data-center artwork | Logo and side image rendered. |

## Input simulation

Manually typed seven fictional assumptions into the new playstation case: 500 engineers, $100/hour, search time 3 to 1 hours/week, onboarding 20 to 10 days, and 50 hires/year. No values were marked confirmed. Two drivers became computable: $4.8M recovered engineering capacity and $400k onboarding capacity, totaling $5.2M. Remaining incomplete drivers stayed absent from the total. These are test assumptions, not company research.

## Limits and follow-up

- This checks local browser discovery and covers; it does not establish Google Slides export for all five cases or deployed-site behavior.
- A concurrent Sony test tab displayed a newer-copy save conflict. Other tests were completed sequentially; Sony persistence needs a clean retry.
- All five cases displayed a side image in this run. That is not a guarantee for arbitrary companies or future site changes.
- Improve Xbox/PlayStation logo extraction and asset ranking for book/editorial covers. Do not replace missing assets with unrelated stock imagery.
- Empty-input deck headings still showed incomplete payback wording. This was observed, not changed during these checks.
