import React from 'react'
import {CASE_CONTEXT,setCaseContext} from '../caseContext.js'
export default function CaseContext({fields,onFields}){
 return <details className="case-context no-print"><summary>Case context <span>Optional · use what the customer has shared</span></summary><p className="help">These notes appear in the client story. Leave unknown details blank. They do not change Chris’s calculations. You can also ask the project agent to propose edits from linked discovery material.</p>{CASE_CONTEXT.map(def=><label key={def.key}>{def.label}<textarea rows="2" value={fields.find(f=>f.key===def.key&&!f.deleted)?.value||''} onChange={e=>onFields(fs=>setCaseContext(fs,def.key,e.target.value))} placeholder={def.help}/></label>)}</details>
}
