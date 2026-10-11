// Zero-based common scale; labels retain the exact supplied values and unit.
export function chartFractions(values:readonly number[]){
 if(values.some(v=>!Number.isFinite(v)||v<0))throw Error('INVALID_CHART_VALUE');
 const maximum=Math.max(0,...values);
 return values.map(value=>maximum===0?0:value/maximum);
}
