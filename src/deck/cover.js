import {normalizeBrand} from '../brand.js'
export function splitCover(slide,brand){
 const b=normalizeBrand(brand)
 return slide?.design?.coverLayout==='split'&&!!b.heroImage&&slide.blocks.every(x=>['logo','text','spacer'].includes(x.type||x.kind))
}
export const SPLIT_COVER_CSS=`
.slide.brand-split-cover{position:relative;overflow:hidden;background:var(--bg)!important}
.brand-split-cover .cover-photo{position:absolute;right:0;top:0;width:47%;height:100%;object-fit:cover;mask-image:linear-gradient(to right,transparent,#000 22%);pointer-events:none}
.brand-split-cover>.inner{position:relative;z-index:1;width:53%!important;max-width:none!important;margin:0!important}
.brand-split-cover h1{font-size:clamp(40px,5vw,76px);line-height:1.02;letter-spacing:-.035em}
.brand-split-cover .logo{margin-bottom:52px}.brand-split-cover .logo img{max-width:150px;max-height:32px}
.brand-split-cover .blk{max-width:100%}.brand-split-cover .lede{font-size:20px;line-height:1.4}
@media(max-width:650px){.brand-split-cover h1{font-size:38px}.brand-split-cover .logo{margin-bottom:28px}}
`
