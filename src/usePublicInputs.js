import {useEffect,useRef} from 'react'
import {fetchAgent} from './suggest.js'
import {publicInputKeys,researchPublicInputs,applyPublicInputs} from './publicInputs.js'

export default function usePublicInputs({project,active,setProjects}) {
  const running=useRef(new Map())
  async function run(p){
    if(!p||!publicInputKeys(p.fields).length)return
    const {id,name}=p,token=Symbol(),job=id+'|'+name
    if(running.current.has(job))return
    running.current.set(job,token)
    const patch=fn=>setProjects(ps=>ps.map(current=>current.id===id&&current.name===name?{...current,...fn(current),updatedAt:Date.now()}:current))
    patch(()=>({publicInputResearch:{company:name,status:'searching'}}))
    try{
      let code='';try{code=localStorage.getItem('casebuilder.access')||''}catch{}
      const result=await researchPublicInputs({company:name,fields:p.fields,agent:payload=>fetchAgent(payload,{code,signal:AbortSignal.timeout(55000)})})
      patch(current=>{
        const fields=applyPublicInputs(current.fields,result)
        const count=fields.filter((f,i)=>f!==current.fields[i]).length
        return {fields,publicInputResearch:{company:name,status:'done',count,checkedAt:new Date().toISOString()}}
      })
    }catch{
      patch(()=>({publicInputResearch:{company:name,status:'error',checkedAt:new Date().toISOString()}}))
    }finally{if(running.current.get(job)===token)running.current.delete(job)}
  }
  useEffect(()=>{
    if(active&&project&&!project.sample&&(project.publicInputResearch?.company!==project.name||project.publicInputResearch?.status==='searching'))void run(project)
  },[active,project?.id,project?.name])
  return ()=>run(project)
}
