// Keep normal search explanations intact; visibly shorten unusually long replies.
export function researchNote(value,max=2000){
 if(typeof value!=='string')return null
 const text=value.trim()
 if(!text)return null
 if(text.length<=max)return text
 const prefix=text.slice(0,max-1)
 const boundary=prefix.lastIndexOf(' ')
 return (boundary>0?prefix.slice(0,boundary):prefix).trimEnd()+'…'
}
