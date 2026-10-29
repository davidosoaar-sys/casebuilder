const tip=(id,title,text,target,kind='main')=>({id,title,text,target,kind})
const main={
 project:tip('project','Create a case','Click New case and enter the company name. The stakeholder step comes next.','[data-tour="project"]'),
 map:tip('stakeholders','Add stakeholders','Choose who needs to be in the decision, then use Continue when you’re ready.','[data-tour="stakeholders"] .map'),
 brand:tip('branding','Review the company branding','Check the company logo, fonts and colors, then continue to meet the people.','[data-tour="branding"] .brand-setup-actions'),
 people:tip('people','Meet the people','Find who holds each role and review the sources. Continue when you’re ready to choose a theme.','[data-tour="people"] .people-actions'),
 theme:tip('theme','Choose the case theme','Pick Company-inspired styling or the full Backstage theme, then create your case.','[data-tour="theme"] .template-setup-options'),
 inputs:tip('case-inputs','Add your case inputs','Put the customer’s numbers here, or use Suggest values as a starting point. The info buttons explain each field. Your changes save automatically and update the case artifacts.','.inputs-page #engineers','page'),
 researchNav:tip('research-nav','Research and person lookup','Open Research for account context or to look up someone you’re meeting.','[data-tour="research-nav"]'),
 website:tip('edit-case','Edit, preview and share','Use Edit slides to change pages or Edit content to revise the Live Room. View as previews each format; download or share only when you’re ready.','[data-tour="edit-case"]'),
 deck:tip('edit-deck','Make the story yours','Click text to edit, add or rearrange pages, and use Undo when needed. View as previews your format before you export.','[data-tour="edit-deck"]'),
 format:tip('format','Choose a format','Use View as to preview slides, PDF, a one-pager or the Live Room before exporting.','.website-view-format, [data-tour="export"]'),
 share:tip('share','Export or share','Download your chosen format, or Copy link to publish the Live Room. Republish after changes.','[data-tour="export"], [data-tour="publish"]')
}
const pages={
 skills:tip('skills','Try a skill','Skills are reusable instructions for tasks like meeting prep. Try one on a case or add your own.','.skills-page .skill-try','page'),
 connections:tip('connections','Choose your sources','Connect only the tools you want the Agent to use. Review permissions before authorizing an account.','[data-testid="connections"]','page'),
 scheduled:tip('scheduled','Run it on a schedule','Set a skill or prompt to run for a case. Results arrive in that case’s Agent.','.scheduled-page','page'),
 files:tip('files','Give the case context','Add project files and instructions so the Agent can work from the material you choose.','.pf-page','page'),
 research:tip('research','Research this account','Find sourced company context. Switch to Person to look up a name, email or LinkedIn profile.','.research-page','page'),
 lookup:tip('lookup','Look up a person','Paste a name, email or LinkedIn URL, review the brief, then choose what to add to the case.','.lookup-page','page'),
 agent:tip('agent','Ask the Agent','Ask questions or request case edits using the available project context. Review its sources and proposed changes.','[data-tour="agent"]','page')
}
export function tipsFor({stage,view},mainEnabled=true){
 if(!mainEnabled)return []
 if(stage)return mainEnabled&&main[stage]?[main[stage]]:[]
 if(pages[view])return [pages[view]]
 if(view==='details')return [main.inputs]
 if(['projects','dashboard'].includes(view))return [main.project]
 if(view==='website'||view==='deck')return [main[view]]
 return []
}
const key=(userId,id)=>`casebuilder.tip.v1:${userId}:${id}`
export function tipSeen(userId,id,storage=globalThis.localStorage){try{return storage.getItem(key(userId,id))==='seen'}catch{return false}}
export function markTipSeen(userId,id,storage=globalThis.localStorage){try{storage.setItem(key(userId,id),'seen')}catch{}}

// Admin "Restart tour": forget the welcome and every seen tip for this user, so the
// whole tour shows again exactly as a new account sees it. Returns how many were cleared.
export function resetTour(userId,storage=globalThis.localStorage){
 try{
  const keys=[]
  for(let i=0;i<storage.length;i++){const k=storage.key(i);if(k===`casebuilder.welcome.v1:${userId}`||k===`casebuilder.intro.v1:${userId}`||k?.startsWith(`casebuilder.tip.v1:${userId}:`))keys.push(k)}
  keys.forEach(k=>storage.removeItem(k));return keys.length
 }catch{return 0}
}
