// Optional narrative context, separate from the financial model. These fields
// are ordinary saved custom inputs and use the existing agent edit/review flow.
export const CASE_CONTEXT = [
  {key:'caseScope',label:'Team or department in scope',help:'For example, the platform team supporting commerce services.'},
  {key:'workflowContext',label:'Workflow this case addresses',help:'For example, finding the service owner during an incident.'},
  {key:'businessProblem',label:'What is difficult today',help:'Use the customer’s description. Leave unknown context blank.'}
]
export function contextStatement(inputs={}){
  return CASE_CONTEXT.flatMap(f=>typeof inputs[f.key]==='string'&&inputs[f.key].trim()?[inputs[f.key].trim()]:[]).join(' · ')
}
export function setCaseContext(fields,key,value){
  if(!CASE_CONTEXT.some(f=>f.key===key))return fields
  const existing=fields.find(f=>f.key===key)
  const patch={value,source:{state:value.trim()?'assumption':'empty',origin:value.trim()?'Chris’s case context':''}}
  if(existing)return fields.map(f=>f===existing?{...f,...patch,deleted:false}:f)
  return [...fields,{...CASE_CONTEXT.find(f=>f.key===key),type:'text',group:'Account',custom:true,...patch}]
}

export function ensureCaseContext(fields){
 return [...fields,...CASE_CONTEXT.filter(def=>!fields.some(f=>f.key===def.key)).map(def=>({...def,type:'text',group:'Account',custom:true,value:'',source:{state:'empty',origin:''}}))]
}
