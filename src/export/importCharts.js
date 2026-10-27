// Editable shapes survive Canva imports, which discard native Office charts.
export function drawImportChart(slide,b,box,{font,colors}){
 const {x,y,w,h}=box
 const text=(value,options)=>slide.addText(String(value),{fontFace:font,fontSize:11,color:colors.ink,margin:0,breakLine:false,...options})
 const bar=(left,top,width,height,color)=>{if(width>0&&height>0)slide.addShape('rect',{x:left,y:top,w:width,h:height,line:{color,transparency:100},fill:{color}})}
 const money=n=>'$'+Math.round(n).toLocaleString('en-US')
 if(b.chart==='payback'){
  const max=Math.max(1,...b.value,...b.cost),plotH=h-.65,step=w/b.months.length
  b.months.forEach((month,i)=>{for(const [values,color,offset]of [[b.value,colors.accent,.1],[b.cost,colors.bad,.53]]){const height=Math.max(0,values[i])/max*plotH;bar(x+i*step+offset*step,y+plotH-height,step*.35,height,color)}if(i%6===5)text('M'+month,{x:x+i*step-step,y:y+plotH+.04,w:step*3,h:.2,fontSize:8,align:'center'})})
  text('Cumulative value '+money(b.value.at(-1))+' · Cumulative cost '+money(b.cost.at(-1)),{x,y:y+h-.25,w,h:.25,fontSize:10})
  return
 }
 const rows=b.rows||[],max=Math.max(1,...rows.map(r=>b.chart==='confidence'?r.count:r.value)),rowH=h/Math.max(1,rows.length)
 rows.forEach((r,i)=>{const value=b.chart==='confidence'?r.count:r.value,top=y+i*rowH;text(r.label,{x,y:top,w:w*.4,h:rowH*.85,fit:'shrink'});bar(x+w*.42,top+.06,w*.35*value/max,Math.min(.2,rowH*.45),r.group==='spend'?colors.warn:colors.accent);text(b.chart==='confidence'?value:money(value),{x:x+w*.79,y:top,w:w*.21,h:rowH*.85,align:'right',fit:'shrink'})})
}
