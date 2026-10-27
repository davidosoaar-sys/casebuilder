// Preserve original artwork; recolour only verified black/white single-tone ink.
export function monochromeTone(pixels){
 let black=0,white=0,visible=0,transparent=false
 for(let i=0;i<pixels.length;i+=4){const [r,g,b,a]=pixels.slice(i,i+4);if(a<16){transparent=true;continue}visible++;if(Math.max(r,g,b)<75)black++;else if(Math.min(r,g,b)>180)white++;else if(Math.max(r,g,b)-Math.min(r,g,b)>20)return null}
 if(!transparent||!visible)return null
 return black/visible>.98?'black':white/visible>.98?'white':null
}
export async function logoForTheme(original,target){
 if(!original||!['company','backstage'].includes(target)||typeof document==='undefined')return original
 const image=new Image()
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Logo decode timeout')),5000);image.onload=()=>{clearTimeout(timer);resolve()};image.onerror=()=>{clearTimeout(timer);reject(Error('Logo unavailable'))};image.src=original})
  const w=image.naturalWidth,h=image.naturalHeight
  if(!w||!h||w*h>4e6)return original
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0)
  const tone=monochromeTone(ctx.getImageData(0,0,w,h).data)
  if(!tone||tone===(target==='backstage'?'white':'black'))return original
  ctx.globalCompositeOperation='source-in';ctx.fillStyle=target==='backstage'?'#ffffff':'#111111';ctx.fillRect(0,0,w,h)
  const result=canvas.toDataURL('image/png')
  return result.length<1200000?result:original
 }catch{return original}
}
