import {Vector3} from 'three';

// Pure connectivity construction. The caller owns the geometry snapshot.
export function buildTopologyGraph(geometry,tolerance) {
  const attribute=geometry.getAttribute('position'),index=geometry.index;
  if(!attribute||attribute.itemSize!==3)throw new TypeError('Three-component positions required');
  if(tolerance!==undefined&&(!Number.isFinite(tolerance)||tolerance<0))throw new RangeError('Nonnegative finite weld tolerance required');
  const count=index?.count??attribute.count;
  if(count%3!==0)throw new RangeError('A complete triangle list is required');
  const positions=[],sources=[],sourceMap=[],buckets=new Map();
  for(let i=0;i<attribute.count;i++) {
    const point=new Vector3().fromBufferAttribute(attribute,i);
    if(!point.toArray().every(Number.isFinite))throw new RangeError('Finite positions required');
    let vertex;
    if(tolerance===0)vertex=buckets.get(point.toArray().join(','));
    if(tolerance>0) {
      const cell=point.toArray().map(value=>Math.floor(value/tolerance));
      if(!cell.every(Number.isSafeInteger))throw new RangeError('Weld tolerance is too small for these coordinates');
      for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++) {
        for(const candidate of buckets.get([cell[0]+x,cell[1]+y,cell[2]+z].join(','))??[]) {
          if(point.distanceToSquared(positions[candidate])<=tolerance*tolerance&&(vertex===undefined||candidate<vertex))vertex=candidate;
        }
      }
      if(vertex===undefined) {
        const key=cell.join(','),list=buckets.get(key)??[];
        list.push(positions.length);buckets.set(key,list);
      }
    }
    if(vertex===undefined) {
      vertex=positions.length;positions.push(point);sources.push([]);
      if(tolerance===0)buckets.set(point.toArray().join(','),vertex);
    }
    sources[vertex].push(i);sourceMap.push(vertex);
  }
  const edges=[],faces=[],edgeMap=new Map();
  const vertexEdges=positions.map(()=>new Set()),vertexFaces=positions.map(()=>new Set());
  for(let i=0;i<count;i+=3) {
    const vertices=[0,1,2].map(j=>{
      const source=index?index.getX(i+j):i+j;
      if(!Number.isInteger(source)||source<0||source>=attribute.count)throw new RangeError('Triangle index out of bounds');
      return sourceMap[source];
    });
    const [a,b,c]=vertices.map(v=>positions[v]);
    const normal=new Vector3().subVectors(b,a).cross(new Vector3().subVectors(c,a));
    const degenerate=new Set(vertices).size<3||normal.lengthSq()===0;
    normal.normalize();
    const face={vertices,edges:[],normal,degenerate},faceIndex=faces.length;
    for(const vertex of vertices)vertexFaces[vertex].add(faceIndex);
    for(let j=0;j<3;j++) {
      const from=vertices[j],to=vertices[(j+1)%3];
      if(from===to)continue;
      const low=Math.min(from,to),high=Math.max(from,to),key=low+','+high;
      let edge=edgeMap.get(key);
      if(edge===undefined) {
        edge=edges.length;edges.push({vertices:[low,high],faces:[],directions:[]});edgeMap.set(key,edge);
        vertexEdges[low].add(edge);vertexEdges[high].add(edge);
      }
      if(!face.edges.includes(edge)) {
        face.edges.push(edge);edges[edge].faces.push(faceIndex);edges[edge].directions.push(from===low?1:-1);
      }
    }
    faces.push(face);
  }
  return {positions,sources,edges,faces,vertexEdges:vertexEdges.map(s=>[...s]),vertexFaces:vertexFaces.map(s=>[...s])};
}

export function connectedFaceIndices(graph,start) {
  const visited=new Set([start]),queue=[start];
  for(let i=0;i<queue.length;i++) {
    for(const edge of graph.faces[queue[i]].edges)for(const face of graph.edges[edge].faces) {
      if(!visited.has(face)){visited.add(face);queue.push(face);}
    }
  }
  return queue;
}
