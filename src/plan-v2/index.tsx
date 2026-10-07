import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {PlanV2Video} from './Composition';
import {fixtureTimeline} from './fixture';
const timeline=fixtureTimeline();
registerRoot(()=> <Composition id="PlanV2" component={PlanV2Video} width={1080} height={1920} fps={30} durationInFrames={timeline.frames} defaultProps={{timeline,audio:false}} calculateMetadata={({props})=>({durationInFrames:props.timeline.frames})}/>);
