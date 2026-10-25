// Result media is embedded by the server; the browser never loads tracking URLs.
export function publicProfileUrl(value){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||u.hostname==='localhost'||!u.hostname.includes('.')||/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname))return '';return u.href}catch{return ''}
}
export const profilePhotoData=value=>typeof value==='string'&&value.length<800000&&/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(value)?value:''
