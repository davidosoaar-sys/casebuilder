export function coachPlacement(rect,width,height,viewport){
 const gap=18,margin=16,w=Math.min(width,viewport.width-32),h=Math.min(height,viewport.height-32)
 const clamp=(n,min,max)=>Math.max(min,Math.min(n,max))
 const top=clamp(rect.top,margin,viewport.height-h-margin)
 if(viewport.width>=760&&rect.right+gap+w<=viewport.width-margin)return {left:rect.right+gap,top,side:'left'}
 if(viewport.width>=760&&rect.left-gap-w>=margin)return {left:rect.left-gap-w,top,side:'right'}
 const left=clamp(rect.left,margin,viewport.width-w-margin)
 if(rect.bottom+gap+h<=viewport.height-margin)return {left,top:rect.bottom+gap,side:'top'}
 if(rect.top-gap-h>=margin)return {left,top:rect.top-gap-h,side:'bottom'}
 return {left:margin,top:viewport.height-h-margin,side:null}
}
