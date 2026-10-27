// Conservative preference, not background removal. Unknown assets remain intact.
export function transparentLogoPreference(mime, bytes) {
 if(mime==='image/svg+xml'){
  const svg=bytes.toString()
  // A background rectangle/image is a reason not to prefer this SVG blindly.
  return !/<(?:rect|image)\b/i.test(svg) ? 2 : 0
 }
 if(mime==='image/png'&&bytes.length>26){
  const alpha=[4,6].includes(bytes[25])||bytes.includes(Buffer.from('tRNS'))
  return alpha?1:0 // alpha-capable does not guarantee all background pixels are clear
 }
 return 0
}
