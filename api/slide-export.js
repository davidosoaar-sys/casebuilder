import {handleSlideExport} from '../server/slideExport.js'
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store')
 const result=await handleSlideExport(req)
 res.status(result.status).json(result.body)
}
