# Stakeholders

The same numbers are framed differently for each person who has to approve the deal. Their goals can conflict: a director wants productivity, the CTO wants spend cut, and you arrive with a tool that costs money.

> The text below is starter copy. Replace it with the seller's own words where they have better ones: edit the stakeholder in the case file (`stakeholder add`) or in the app.

## Director / VP Engineering (`champion`)
- **Who:** Usually the champion
- **Cares about:** Their team shipping instead of searching
- **Value drivers to lead with:** productivity, onboarding
- **Headline with default inputs:** 24k hours of engineering time back per year
- **Needs to see:**
  - Time recovered per engineer, not just in aggregate
  - Onboarding time for the hires they are about to make
  - That it does not become another system their team has to maintain
- **Likely objection:** "My team already knows where things are."
- **Counter:** Ask how a new hire finds the owner of a service during an incident. The cost lands on the people who joined most recently.

## CTO (`cto`)
- **Who:** Often has the opposite goal
- **Cares about:** Cutting spend while the org keeps growing
- **Value drivers to lead with:** platform, tooling
- **Headline with default inputs:** $402k of run cost avoided per year
- **Needs to see:**
  - Total cost of ownership against self-hosting, not against doing nothing
  - What gets retired, not just what gets added
  - That this is one line item replacing several
- **Likely objection:** "Backstage is open source. Why are we paying for it?"
- **Counter:** The licence is free, the operation is not. Self-hosting means a standing platform team for upgrades, patches and infrastructure, permanently.

## Finance / Procurement (`finance`)
- **Who:** Shows up late and can stall a done deal
- **Cares about:** Payback, contract terms, and whether the numbers survive scrutiny
- **Value drivers to lead with:** productivity, tooling
- **Headline with default inputs:** Payback in 2 months
- **Needs to see:**
  - Payback period and five-year value
  - Which inputs are confirmed and which are still assumptions
  - A conservative case, not the best case
- **Likely objection:** "These savings are soft. Nobody gets laid off because of this."
- **Counter:** Present recovered capacity against hiring plans rather than as cash. The claim is avoided headcount, not reduced headcount.

## Security / Compliance (`security`)
- **Who:** The late arrival that kills timelines
- **Cares about:** Proving which services meet which standards, on a date
- **Value drivers to lead with:** incidents, platform
- **Headline with default inputs:** Ownership and standards provable on demand
- **Needs to see:**
  - Where the data lives and who can see it
  - How standards are enforced and evidenced for an audit
  - The review timeline, raised early enough to matter
- **Likely objection:** "This is another system holding our service metadata."
- **Counter:** Bring them in during discovery rather than at contract. Chris lost weeks on a deal where procurement rules surfaced only after everyone had agreed.
