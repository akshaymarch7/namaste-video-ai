import type { Storyboard } from '@/src/storyboards/contracts';
type Visual=Storyboard['scenes'][number]['visual'];
export function SceneVisual({visual}: {visual:Visual}) {
  if(visual.component==='flow')return <div className="scene-flow"><div className="scene-nodes">{visual.data.steps.map((step,index)=><div key={step.id}><span>{String(index+1).padStart(2,'0')}</span><strong>{step.label}</strong></div>)}</div><ul className="scene-connections" aria-label="Diagram connections">{visual.data.edges.map(edge=><li key={edge.id}>{visual.data.steps.find(s=>s.id===edge.from)?.label}<span aria-label="leads to"> → </span>{visual.data.steps.find(s=>s.id===edge.to)?.label}</li>)}</ul></div>;
  if(visual.component==='comparison')return <div className="scene-comparison">{[visual.data.left,visual.data.right].map((panel,index)=><div key={index}><h4>{panel.heading}</h4><ul>{panel.points.map((point,i)=><li key={i}>{point}</li>)}</ul></div>)}</div>;
  return <div className={`scene-labels scene-labels--${visual.component}`}><span aria-hidden="true" className="scene-symbol">{visual.component==='takeaway'?'↗':'◎'}</span>{visual.data.labels.map((label,i)=><strong key={i}>{label}</strong>)}</div>;
}
