// SVG does not wrap text automatically, including long unbroken labels.
export function labelLines(text:string,limit:number){
  const lines:string[]=[];let line='';
  for(const word of text.trim().split(/\s+/u)){
    const chunks=Array.from(word);
    if(line&&Array.from(line).length+1+chunks.length>limit){lines.push(line);line='';}
    while(chunks.length>limit){if(line){lines.push(line);line='';}lines.push(chunks.splice(0,limit).join(''));}
    const rest=chunks.join('');if(rest)line=line?`${line} ${rest}`:rest;
  }
  if(line)lines.push(line);return lines;
}

// Reserve one full font-size above the first baseline and 0.2 below the last.
// Fit the complete wrapped block into its slot, keeping card/edge geometry stable.
export function fitLabel(text:string,limit:number,size:number,top:number,height:number){
  const lines=labelLines(text,limit);
  const fontSize=Math.min(size,height/(Math.max(1,lines.length)*1.2));
  const lineHeight=fontSize*1.2;
  const blockHeight=lines.length*lineHeight;
  return {lines,fontSize,lineHeight,baseline:top+(height-blockHeight)/2+fontSize};
}
