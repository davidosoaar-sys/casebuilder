import React,{useState,useEffect} from 'react'
import {publicProfileUrl,profilePhotoData} from '../profileMedia.js'
export function ProfileAvatar({photo,name='',className=''}){
 const[failed,setFailed]=useState(false),data=profilePhotoData(photo?.dataUrl),source=publicProfileUrl(photo?.sourceUrl)
 useEffect(()=>setFailed(false),[data])
 const initials=name.split(/\s+/).filter(Boolean).map(s=>s[0]).slice(0,2).join('').toUpperCase()
 return <div className={'profile-avatar-wrap '+className}>{data&&source&&!failed?<a href={source} target="_blank" rel="noreferrer noopener" title="Photo source"><img className="profile-avatar-image" src={data} alt={name+' — public profile photo'} onError={()=>setFailed(true)}/></a>:<span className="profile-avatar-fallback" aria-label="Photo not found">{initials||'?'}</span>}</div>
}
export function PublicProfileLinks({links=[],email,linkedin}){
 const list=[...links]
 if(linkedin?.value&&!list.some(l=>l.url===linkedin.value))list.unshift({url:linkedin.value,label:'LinkedIn',sourceUrl:linkedin.sourceUrl})
 const valid=list.filter(l=>publicProfileUrl(l.url)&&publicProfileUrl(l.sourceUrl)).filter((l,i,a)=>a.findIndex(x=>x.url===l.url)===i)
 return <div className="profile-public-links">{email?.value&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)&&publicProfileUrl(email.sourceUrl)&&<span><a href={'mailto:'+email.value}>{email.value}</a><a className="profile-link-source" href={email.sourceUrl} target="_blank" rel="noreferrer noopener">Email source</a></span>}{valid.map(l=><span key={l.url}><a href={l.url} target="_blank" rel="noreferrer noopener">{l.label||new URL(l.url).hostname}</a>{l.sourceUrl!==l.url&&<a className="profile-link-source" href={l.sourceUrl} target="_blank" rel="noreferrer noopener">Source</a>}</span>)}</div>
}
