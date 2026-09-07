import {m,p,rw,expr,nullable,optional,upcast,cls} from './helpers.mjs';
const addon=(type,args,methods)=>cls(type,args,methods,{factory:{name:type,args,js:type[0].toLowerCase()+type.slice(1),module:'rigging'}});
export const rigging=[
 addon('IKLink','index : Int',[p('index','Int'),...rw('enabled','Bool'),
  ...['limitation','rotation_min','rotation_max'].flatMap(name=>{
   const js=name.replace(/_([a-z])/g,(_,c)=>c.toUpperCase());
   return [nullable(name,'','Vector3',`self.${js}`),optional(name,'Vector3',js)];
  }),
 ]),
 addon('IKChain','target : Int, effector : Int, links : FixedArray[IKLink]',[
  p('target','Int'),p('effector','Int'),...rw('iteration','Int'),
  nullable('blend_factor','','Double','self.blendFactor'),{name:'set_blend_factor',option:'Double',expression:'{ if(value==null)delete self.blendFactor;else self.blendFactor=value; }'},
  ...['min_angle','max_angle'].flatMap(name=>{const js=name.replace(/_([a-z])/g,(_,c)=>c.toUpperCase());return [nullable(name,'','Double',`self.${js}`),optional(name,'Double',js)];}),
  expr('links','','FixedArray[IKLink]','self.links.slice()'),
 ]),
 addon('CCDIKSolver','mesh : SkinnedMesh, chains : FixedArray[IKChain]',[
  {...m('update','blend : Double','CCDIKSolver'),throws:'ModelingError'},
  {...m('update_one','chain : IKChain, blend : Double','CCDIKSolver','updateOne'),throws:'ModelingError'},
  m('create_helper','sphere_size : Double','CCDIKHelper','createHelper'),p('mesh','SkinnedMesh'),
 ]),
 cls('CCDIKHelper','',[upcast('object3d','Object3D'),m('dispose')],{factory:null}),
 addon('RetargetOptions','',[
  ...rw('preserve_bone_matrix','Bool','preserveBoneMatrix'),...rw('preserve_bone_positions','Bool','preserveBonePositions'),
  ...rw('use_target_matrix','Bool','useTargetMatrix'),...rw('hip','String'),...rw('scale','Double'),
  ...rw('hip_influence','Vector3','hipInfluence'),optional('hip_position','Vector3','hipPosition'),
  ...rw('use_first_frame_position','Bool','useFirstFramePosition'),optional('fps','Double'),
  expr('map_bone','target_name : String, source_name : String','Unit','{ self.names[target_name]=source_name; }'),
  expr('set_trim','start : Double, end : Double','Unit','{ self.trim=[start,end]; }'),
  expr('clear_trim','','Unit','{ delete self.trim; }'),
  expr('set_bone_name_resolver','callback : (Bone) -> String','Unit','{ self.getBoneName=callback; }'),
  expr('clear_bone_name_resolver','','Unit','{ delete self.getBoneName; }'),
 ]),
 addon('SkeletonUtils','',[
  ...[['meshes','SkinnedMesh'],['skeletons','Skeleton']].flatMap(([name,type])=>[
   {...m('retarget_'+name,`target : ${type}, source : ${type}, options : RetargetOptions`,'Unit','retarget'),throws:'ModelingError'},
   {...m(name==='meshes'?'retarget_clip_meshes':'retarget_clip_from_skeleton',`target : SkinnedMesh, source : ${type}, clip : AnimationClip, options : RetargetOptions`,'AnimationClip','retargetClip'),throws:'ModelingError'},
  ]),
 ]),
];
