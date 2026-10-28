// Keep original artwork on the case; normalize only the exported copy.
export async function compatibleSlideImage(src){
 if(/^data:image\/(png|jpeg);base64,/.test(src))return src
 return new Promise((resolve,reject)=>{
  const img=new Image()
  img.onerror=()=>reject(Error('The cover image could not be prepared for Slides. Choose another image in Deck design.'))
  img.onload=()=>{
   try{
    const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight))
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale))
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image conversion is unavailable.')
    ctx.drawImage(img,0,0,canvas.width,canvas.height)
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data
    let transparent=false;for(let i=3;i<pixels.length;i+=4)if(pixels[i]<255){transparent=true;break}
    resolve(canvas.toDataURL(transparent?'image/png':'image/jpeg',.9))
   }catch(e){reject(e)}
  }
  img.src=src
 })
}
