import assets from './sampleBrandAssets.js'
import nikeImagery from './sampleNikeImagery.json' with { type: 'json' }
import { DEMO_VALUES } from './valueModel.js'
import { normalizeBrand } from './brand.js'

// Fictional scenarios for testing the same website template at different scales.
// These are not research findings or claims about the named companies.
export const SAMPLE_CASES = [
  {key:'nike',name:'Nike',background:'#FFFFFF',primary:'#111111',text:'#111111',muted:'#606060',bodyFont:'Helvetica Neue, Helvetica, Arial',archetype:'Enterprise',priority:'Migration',
    overview:'An illustrative platform case for a global commerce engineering team: make service ownership, documentation and onboarding easier to navigate.',
    drivers:'More time building. Less time searching.',
    values:{engineers:1800,hourlyCost:110,platformShare:18,searchHoursToday:2.5,searchHoursPortal:1.5,newHiresPerYear:180,rampDaysToday:28,rampDaysPortal:20,portalCost:650000,selfHostEngineers:5,selfHostSalary:220000}},
  {key:'lovable',name:'Lovable',background:'#FAF9F6',primary:'#4B73FF',text:'#1B1B1B',muted:'#62605C',bodyFont:'Camera Plain Variable',archetype:'Fast / AI-native',priority:'AI initiative',
    overview:'An illustrative case for a fast-moving AI product team: help engineers find the right service, get productive sooner and keep the platform team focused on the product.',
    drivers:'Keep the team in its creative flow.',
    values:{engineers:90,hourlyCost:125,platformShare:20,searchHoursToday:2,searchHoursPortal:1,newHiresPerYear:35,rampDaysToday:15,rampDaysPortal:9,incidentsPerMonth:4,auditsPerYear:2,toolSpendToday:60000,toolSpendPortal:30000,portalCost:110000,selfHostEngineers:1,selfHostSalary:230000}},
  {key:'fortnite',name:'Fortnite',background:'#10121B',primary:'#F7FF00',text:'#FFFFFF',muted:'#B9BFCE',bodyFont:'Arial',archetype:'Scaling tech',priority:'Cost pressure',
    overview:'An illustrative live-service engineering case: surface service owners quickly, reduce incident coordination and reclaim platform capacity for the next release.',
    drivers:'Build the next release. Reduce the drag.',
    values:{engineers:650,hourlyCost:120,platformShare:25,searchHoursToday:3,searchHoursPortal:1.75,newHiresPerYear:100,rampDaysToday:25,rampDaysPortal:16,incidentsPerMonth:24,peoplePerIncident:8,incidentHoursToday:5,incidentHoursPortal:3.5,portalCost:480000,selfHostEngineers:4,selfHostSalary:240000}}
]

export function createSampleCase(definition, createProject) {
  const d=definition, project=createProject(d.name+' · sample',{})
  const values={...DEMO_VALUES,...d.values,companyName:project.name,archetype:d.archetype,strategicPriority:d.priority}
  project.sample=true
  project.sampleCaseKey=d.key
  project.projectLogo=assets[d.key].logo
  project.connectors={}
  project.fields=project.fields.map(f=>({...f,value:values[f.key]??f.value,confirmed:false,source:{state:'assumption',origin:'Illustrative demo input — not company research',quote:'',link:'',pinnedAt:''}}))
  project.brand=normalizeBrand({...assets[d.key],primary:d.primary,background:d.background,surface:d.background,text:d.text,muted:d.muted,headingFont:assets[d.key].fontData?assets[d.key].fontName:'Arial',bodyFont:d.bodyFont,website:d.key==='nike'?'https://www.nike.com/':d.key==='lovable'?'https://lovable.dev/':'https://www.fortnite.com/',status:'ready',message:d.key==='fortnite'?'Public Fortnite logo with a demo palette. The official heading font could not be downloaded; Arial is the explicit fallback.':'Public company logo and website heading font. Illustrative sample case.'})
  project.deck=project.deck.map(s=>({...s,design:{...s.design,background:d.background},blocks:s.blocks.map(b=>{
    if(b.type!=='text')return b
    let text=b.text
    if(b.style==='lede')text=d.overview+' All figures are fictional assumptions for testing; this is not an endorsed customer case.'
    if(b.style==='forwhom')text='Illustrative sample · not company research'
    if(b.style==='title'&&b.text==='Speed, chaos-control, scale')text=d.drivers
    if(b.style==='note'&&b.text.startsWith('Grouped under'))text='Compare where the modeled annual value comes from. Open the arithmetic to inspect every driver, or adjust assumptions to test a different case.'
    return {...b,text,design:{...b.design,font:['hero','headline','title'].includes(b.style)?project.brand.headingFont:d.bodyFont,color:['hero','headline'].includes(b.style)?d.primary:d.text}}
  })}))
  return refreshNikeSample(project)
}

// Add the new sample presentation without replacing saved inputs or authored slides.
export function refreshNikeSample(project) {
  if (!project.sample || project.sampleCaseKey !== 'nike' || project.nikePresentationVersion === 1) return project
  return { ...project, nikePresentationVersion: 1,
    brand: normalizeBrand({ ...project.brand, ...(!project.brand?.heroImage ? nikeImagery : {}) }),
    stakeholders: project.stakeholders.map(s => s.requirements?.length ? s : {
      ...s, requirements: s.key === 'cto' ? [
        { id: 'nike-demo-ownership', text: 'Illustrative: validate service ownership and onboarding workflow', status: 'In progress' }
      ] : s.key === 'finance' ? [
        { id: 'nike-demo-budget', text: 'Illustrative: approve the annual platform budget', status: 'Waiting for approval' }
      ] : []
    })
  }
}
