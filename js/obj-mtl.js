import {Group,Mesh,BufferGeometry,Color,ColorManagement,SRGBColorSpace} from 'three';
import {OBJExporter} from 'three/addons/exporters/OBJExporter.js';
const clean=value=>{if(!value || /[\r\n\0]/.test(value))throw new TypeError('File names must be nonempty single lines');return value;};
const rgb=color=>{const c=ColorManagement.workingToColorSpace(color.clone(),SRGBColorSpace);return `${c.r} ${c.g} ${c.b}`;};
export const texturePaths=()=>Object.create(null);
export const oBJMTLExporter=()=>({export:exportBundle});
function exportBundle(root,mtlFile,paths) {
 clean(mtlFile);root.updateWorldMatrix(true,true);
 const group=new Group(),materials=new Map(),mtl=[],warnings=[],used=new Set(),geometries=[];
 function materialFor(source) {
  if(materials.has(source.uuid))return materials.get(source.uuid);
  if(!source.color || source.isShaderMaterial)throw new TypeError('Only color-based materials can be exported to MTL');
  const name=`material_${materials.size}`,copy=source.clone();copy.name=name;materials.set(source.uuid,copy);
  mtl.push(`newmtl ${name}`,`Kd ${rgb(source.color)}`,`Ks ${rgb(source.specular??new Color(0,0,0))}`,`Ke ${rgb((source.emissive??new Color(0,0,0)).clone().multiplyScalar(source.emissiveIntensity??1))}`,`d ${source.opacity}`,`Ns ${source.shininess??Math.min(1000,Math.max(0,2/Math.max(0.04,source.roughness??1)**4-2))}`,`illum ${source.isMeshBasicMaterial?0:2}`);
  if(source.isMeshStandardMaterial)warnings.push(`${name}: PBR properties are approximated by Phong MTL parameters`);
  for(const [key,tag] of [['map','map_Kd'],['specularMap','map_Ks'],['emissiveMap','map_Ke'],['normalMap','norm'],['bumpMap','map_Bump'],['alphaMap','map_d']]) {
   const texture=source[key];if(!texture)continue;
   const path=paths[texture.uuid];if(!Object.hasOwn(paths,texture.uuid))throw new Error(`Texture path missing for ${texture.uuid}`);
   clean(path);if(texture.rotation!==0 || !texture.matrixAutoUpdate)throw new Error('Bake rotated/custom texture UV matrices before MTL export');
   used.add(path);
   mtl.push(`${tag} -s ${texture.repeat.x} ${texture.repeat.y} 1 -o ${texture.offset.x} ${texture.offset.y} 0 ${path}`);
  }
  mtl.push('');return copy;
 }
 try {
  root.traverse(node=>{
   if(node.isLine || node.isPoints)throw new TypeError('OBJ/MTL bundle currently accepts triangle meshes');
   if(!node.isMesh)return;
   if(node.isSkinnedMesh || node.isInstancedMesh || node.isBatchedMesh || Object.keys(node.geometry.morphAttributes).length)throw new TypeError('Bake dynamic meshes before OBJ/MTL export');
   const source=node.geometry,position=source.getAttribute('position');if(!position)return;
   const count=source.index?.count??position.count;
   const groups=Array.isArray(node.material)?source.groups:[{start:0,count,materialIndex:0}];
   for(const range of groups) {
    const start=Math.max(range.start,source.drawRange.start),end=Math.min(count,range.start+range.count,source.drawRange.start+source.drawRange.count);
    if(end<=start)continue;
    if(start%3 || (end-start)%3)throw new Error('Triangle-aligned groups and draw ranges required');
    const material=Array.isArray(node.material)?node.material[range.materialIndex]:node.material;
    if(!material)throw new Error('Material group references an absent material');
    const geometry=new BufferGeometry().copy(source);geometries.push(geometry);
    geometry.clearGroups();geometry.setIndex(Array.from({length:end-start},(_,i)=>source.index?source.index.getX(start+i):start+i));
    const mesh=new Mesh(geometry,materialFor(material));mesh.name=node.name.replace(/[\r\n\0]/g,'_');mesh.matrix.copy(node.matrixWorld);mesh.matrixAutoUpdate=false;group.add(mesh);
   }
  });
  group.updateMatrixWorld(true);
  return {obj:`mtllib ${mtlFile}\n`+new OBJExporter().parse(group),mtl:mtl.join('\n'),texturePaths:[...used],warnings};
 } finally {
  for(const geometry of geometries)geometry.dispose();for(const material of materials.values())material.dispose();
 }
}
