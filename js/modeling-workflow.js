import { OBB } from 'three/addons/math/OBB.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { Octree } from 'three/addons/math/Octree.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
export const oBB = (center,size,rotation) => new OBB(center,size,rotation);
export const capsule = (start,end,radius) => new Capsule(start,end,radius);
export const octree = () => new Octree();
export const meshSurfaceSampler = mesh => new MeshSurfaceSampler(mesh);
