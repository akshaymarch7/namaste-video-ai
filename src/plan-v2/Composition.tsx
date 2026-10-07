import React from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile,useCurrentFrame,interpolate} from 'remotion';
import {motionAt,type RenderScene,type RenderTimeline} from './compiler';
import {fitLabel} from './text';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
const ink='#153c3a',teal='#168779',orange='#e9a64d';
const fade=(f:number)=>interpolate(f,[0,18],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
function Lines({text,x,top,height,size=32,max=22}:{text:string;x:number;top:number;height:number;size?:number;max?:number}){
  const layout=fitLabel(text,max,size,top,height);
  return <text x={x} y={layout.baseline} fill={ink} fontSize={layout.fontSize}>{layout.lines.map((line,i)=><tspan key={i} x={x} dy={i?layout.lineHeight:0}>{line}</tspan>)}</text>;
}
export function DiagramV2({scene}:{scene:RenderScene}){
  const frame=useCurrentFrame(),v=scene.visual;
  const motion=(id:string)=>motionAt(scene.events,id,frame);
  const box=(id:string,label:string,index:number,y:number)=>{
    const m=motion(id);
    return <g key={id} opacity={m.visibility} transform={`translate(${(1-m.visibility)*-16} 0)`}>
      <rect x="95" y={y} width="670" height="112" rx="25" fill={index%2?'#e0e8df':'#dbe9e6'} stroke={m.accent>0?orange:'#ced9d1'} strokeWidth={2+m.accent*5}/>
      <circle cx="150" cy={y+56} r="27" fill={teal}/><text x="150" y={y+65} fill="white" textAnchor="middle" fontSize="25">{index+1}</text>
      <Lines text={label} x={205} top={y+16} height={80} max={16}/>
    </g>;
  };
  return <svg viewBox="0 0 860 700" style={{width:'100%',height:700}}>
    <defs><marker id={`arrow-${scene.id}`} markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke={teal} strokeWidth="1.5"/></marker></defs>
    {v.component==='flow'&&<>
      {v.data.edges.map((e,i)=>{
        const from=v.data.steps.findIndex(s=>s.id===e.from),to=v.data.steps.findIndex(s=>s.id===e.to),m=motion(e.id);
        const source=motion(e.from),destination=motion(e.to);
        const adjacent=to===from+1;
        const x=adjacent?430:70-i*8,y1=40+from*158+56,y2=40+to*158+56;
        const d=adjacent?`M430 ${y1+59}V${y2-62}`:`M92 ${y1}H${x}V${y2}H90`;
        return <path key={e.id} d={d} fill="none" stroke={m.accent>0?orange:teal} strokeWidth={3+m.accent*4} opacity={m.visibility*Math.min(source.visibility,destination.visibility)} pathLength={1} strokeDasharray={1} strokeDashoffset={1-m.visibility} markerEnd={`url(#arrow-${scene.id})`}/>;
      })}
      {v.data.steps.map((s,i)=>box(s.id,s.label,i,40+i*158))}
    </>}
    {v.component==='comparison'&&(['left','right'] as const).map((id,index)=>{
      const panel=v.data[id],m=motion(id);
      return <g key={id} opacity={m.visibility} transform={`translate(${25+index*425} 0)`}>
        <rect y="45" width="385" height="565" rx="32" fill={index?'#e8e5d9':'#dbe9e6'} stroke={m.accent>0?orange:'#bfd4cf'} strokeWidth={2+m.accent*5}/>
        <rect x="28" y="75" width="56" height="7" rx="3.5" fill={index?orange:teal}/>
        <Lines text={panel.heading} x={28} top={105} height={79} size={32} max={10}/>
        <line x1="28" x2="355" y1="200" y2="200" stroke="#bccfc8"/>
        {panel.points.map((p,i)=><g key={i}><circle cx="39" cy={265+i*118} r="5" fill={teal}/><Lines text={p} x={62} top={218+i*118} height={100} size={27} max={10}/></g>)}
      </g>;
    })}
    {(v.component==='title'||v.component==='takeaway')&&v.data.labels.map((label,i)=>box(`label-${i+1}`,label,i,40+i*158))}
  </svg>;
}
function Scene({scene,index,total,fixture,audio}:{scene:RenderScene;index:number;total:number;fixture:boolean;audio:boolean}){
  const frame=useCurrentFrame(),caption=scene.captions.find(c=>frame>=c.start&&frame<c.end);
  return <AbsoluteFill style={{background:'#f5f3ec',color:ink,fontFamily:'DM Sans',padding:'125px 85px 100px'}}>
    {audio&&<Audio src={staticFile(`${scene.id}.mp3`)}/>}
    <div style={{display:'flex',justifyContent:'space-between',fontSize:23,letterSpacing:3,fontWeight:600,color:teal}}><span>{scene.kicker}</span><span>{String(index+1).padStart(2,'0')} / {String(total).padStart(2,'0')}</span></div>
    <div style={{marginTop:55,height:260,opacity:fade(frame),transform:`translateY(${(1-fade(frame))*20}px)`}}><h1 style={{fontSize:scene.title.length>40?52:scene.title.length>28?62:80,lineHeight:1.05,letterSpacing:-3,margin:0,fontWeight:600,overflowWrap:'anywhere'}}>{scene.title}</h1></div>
    <div style={{marginTop:5,opacity:fade(frame)}}><DiagramV2 scene={scene}/></div>
    <div style={{position:'absolute',bottom:225,left:90,right:90,height:170,display:'flex',alignItems:'center',justifyContent:'center'}}>{caption&&<div style={{background:ink,color:'#fff',borderRadius:22,padding:'23px 34px',fontSize:40,lineHeight:1.3,textAlign:'center',maxWidth:850,overflowWrap:'anywhere'}}>{caption.text}</div>}</div>
    <div style={{position:'absolute',bottom:105,left:90,right:90,display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:20,color:'#6c827b'}}><span>{fixture?'SILENT FIXTURE · SYNTHETIC TIMING':'AI-GENERATED NARRATION'}</span><div style={{display:'flex',gap:8}}>{Array.from({length:total},(_,i)=><div key={i} style={{width:i===index?38:10,height:7,borderRadius:5,background:i<=index?teal:'#d4ded5'}}/>)}</div></div>
  </AbsoluteFill>;
}
export function PlanV2Video({timeline,audio=false}:{timeline:RenderTimeline;audio?:boolean}){return <AbsoluteFill>{timeline.scenes.map((s,i)=><Sequence key={s.id} from={s.start} durationInFrames={s.frames}><Scene scene={s} index={i} total={timeline.scenes.length} fixture={timeline.fixture} audio={audio}/></Sequence>)}</AbsoluteFill>}
