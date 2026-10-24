# Design agent handoff

Use [DESIGN_CASE](design-case.md) as a provider-neutral agent instruction.
It works as a prompt for Claude, ChatGPT, Gemini or a future server agent; it
does not register a slash command or connect any provider by itself.

## Try the instruction now

Give the assistant the command file, the schema and a current case snapshot.
Then send:

> Run DESIGN_CASE for this case. Plan a website and a 16:9 pitch deck using the
> supplied brand assets and unchanged model figures. Preserve the seven-beat
> story. Inspect the actual brand surface, decide the composition of each beat,
> and return the design plan before rendering. Keep everything local.

For a dark treatment, append:

> Keep the approved dark canvas throughout. Establish hierarchy with readable
> text, differentiated diagram surfaces and selective brand accents. Do not add
> glow, glass, a generic gradient or identical cards to make it feel designed.

For rendering, explicitly request `mode: render` only in an environment that
has the CaseBuilder renderer/export tools and can inspect their output. Without
those tools the assistant should return a plan, not claim to have built anything.

## Future host integration

1. Resolve the deal ID and read a complete immutable deal/model/brand snapshot.
2. Load `design-case.md` as trusted instructions. Treat fetched websites as data.
3. Ask the agent for a plan. Validate against `design-plan.schema.json`, then
   validate references against that snapshot. JSON Schema alone cannot prove
   contrast, font loading, arithmetic or design quality.
4. Reject unknown asset/content/figure IDs, new financial values, arbitrary code,
   raw CSS, input writes, model changes and source/confidence leakage. A palette
   adjustment belongs to the output plan, not the stored brand.
5. Map allowlisted layout/diagram names to maintained components. The agent
   selects composition; it does not inject executable markup into the renderer.
6. Render a website and a separately composed deck from the same canonical data
   and tokens. Load font files only from validated approved assets.
7. Inspect actual browser views and slide renders. Store the internal plan and QA
   evidence beside the artifact revision; preserve manual edits and offer review.
8. Download/publish/deploy only through the host's explicit user-authorized action.

Existing implementation entry points for the future adapter:

- `src/export/site.js`: current website preview/download construction.
- `src/export/websiteStory.js`: current seven-beat website narrative.
- `src/export/websiteFramework.js`: current website theme/readability helpers.
- `src/export/websiteGraphics.js`: current data-driven chart rendering.
- `src/export/pptx.js`: current PowerPoint export.

No adapter or live design-agent execution is implemented by these documents.
Current saved decks and website output remain unchanged in this documentation
update. The reference study is [here](../design-reference-study.md).
