import { Vector3, Matrix4, BufferGeometry, Mesh, Group, Float32BufferAttribute, DataUtils, HalfFloatType, LinearFilter, RepeatWrapping } from 'three';

// Match CurveModifier's WebGL shader, including half-float quantization and
// linear filtering at texel centers. Sampling the curve directly would differ
// from the displayed mesh, especially at the repeating texture seam.
function bake(flow, instance) {
  const mesh = flow.object3D;
  if (mesh.isSkinnedMesh || Object.keys(mesh.geometry.morphAttributes).length) {
    throw new TypeError('Bake skinning/morph targets separately before using Flow');
  }
  const instanced = mesh.isInstancedMesh === true;
  if (instanced !== (instance !== undefined)) throw new TypeError('Use the matching Flow or InstancedFlow baking function');
  if (instanced && (instance < 0 || instance >= mesh.count)) throw new RangeError('Instance index out of range');
  mesh.updateWorldMatrix(true, false);
  const u = flow.uniforms;
  let curveIndex = 0, length = u.spineLength.value, offset = u.pathOffset.value;
  if (instanced) {
    const matrix = new Matrix4();
    mesh.getMatrixAt(instance, matrix);
    length = matrix.elements[12];
    curveIndex = matrix.elements[13];
    offset += matrix.elements[14];
  }
  if (!flow.curveArray[curveIndex] || !(length > 0) || !Number.isFinite(length)) throw new RangeError('An initialized curve is required');
  const texture = flow.splineTexture;
  const {data, width, height} = texture.image;
  if (texture.type !== HalfFloatType || height !== flow.curveArray.length * 4 || width < 2 || texture.magFilter !== LinearFilter || texture.minFilter !== LinearFilter || texture.wrapS !== RepeatWrapping) throw new TypeError('Unsupported Flow spline texture layout or filtering');
  const sample = (t, row, target) => {
    const x = t * width - 0.5, left = Math.floor(x), blend = x - left;
    const a = ((left % width + width) % width + row * width) * 4;
    const b = (((left + 1) % width + width) % width + row * width) * 4;
    const value = component => DataUtils.fromHalfFloat(data[a + component]) * (1 - blend) + DataUtils.fromHalfFloat(data[b + component]) * blend;
    return target.set(value(0), value(1), value(2));
  };
  const geometry = new BufferGeometry().copy(mesh.geometry);
  const input = mesh.geometry.getAttribute('position');
  if (!input) throw new TypeError('Position attribute required');
  const positions = new Float32BufferAttribute(input.count * 3, 3);
  const inputNormals = mesh.geometry.getAttribute('normal');
  const normals = inputNormals ? new Float32BufferAttribute(input.count * 3, 3) : null;
  const world = new Vector3(), spine = new Vector3(), a = new Vector3(), b = new Vector3(), c = new Vector3(), result = new Vector3();
  const bend = u.flow.value > 0;
  for (let i = 0; i < input.count; i++) {
    world.fromBufferAttribute(input, i).applyMatrix4(mesh.matrixWorld);
    const position = (bend ? (world.x + u.spineOffset.value) / length : 0) * u.pathSegment.value + offset;
    if (!Number.isFinite(position)) throw new RangeError('Finite Flow parameters required');
    const t = position - Math.floor(position), row = curveIndex * 4;
    sample(t, row, spine); sample(t, row + 1, a); sample(t, row + 2, b); sample(t, row + 3, c);
    result.copy(spine).addScaledVector(a, bend ? 0 : world.x).addScaledVector(b, world.y).addScaledVector(c, world.z);
    positions.setXYZ(i, result.x, result.y, result.z);
    if (normals) {
      result.set(0, 0, 0).addScaledVector(a, inputNormals.getX(i)).addScaledVector(b, inputNormals.getY(i)).addScaledVector(c, inputNormals.getZ(i)).normalize();
      normals.setXYZ(i, result.x, result.y, result.z);
    }
  }
  geometry.setAttribute('position', positions);
  if (normals) geometry.setAttribute('normal', normals);
  else geometry.computeVertexNormals();
  // The original tangents describe the undeformed surface.
  geometry.deleteAttribute('tangent');
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
const checked = fn => (...args) => {
  try { return {ok: true, value: fn(...args)}; }
  catch (error) { return {ok: false, error: String(error)}; }
};
export const bakeFlowGeometry = checked(flow => bake(flow));
export const bakeFlowInstanceGeometry = checked((flow, index) => bake(flow, index));

function prepare(root) {
  root.updateWorldMatrix(true,true);
  root.traverse(node => { if(node.isSkinnedMesh) { node.updateMatrixWorld(true); node.skeleton.update(); } });
}
function bakeMesh(mesh) {
  if (!mesh.isMesh || mesh.isInstancedMesh || mesh.isBatchedMesh) throw new TypeError('An ordinary or skinned Mesh is required');
  const source=mesh.geometry, input=source.getAttribute('position');
  if(!input) throw new TypeError('Position attribute required');
  const result=new BufferGeometry().copy(source), positions=new Float32BufferAttribute(input.count*3,3);
  const n=source.getAttribute('normal'), normals=n ? new Float32BufferAttribute(input.count*3,3) : null;
  const v=new Vector3(), normal=new Vector3(), delta=new Vector3(), skin=new Matrix4(), bone=new Matrix4();
  for(let i=0;i<input.count;i++) {
    mesh.getVertexPosition(i,v);positions.setXYZ(i,v.x,v.y,v.z);
    if(normals) {
      normal.fromBufferAttribute(n,i);
      for(let j=0;j<(source.morphAttributes.normal?.length??0);j++) {
        const weight=mesh.morphTargetInfluences[j];if(!weight)continue;
        delta.fromBufferAttribute(source.morphAttributes.normal[j],i);
        if(!source.morphTargetsRelative) delta.sub(v.fromBufferAttribute(n,i));
        normal.addScaledVector(delta,weight);
      }
      if(mesh.isSkinnedMesh) {
        skin.elements.fill(0);
        const indices=source.getAttribute('skinIndex'), weights=source.getAttribute('skinWeight');
        for(let j=0;j<4;j++) {
          const index=indices.getComponent(i,j),weight=weights.getComponent(i,j);
          bone.fromArray(mesh.skeleton.boneMatrices,index*16);
          for(let k=0;k<16;k++) skin.elements[k]+=bone.elements[k]*weight;
        }
        skin.premultiply(mesh.bindMatrixInverse).multiply(mesh.bindMatrix);
        normal.transformDirection(skin);
      } else normal.normalize();
      normals.setXYZ(i,normal.x,normal.y,normal.z);
    }
  }
  result.setAttribute('position',positions);
  result.morphAttributes={};result.morphTargetsRelative=false;
  result.deleteAttribute('skinIndex');result.deleteAttribute('skinWeight');result.deleteAttribute('tangent');
  if(normals)result.setAttribute('normal',normals);else result.computeVertexNormals();
  result.computeBoundingBox();result.computeBoundingSphere();return result;
}
export const bakeMeshGeometry=checked(mesh=>{prepare(mesh);return bakeMesh(mesh);});
export const bakeMeshHierarchy=checked(root=>{
  prepare(root);
  function visit(node,isRoot=false) {
    const output=node.isMesh ? new Mesh(bakeMesh(node),node.material) : new Group();
    output.name=node.name;output.visible=node.visible;output.userData={...node.userData};output.layers.mask=node.layers.mask;
    output.matrix.copy(isRoot ? node.matrixWorld : node.matrix);
    output.matrix.decompose(output.position,output.quaternion,output.scale);output.matrixAutoUpdate=false;
    for(const child of node.children) output.add(visit(child));
    return output;
  }
  const group=new Group();group.add(visit(root,true));group.updateMatrixWorld(true);return group;
});
