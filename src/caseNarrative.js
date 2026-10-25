// Presentation copy only. Receives the unchanged model's figures and formatter.
// Self-contained so exported websites use exactly this function after a slider edit.
export function caseNarrative(inputs,figures,money){
 const cost=figures.versusSelfHost,total=figures.totalValue
 return {
  caseContext:['caseScope','workflowContext','businessProblem'].flatMap(key=>typeof inputs[key]==='string'&&inputs[key].trim()?[inputs[key].trim()]:[]).join(' · '),
  decisionHeadline:cost.incomplete?'Compare Portal with running Backstage in-house':cost.raw>0?'Modeled Portal cost is '+money(cost.raw)+'/yr lower than self-hosting':cost.raw<0?'Modeled Portal cost is '+money(-cost.raw)+'/yr higher than self-hosting':'Portal and self-hosting have the same modeled annual cost',
  valueHeadline:total.incomplete?'Assess the business impact with your numbers':money(total.value)+' in modeled annual value'+(['productivityValue','onboardingValue','incidentValue','standardsValue','platformValue','toolingValue'].some(key=>figures[key].incomplete)?' from available drivers':'')
 }
}
