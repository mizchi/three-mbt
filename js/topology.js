import {BufferGeometry,Float32BufferAttribute,Vector3,Matrix4} from 'three';
import {buildTopologyGraph,connectedFaceIndices} from './topology-graph.js';
import {extrudeRegion,splitEdges} from './topology-edit.js';
import {bevelEdges} from './topology-bevel.js';

const checked=fn=>(...args)=>{
  try{return {ok:true,value:fn(...args)};}
  catch(error){return {ok:false,error:String(error)};}
};

class MeshTopology {
  #geometry;
  #graph;
  #ids;
  constructor(source,tolerance) {
    if(source.hasAttribute('skinIndex')||source.hasAttribute('skinWeight')||Object.values(source.morphAttributes).some(a=>a.length))throw new TypeError('Bake skinning and morph attributes before topology editing');
    this.#geometry=new BufferGeometry().copy(source);
    this.#graph=buildTopologyGraph(this.#geometry,tolerance);
    this.#ids={
      vertex:this.#graph.positions.map((_,index)=>Object.freeze({owner:this,kind:'vertex',index})),
      edge:this.#graph.edges.map((_,index)=>Object.freeze({owner:this,kind:'edge',index})),
      face:this.#graph.faces.map((_,index)=>Object.freeze({owner:this,kind:'face',index})),
    };
  }
  validate(id,kind) {
    if(!id||id.owner!==this||id.kind!==kind||this.#ids[kind][id.index]!==id)throw new TypeError('ID belongs to a different topology or entity kind');
    return id.index;
  }
  vertices(){return this.#ids.vertex.slice();}
  edges(){return this.#ids.edge.slice();}
  faces(){return this.#ids.face.slice();}
  vertexId(index){return this.#ids.vertex[index]??null;}
  edgeId(index){return this.#ids.edge[index]??null;}
  faceId(index){return this.#ids.face[index]??null;}
  vertexPosition(id){return this.#graph.positions[this.validate(id,'vertex')].clone();}
  sourceIndices(id){return this.#graph.sources[this.validate(id,'vertex')].slice();}
  vertexEdges(id){return this.#graph.vertexEdges[this.validate(id,'vertex')].map(i=>this.#ids.edge[i]);}
  vertexFaces(id){return this.#graph.vertexFaces[this.validate(id,'vertex')].map(i=>this.#ids.face[i]);}
  edgeVertices(id){return this.#graph.edges[this.validate(id,'edge')].vertices.map(i=>this.#ids.vertex[i]);}
  edgeFaces(id){return this.#graph.edges[this.validate(id,'edge')].faces.map(i=>this.#ids.face[i]);}
  faceVertices(id){return this.#graph.faces[this.validate(id,'face')].vertices.map(i=>this.#ids.vertex[i]);}
  faceEdges(id){return this.#graph.faces[this.validate(id,'face')].edges.map(i=>this.#ids.edge[i]);}
  faceNormal(id){return this.#graph.faces[this.validate(id,'face')].normal.clone();}
  connectedFaces(id){return connectedFaceIndices(this.#graph,this.validate(id,'face')).map(i=>this.#ids.face[i]);}
  boundaryEdges(){return this.#ids.edge.filter(id=>this.#graph.edges[id.index].faces.length===1);}
  nonmanifoldEdges(){return this.#ids.edge.filter(id=>this.#graph.edges[id.index].faces.length>2);}
  inconsistentEdges(){return this.#ids.edge.filter(id=>{const e=this.#graph.edges[id.index];return e.faces.length===2&&e.directions[0]===e.directions[1];});}
  degenerateFaces(){return this.#ids.face.filter(id=>this.#graph.faces[id.index].degenerate);}
  geometry(){return new BufferGeometry().copy(this.#geometry);}
  extrudeFaces(ids,offset,sideMaterial) {
    return extrudeRegion(this.#geometry,this.#graph,ids.map(id=>this.validate(id,'face')),offset,sideMaterial);
  }
  splitEdges(ids,fraction) {
    return splitEdges(this.#geometry,this.#graph,ids.map(id=>this.validate(id,'edge')),fraction);
  }
  bevelEdges(ids,width,material) {
    return bevelEdges(this.#geometry,this.#graph,ids.map(id=>this.validate(id,'edge')),width,material);
  }
  transformVertices(ids,matrix) {
    const elements=matrix.elements;
    if(!elements.every(Number.isFinite)||elements[3]!==0||elements[7]!==0||elements[11]!==0||elements[15]!==1)throw new RangeError('A finite affine transform is required');
    const selected=new Set();
    for(const id of ids)for(const index of this.sourceIndices(id))selected.add(index);
    if(selected.size===0)return this.geometry();
    const result=this.geometry(),source=result.getAttribute('position');
    const positions=new Float32BufferAttribute(source.count*3,3),point=new Vector3();
    for(let i=0;i<source.count;i++) {
      point.fromBufferAttribute(source,i);
      if(selected.has(i))point.applyMatrix4(matrix);
      positions.setXYZ(i,point.x,point.y,point.z);
    }
    if(!positions.array.every(Number.isFinite))throw new RangeError('Edited positions exceed float storage');
    result.setAttribute('position',positions);
    result.computeVertexNormals();result.deleteAttribute('tangent');
    result.computeBoundingBox();result.computeBoundingSphere();
    return result;
  }
}

class MeshSelection {
  #topology;
  #vertices=new Set();
  #edges=new Set();
  #faces=new Set();
  constructor(topology){this.#topology=topology;}
  topology(){return this.#topology;}
  #set(set,id,kind,selected){
    this.#topology.validate(id,kind);
    if(selected)set.add(id);else set.delete(id);
  }
  setVertex(id,selected){this.#set(this.#vertices,id,'vertex',selected);}
  setEdge(id,selected){this.#set(this.#edges,id,'edge',selected);}
  setFace(id,selected){this.#set(this.#faces,id,'face',selected);}
  vertices(){return [...this.#vertices];}
  edges(){return [...this.#edges];}
  faces(){return [...this.#faces];}
  clear(){this.#vertices.clear();this.#edges.clear();this.#faces.clear();}
  effectiveVertices(){
    const vertices=new Set(this.#vertices);
    for(const edge of this.#edges)for(const id of this.#topology.edgeVertices(edge))vertices.add(id);
    for(const face of this.#faces)for(const id of this.#topology.faceVertices(face))vertices.add(id);
    return [...vertices];
  }
  growVertices(){
    const current=this.effectiveVertices();
    for(const vertex of current){
      this.#vertices.add(vertex);
      for(const edge of this.#topology.vertexEdges(vertex))for(const neighbor of this.#topology.edgeVertices(edge))this.#vertices.add(neighbor);
    }
  }
  selectConnectedFaces(face){
    for(const id of this.#topology.connectedFaces(face))this.#faces.add(id);
  }
  transformedGeometry(matrix){return this.#topology.transformVertices(this.effectiveVertices(),matrix);}
  translatedGeometry(offset){return this.transformedGeometry(new Matrix4().makeTranslation(offset.x,offset.y,offset.z));}
  extrudedGeometry(offset,sideMaterial){return this.#topology.extrudeFaces(this.faces(),offset,sideMaterial);}
  splitEdgesGeometry(fraction){return this.#topology.splitEdges(this.edges(),fraction);}
  beveledGeometry(width,material){return this.#topology.bevelEdges(this.edges(),width,material);}
}
export const meshTopology=geometry=>new MeshTopology(geometry);
export const meshTopologyWelded=(geometry,tolerance)=>new MeshTopology(geometry,tolerance);
export const meshTopologyChecked=checked(meshTopology);
export const meshTopologyWeldedChecked=checked(meshTopologyWelded);
export const meshSelection=topology=>new MeshSelection(topology);
