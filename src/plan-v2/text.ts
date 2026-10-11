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

// Prefer complete words at the largest fitting size. Only split an unbroken
// token if even the minimum readable size cannot fit it within the actual slot.
export function fitMeasuredLabel(text:string,measure:(text:string,size:number)=>number,width:number,size:number,top:number,height:number){
  const words=text.trim().split(/\s+/u).filter(Boolean);
  for(let fontSize=size;fontSize>=18;fontSize--){
    const lines:string[]=[];let line='';let impossible=false;
    for(const word of words){
      if(measure(word,fontSize)>width){impossible=true;break;}
      const next=line?`${line} ${word}`:word;
      if(line&&measure(next,fontSize)>width){lines.push(line);line=word;}else line=next;
    }
    if(line)lines.push(line);
    const lineHeight=fontSize*1.2;
    if(!impossible&&lines.length*lineHeight<=height)return {lines,fontSize,lineHeight,baseline:top+(height-lines.length*lineHeight)/2+fontSize};
  }
  // Pathological wide tokens still preserve every code point and stay bounded.
  const fontSize=18,lines:string[]=[];let line='';
  for(const char of Array.from(words.join(' '))){
    if(measure(char,fontSize)>width)throw Error('DIAGRAM_TEXT_LAYOUT_INVALID');
    if(line&&measure(line+char,fontSize)>width){lines.push(line);line='';}
    line+=char;
  }
  if(line)lines.push(line);
  const lineHeight=fontSize*1.2;
  if(lines.length*lineHeight>height)throw Error('DIAGRAM_TEXT_LAYOUT_INVALID');
  return {lines,fontSize,lineHeight,baseline:top+(height-lines.length*lineHeight)/2+fontSize};
}
