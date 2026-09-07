import {Vector3,SkeletonHelper} from 'three';
import {CCDIKSolver} from 'three/addons/animation/CCDIKSolver.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
export const iKLink=index=>({index,enabled:true});
export const iKChain=(target,effector,links)=>({target,effector,links:links.slice(),iteration:10});
export const cCDIKSolver=(mesh,chains)=>{
 const count=mesh.skeleton.bones.length;
 for(const chain of chains) {
  for(const index of [chain.target,chain.effector,...chain.links.map(link=>link.index)]) {
   if(!Number.isInteger(index)||index<0||index>=count)throw new RangeError('IK bone index out of bounds');
  }
 }
 return new CCDIKSolver(mesh,chains.slice());
};
export const retargetOptions=()=>({
 preserveBoneMatrix:true,preserveBonePositions:true,useTargetMatrix:false,
 hip:'hip',hipInfluence:new Vector3(1,1,1),scale:1,names:Object.create(null),
 useFirstFramePosition:false,
});
const copyOptions=options=>({...options,names:{...options.names},trim:options.trim?.slice()});
export const skeletonUtils=()=>({
 retarget:(target,source,options)=>SkeletonUtils.retarget(target,source,copyOptions(options)),
 retargetClip:(target,source,clip,options)=>{
  if(!(clip.duration>0)||!clip.tracks.length)throw new RangeError('A nonempty, positive-duration clip is required');
  const fps=options.fps??Math.max(...clip.tracks.map(track=>track.times.length))/clip.duration;
  if(!Number.isFinite(fps)||Math.round(clip.duration*fps)<2)throw new RangeError('At least two finite sampling frames required');
  if(options.trim&&!(options.trim[0]>=0&&options.trim[0]<options.trim[1]&&options.trim[1]<=clip.duration))throw new RangeError('Trim must lie within the clip');
  let helper;
  if(!source.isObject3D) {
   if(!source.bones.length)throw new RangeError('A source skeleton with bones is required');
   helper=new SkeletonHelper(source.bones[0]);helper.skeleton=source;source=helper;
  }
  try {return SkeletonUtils.retargetClip(target,source,clip,copyOptions(options));}
  finally {if(helper){helper.geometry.dispose();helper.material.dispose();}}
 },
});
