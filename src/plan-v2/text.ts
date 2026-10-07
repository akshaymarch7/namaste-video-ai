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
