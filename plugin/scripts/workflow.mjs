// plugin-src/workflow.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// src/connectors.js
var CONNECTORS = [
  { key: "gmail", label: "Gmail", blurb: "Customer email threads and follow-ups", allows: "read uploaded or pasted Gmail email threads", accepts: "a pasted email thread or a .txt / .pdf export", docLabel: "Gmail thread" },
  { key: "claude", label: "Claude", blurb: "Conversation exports and research notes", allows: "read Claude conversations and research notes", accepts: "a pasted conversation or a .txt / .md export", docLabel: "Claude conversation" },
  { key: "gong", label: "Gong", blurb: "Call transcripts", allows: "read call transcripts", accepts: "a transcript (paste, or a .txt / .vtt file)", docLabel: "Call transcript" },
  { key: "hubspot", label: "HubSpot", blurb: "CRM deal and contact records", allows: "read CRM deal and contact records", accepts: "a CSV export of the deal", docLabel: "HubSpot export" },
  { key: "slack", label: "Slack", blurb: "Internal threads", allows: "read internal threads", accepts: "a pasted thread or export", docLabel: "Slack thread" },
  { key: "clay", label: "Clay", blurb: "Company and contact enrichment", allows: "read company and contact enrichment", accepts: "a CSV export or pasted record", docLabel: "Clay record" },
  { key: "lemlist", label: "Lemlist", blurb: "Outreach campaigns and replies", allows: "read outreach campaigns and replies", accepts: "a CSV export or pasted replies", docLabel: "Lemlist export" },
  { key: "granola", label: "Granola", blurb: "Meeting notes and call summaries", allows: "read meeting notes and call summaries", accepts: "pasted notes or an exported .md / .txt / .pdf", docLabel: "Granola notes" },
  { key: "sheets", label: "Google Sheets", blurb: "Finance models and forecasts", allows: "read finance models and forecasts", accepts: "a sheet downloaded as .xlsx or .csv", docLabel: "Google Sheet" },
  { key: "excel", label: "Excel", blurb: "Finance models and forecasts", allows: "read finance models and forecasts", accepts: "an .xlsx or .csv file", docLabel: "Excel workbook" },
  { key: "figma", label: "Figma", blurb: "Design specs and handoff notes", allows: "read design specs and handoff notes", accepts: "a design spec exported as .pdf, or pasted notes", docLabel: "Figma export" },
  { key: "canva", label: "Canva", blurb: "Decks and one-pagers", allows: "read decks and one-pagers", accepts: "a design downloaded as .pdf or .pptx", docLabel: "Canva design" }
];
var connectorByKey = Object.fromEntries(CONNECTORS.map((c) => [c.key, c]));

// src/format.js
function fmtMoney(n) {
  if (n == null || isNaN(n)) return "-";
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
  if (abs >= 1e3) return `$${Math.round(n / 1e3)}k`;
  return `$${Math.round(n)}`;
}
function fmtDec(n, max = 2) {
  if (n == null || isNaN(n)) return "-";
  return Number(n.toFixed(max)).toLocaleString("en-US", { maximumFractionDigits: max });
}
function fmtHours(n) {
  if (n == null || isNaN(n)) return "-";
  if (n >= 1e3) return `${Math.round(n / 1e3)}k hours`;
  return `${Math.round(n)} hours`;
}
function fmtMonths(n) {
  if (n == null || isNaN(n) || n <= 0) return "n/a";
  const r = n < 10 ? Math.max(0.01, Math.round(n * 100) / 100) : Math.round(n);
  return `${fmtDec(r, 2)} ${r === 1 ? "month" : "months"}`;
}

// src/source.js
var ORIGIN = {
  input: "Confirmed by the customer",
  assumption: "Your own read",
  edited: "Your own number (edited from a suggestion)",
  calendar: "Calendar constant"
};
var emptySource = () => ({ state: "empty", origin: "" });

// src/valueModel.js
var WORKING_WEEKS = 48;
var HOURS_PER_YEAR = 2080;
var PILLARS = [
  { key: "speed", label: "Speed", blurb: "Engineers spend their time building, not searching.", color: "#2fc7a8" },
  { key: "chaos", label: "Chaos-control", blurb: "Fewer and shorter incidents, with clear owners.", color: "#e5399a" },
  { key: "scale", label: "Scale", blurb: "The platform grows without growing the upkeep.", color: "#111111" }
];
var DRIVERS = [
  { key: "productivity", label: "Engineer time recovered", short: "Productivity", pillar: "speed", figure: "productivityValue" },
  { key: "onboarding", label: "Faster onboarding", short: "Onboarding", pillar: "speed", figure: "onboardingValue" },
  { key: "incidents", label: "Shorter incidents", short: "Incidents", pillar: "chaos", figure: "incidentValue" },
  { key: "standards", label: "Audit and compliance work avoided", short: "Standards", pillar: "chaos", figure: "standardsValue" },
  { key: "platform", label: "Platform team maintenance avoided", short: "Platform load", pillar: "scale", figure: "platformValue" },
  { key: "tooling", label: "Overlapping tooling retired", short: "Tooling", pillar: "scale", figure: "toolingValue" }
].map((d) => ({ ...d, color: PILLARS.find((p) => p.key === d.pillar).color }));
var STRATEGIC_PRIORITIES = ["Audit and compliance", "AI initiative", "Migration", "Cost pressure"];
var FIELD_DEFS = [
  // ---- Account
  { key: "companyName", label: "Company", group: "Account", type: "text", value: "Northwind Retail", confirmed: true, help: "Who the case is for." },
  {
    key: "archetype",
    label: "Archetype",
    group: "Account",
    type: "select",
    options: ["Fast / AI-native", "Scaling tech", "Enterprise", "Regulated enterprise"],
    value: "Enterprise",
    confirmed: true,
    help: "Sets which stakeholder tabs exist and which pillar leads the case."
  },
  {
    key: "strategicPriority",
    label: "What their leadership cares about this year",
    group: "Account",
    type: "select",
    options: STRATEGIC_PRIORITIES,
    value: "Cost pressure",
    confirmed: true,
    help: "Sets which driver leads the deck. Separate from the archetype: that is the shape of the company, this is what is happening to them this year."
  },
  // ---- Scale
  { key: "engineers", label: "Engineers", group: "Scale", type: "number", value: 500, confirmed: true, help: "Usually findable from LinkedIn before the first call." },
  {
    key: "platformShare",
    label: "Share of engineering that is platform / DevEx",
    group: "Scale",
    type: "percent",
    value: 30,
    confirmed: false,
    help: "Chris's rule: roughly 30% of the engineering org is platform or DevEx. The platform headcount is worked out from this."
  },
  { key: "hourlyCost", label: "Fully loaded cost per engineer hour", group: "Scale", type: "number", value: 100, unit: "$/hr", confirmed: false, help: "Salary, benefits and overhead. Chris uses $100/hr in his worked example." },
  {
    key: "maintPctToday",
    label: "Platform team time spent maintaining the portal, today",
    group: "Scale",
    type: "number",
    value: 4,
    unit: "%",
    step: 0.5,
    confirmed: false,
    pair: "maint",
    side: "today",
    help: "Share of the platform / DevEx team (not all engineers) kept busy upgrading, patching and running their current portal or wiki."
  },
  { key: "maintPctPortal", label: "Platform team time spent maintaining the portal, with Portal", group: "Scale", type: "number", value: 2, unit: "%", step: 0.5, confirmed: false, pair: "maint", side: "portal" },
  { key: "toolSpendToday", label: "Overlapping tool spend, today", group: "Scale", type: "number", value: 18e4, unit: "$/yr", step: 5e3, confirmed: false, pair: "tool", side: "today", help: "What they pay each year for tools Portal would replace or consolidate." },
  { key: "toolSpendPortal", label: "Overlapping tool spend, with Portal", group: "Scale", type: "number", value: 9e4, unit: "$/yr", step: 5e3, confirmed: false, pair: "tool", side: "portal" },
  // ---- Speed
  {
    key: "searchHoursToday",
    label: "Time spent searching for docs, services and owners, today",
    group: "Speed",
    type: "number",
    value: 3,
    unit: "hrs / eng / week",
    step: 0.5,
    confirmed: false,
    pair: "search",
    side: "today",
    help: "Hours each engineer loses per week hunting. Industry estimates put tech debt at 2 to 5 days per engineer per month."
  },
  {
    key: "searchHoursPortal",
    label: "Time spent searching, with Portal",
    group: "Speed",
    type: "number",
    value: 2,
    unit: "hrs / eng / week",
    step: 0.5,
    confirmed: false,
    pair: "search",
    side: "portal",
    help: "The conservatism dial. Chris: the hard part is getting the customer to agree the number is realistic for them."
  },
  { key: "rampDaysToday", label: "Days for a new hire to first contribution, today", group: "Speed", type: "number", value: 30, unit: "days", confirmed: false, pair: "ramp", side: "today" },
  { key: "rampDaysPortal", label: "Days to first contribution, with Portal", group: "Speed", type: "number", value: 21, unit: "days", confirmed: false, pair: "ramp", side: "portal" },
  { key: "newHiresPerYear", label: "Engineers hired per year", group: "Speed", type: "number", value: 80, confirmed: false, help: "From the hiring plan if you can get it." },
  // ---- Chaos-control
  {
    key: "incidentHoursToday",
    label: "Hours each person spends on an incident, today",
    group: "Chaos-control",
    type: "number",
    value: 4,
    unit: "hrs",
    step: 0.1,
    confirmed: false,
    pair: "incident",
    side: "today",
    help: "Most of it is finding who owns the failing service."
  },
  { key: "incidentHoursPortal", label: "Hours each person spends on an incident, with Portal", group: "Chaos-control", type: "number", value: 3.2, unit: "hrs", step: 0.1, confirmed: false, pair: "incident", side: "portal" },
  { key: "peoplePerIncident", label: "People pulled into each incident", group: "Chaos-control", type: "number", value: 5, confirmed: false },
  { key: "incidentsPerMonth", label: "Incidents per month", group: "Chaos-control", type: "number", value: 12, confirmed: false },
  // ---- Standards and audit
  {
    key: "auditPrepDaysToday",
    label: "Days spent preparing for an audit \u2014 today",
    group: "Standards and audit",
    type: "number",
    value: 10,
    unit: "days",
    confirmed: false,
    pair: "audit",
    side: "today",
    help: "Per person, per audit: gathering evidence for who owns what and which standards are met."
  },
  { key: "auditPrepDaysPortal", label: "Days spent preparing for an audit \u2014 with Portal", group: "Standards and audit", type: "number", value: 5, unit: "days", confirmed: false, pair: "audit", side: "portal" },
  { key: "auditsPerYear", label: "Audits or compliance reviews per year", group: "Standards and audit", type: "number", value: 4, confirmed: false, help: "Zero if the customer has none: the audit driver then drops off the deck." },
  { key: "peoplePerAudit", label: "People pulled into each audit", group: "Standards and audit", type: "number", value: 6, confirmed: false },
  // ---- Cost and alternative
  { key: "portalCost", label: "Portal annual subscription", group: "Cost and alternative", type: "number", value: 4e5, unit: "$/yr", step: 1e4, confirmed: false, help: "A placeholder until there is a quote." },
  {
    key: "selfHostEngineers",
    label: "Engineers needed to self-host Backstage",
    group: "Cost and alternative",
    type: "number",
    value: 3,
    step: 0.5,
    confirmed: false,
    help: "The comparison that decides most deals. Spotify's own deck puts standing up Backstage at 2 to 5 developers. It should also roughly match the upkeep hours Portal saves."
  },
  { key: "selfHostSalary", label: "Fully loaded cost per self-host engineer", group: "Cost and alternative", type: "number", value: 21e4, unit: "$/yr", step: 5e3, confirmed: false },
  // ---- Calendar (structural: not claims about the customer)
  { key: "weeksPerYear", label: "Working weeks per year", group: "Calendar", type: "number", value: WORKING_WEEKS, confirmed: true, structural: true, help: "Chris's worked example uses about 48." },
  { key: "hoursPerDay", label: "Working hours per day", group: "Calendar", type: "number", value: 8, confirmed: true, structural: true },
  { key: "hoursPerYear", label: "Working hours per year", group: "Calendar", type: "number", value: HOURS_PER_YEAR, confirmed: true, structural: true }
];
var isAnswer = (f) => (f.type === "number" || f.type === "percent") && !f.structural;
var DEMO_VALUES = Object.fromEntries(FIELD_DEFS.map((f) => [f.key, f.value]));
var INPUT_FIELDS = FIELD_DEFS.map(({ confirmed, ...f }) => {
  if (isAnswer(f)) return { ...f, value: "", source: emptySource() };
  if (f.structural) return { ...f, source: { state: "input", origin: ORIGIN.calendar } };
  return { ...f, source: { state: "input", origin: "" } };
});
var hoursBack = (model) => model.figures.hoursSavedPerEngPerWeek.value * model.inputs.engineers * model.inputs.weeksPerYear;
function costsAvoided(model) {
  const parts = ["platformValue", "toolingValue"].map((k) => model.figures[k]).filter((f) => !f.incomplete);
  return parts.length ? parts.reduce((s, f) => s + f.value, 0) : null;
}
var STAKEHOLDERS = [
  {
    key: "champion",
    role: "Director / VP Engineering",
    tag: "Usually the champion",
    cares: "Their team shipping instead of searching",
    lead: ["productivity", "onboarding"],
    headline: (m) => m.figures.hoursSavedPerEngPerWeek.incomplete || m.blankInputs.includes("engineers") ? null : `${fmtHours(hoursBack(m))} of engineering time back per year`,
    objection: "My team already knows where things are.",
    counter: "Ask how a new hire finds the owner of a service during an incident. The cost lands on the people who joined most recently.",
    needsToSee: [
      "Time recovered per engineer, not just in aggregate",
      "Onboarding time for the hires they are about to make",
      "That it does not become another system their team has to maintain"
    ]
  },
  {
    key: "cto",
    role: "CTO",
    tag: "Often has the opposite goal",
    cares: "Cutting spend while the org keeps growing",
    lead: ["platform", "tooling"],
    headline: (m) => {
      const avoided = costsAvoided(m);
      return avoided == null ? null : `${fmtMoney(avoided)} of run cost avoided per year`;
    },
    objection: "Backstage is open source. Why are we paying for it?",
    counter: "The licence is free, the operation is not. Self-hosting means a standing platform team for upgrades, patches and infrastructure, permanently.",
    needsToSee: [
      "Total cost of ownership against self-hosting, not against doing nothing",
      "What gets retired, not just what gets added",
      "That this is one line item replacing several"
    ]
  },
  {
    key: "finance",
    role: "Finance / Procurement",
    tag: "Shows up late and can stall a done deal",
    cares: "Payback, contract terms, and whether the numbers survive scrutiny",
    lead: ["productivity", "tooling"],
    headline: (m) => {
      if (m.figures.paybackMonths.incomplete) return null;
      const months = m.figures.paybackMonths.value;
      return months > 0 ? `Payback in ${fmtMonths(months)}` : "No payback on these figures";
    },
    objection: "These savings are soft. Nobody gets laid off because of this.",
    counter: "Present recovered capacity against hiring plans rather than as cash. The claim is avoided headcount, not reduced headcount.",
    needsToSee: [
      "Payback period and five-year value",
      "Which inputs are confirmed and which are still assumptions",
      "A conservative case, not the best case"
    ]
  },
  {
    key: "security",
    role: "Security / Compliance",
    tag: "The late arrival that kills timelines",
    cares: "Proving which services meet which standards, on a date",
    lead: ["standards", "incidents"],
    headline: (m) => !m.figures.standardsValue.incomplete && m.figures.standardsValue.value > 0 ? `${fmtMoney(m.figures.standardsValue.value)} of audit effort avoided per year` : "Ownership and standards provable on demand",
    objection: "This is another system holding our service metadata.",
    counter: "Bring them in during discovery rather than at contract. Chris lost weeks on a deal where procurement rules surfaced only after everyone had agreed.",
    needsToSee: [
      "Where the data lives and who can see it",
      "How standards are enforced and evidenced for an audit",
      "The review timeline, raised early enough to matter"
    ]
  }
];

// src/personLookup.js
var publicTypes = /* @__PURE__ */ new Set(["web", "linkedin", "github", "blog", "conference", "podcast", "earnings", "public"]);
var connectorDomains = { gmail: ["mail.google.com", "gmail.com"], claude: ["claude.ai"], gong: ["gong.io", "gong.com"], hubspot: ["hubspot.com", "hubspot.net"], slack: ["slack.com"], clay: ["clay.com"], lemlist: ["lemlist.com"] };
function sourceFor(item, enabledSources = []) {
  if (!item || typeof item.sourceUrl !== "string") return null;
  try {
    const url = new URL(item.sourceUrl);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    let type = String(item.sourceType || "web").toLowerCase();
    const hosted = Object.entries(connectorDomains).find(([, domains]) => domains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`)));
    if (hosted) type = hosted[0];
    if (!publicTypes.has(type) && !enabledSources.includes(type)) return null;
    if (publicTypes.has(type) && !enabledSources.includes("web")) return null;
    return { sourceUrl: url.href, sourceType: type };
  } catch {
    return null;
  }
}
function matchPersonRole(title) {
  const t = String(title || "").toLowerCase();
  let key = "champion", confidence = "low", why = "The title does not match a known role. Engineering leadership is the nearest working framing; confirm it with this person.";
  if (/security|compliance|ciso|risk|audit/.test(t)) {
    key = "security";
    confidence = "high";
    why = "The title names security, risk or compliance responsibilities.";
  } else if (/finance|financial|procurement|purchasing|cfo/.test(t)) {
    key = "finance";
    confidence = "high";
    why = "The title names finance or purchasing responsibilities.";
  } else if (/\bcto\b|chief technology|chief technical/.test(t)) {
    key = "cto";
    confidence = "high";
    why = "The title identifies technology leadership.";
  } else if (/engineering|engineer|platform|devex|developer experience|infrastructure|\bsre\b/.test(t)) {
    confidence = /director|head|\bvp\b|vice president/.test(t) ? "high" : "medium";
    why = "The title indicates engineering or platform work; the engineering-leadership framing is inferred, not confirmed.";
  } else if (/chief|president|executive/.test(t)) {
    key = "cto";
    why = "An executive title is closest to the CTO framing, but the responsibilities are unclear. This is a low-confidence guess.";
  }
  const role = STAKEHOLDERS.find((s) => s.key === key).role;
  return { key, role, confidence, why };
}

// plugin-src/workflow.mjs
var parent = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
var ROOT = fs.existsSync(path.join(parent, "framework/actions.json")) ? parent : path.join(parent, "plugin");
var SOURCE_IDS = ["web", "claude", "gong", "hubspot", "slack", "clay", "lemlist"];
var text = (v) => typeof v === "string" ? v.trim() : "";
function planAction(id, request, root = ROOT) {
  if (!request || typeof request !== "object" || Array.isArray(request)) throw Error("Request must be a JSON object.");
  const registry = JSON.parse(fs.readFileSync(path.join(root, "framework/actions.json"), "utf8"));
  const action = registry.actions.find((a) => a.id === id || a.command === id);
  if (!action) throw Error("Unknown action: " + id);
  for (const field of action.required) if (!text(request[field])) throw Error("Missing required field: " + field);
  const enabledSources = request.enabledSources ?? ["web"];
  if (!Array.isArray(enabledSources) || enabledSources.some((s) => !SOURCE_IDS.includes(s))) throw Error("Unknown or invalid enabledSources.");
  return { action: action.id, command: "/casebuilder:" + action.command, skill: path.join(root, action.skill), request: { ...request, enabledSources }, artifact: action.artifact, writePolicy: action.writes, executed: false, note: "Read the skill and execute with the host tools. Planning performs no research or writes." };
}
function validateFindings(data, { demo = false } = {}) {
  if (!data || !["brand", "people"].includes(data.kind)) throw Error("Findings kind must be brand or people.");
  if (!Array.isArray(data.enabledSources) || data.enabledSources.some((s) => !SOURCE_IDS.includes(s))) throw Error("enabledSources must contain known source IDs.");
  if (!Array.isArray(data.sourcesUsed) || !Array.isArray(data.sourcesSkipped)) throw Error("Findings require sourcesUsed and sourcesSkipped arrays.");
  if (data.kind === "brand" && !text(data.company)) throw Error("Brand findings need a company.");
  if (data.kind === "people" && !Array.isArray(data.people)) throw Error("People findings need a people array.");
  const dropped = [], used = /* @__PURE__ */ new Set(), errors = [];
  const claim = (item, at) => {
    const source = sourceFor(item, data.enabledSources);
    if (!source || !text(item?.key) || !(typeof item.value === "number" && Number.isFinite(item.value) || text(item?.value))) {
      dropped.push({ at, reason: "Missing value/key/evidence, invalid URL or disabled source." });
      return null;
    }
    const host = new URL(source.sourceUrl).hostname;
    if (!demo && (host.endsWith(".example") || host === "example.com" || host === "example.org" || host === "example.net")) {
      dropped.push({ at, reason: "Fictional evidence is allowed only with --demo." });
      return null;
    }
    if (data.kind === "brand" && ["background", "surface", "primary", "text", "muted"].includes(item.key) && !/^#[a-f0-9]{6}$/i.test(item.value)) {
      dropped.push({ at, reason: "A palette value must be a six-digit hex color." });
      return null;
    }
    used.add(source.sourceType);
    return { key: text(item.key), value: item.value, ...source, ...text(item.localFile) ? { localFile: item.localFile } : {}, ...text(item.observedAt) ? { observedAt: item.observedAt } : {} };
  };
  const claims = (items, at) => (Array.isArray(items) ? items : []).map((v, i) => claim(v, at + "[" + i + "]")).filter(Boolean);
  let result;
  if (data.kind === "brand") result = { kind: "brand", company: data.company, claims: claims(data.claims, "claims"), notFound: Array.isArray(data.notFound) ? data.notFound : [], fallbacks: Array.isArray(data.fallbacks) ? data.fallbacks : [] };
  else result = { kind: "people", query: text(data.query), people: data.people.map((p, i) => {
    if (!p || typeof p !== "object") throw Error("Each person must be an object.");
    const status = ["resolved", "ambiguous", "not-found"].includes(p.status) ? p.status : "not-found";
    const values = status === "resolved" ? claims(p.claims, "people[" + i + "].claims") : [];
    const title = values.find((c) => c.key === "title");
    const roleMatch = title ? { ...matchPersonRole(title.value), state: "inferred", sourceUrl: title.sourceUrl, sourceType: title.sourceType } : null;
    if (status === "resolved" && !values.some((c) => c.key === "name")) errors.push("Resolved person " + i + " has no sourced name.");
    return { status, claims: values, roleMatch, notFound: Array.isArray(p.notFound) ? p.notFound : [], candidates: (Array.isArray(p.candidates) ? p.candidates : []).map((c, j) => ({ claims: claims(c?.claims, "people[" + i + "].candidates[" + j + "]") })).filter((c) => c.claims.length), suggestedInputs: status === "resolved" ? claims(p.suggestedInputs, "people[" + i + "].suggestedInputs") : [] };
  }) };
  const skipped = [];
  for (const item of data.sourcesSkipped) {
    if (!SOURCE_IDS.includes(item.source) || !["disabled", "unavailable", "no-results"].includes(item.reason)) {
      errors.push("Invalid skipped-source record.");
      continue;
    }
    if (item.reason === "disabled" && data.enabledSources.includes(item.source)) {
      errors.push(item.source + " cannot be both enabled and disabled.");
      continue;
    }
    if (used.has(item.source)) {
      errors.push(item.source + " cannot be both used and skipped.");
      continue;
    }
    skipped.push({ source: item.source, reason: item.reason });
  }
  for (const source of data.sourcesUsed) if (!data.enabledSources.includes(source)) errors.push("sourcesUsed names a disabled source: " + source);
  for (const source of SOURCE_IDS) if (!data.enabledSources.includes(source) && !skipped.some((s) => s.source === source)) skipped.push({ source, reason: "disabled" });
  return { ok: errors.length === 0, result: { ...result, enabledSources: [...data.enabledSources], sourcesUsed: [...used], sourcesSkipped: skipped }, dropped, errors, evidenceChecked: false, note: "URLs and source permissions were checked; the host agent must verify that each page supports its claim. No case was modified." };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [verb, kind, ...args] = process.argv.slice(2);
    const flag = (name) => {
      const at = args.indexOf(name);
      return at >= 0 ? args[at + 1] : null;
    };
    const file = flag(verb === "plan" ? "--request" : "--file");
    if (!file) throw Error("Usage: workflow.mjs plan <action> --request file.json | validate <brand|people> --file findings.json [--demo]");
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const out = verb === "plan" ? planAction(kind, data) : verb === "validate" && data.kind === kind ? validateFindings(data, { demo: args.includes("--demo") }) : null;
    if (!out) throw Error("Unknown operation or mismatched findings kind.");
    console.log(JSON.stringify(out, null, 2));
    if (out.ok === false) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
export {
  planAction,
  validateFindings
};
