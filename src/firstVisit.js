const key=id=>`casebuilder.welcome.v1:${id}`
export function needsWelcome(id,storage=globalThis.localStorage){try{return !!id&&storage.getItem(key(id))!=='done'}catch{return false}}
export function finishWelcome(id,storage=globalThis.localStorage){try{storage.setItem(key(id),'done')}catch{}}
