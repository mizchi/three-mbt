import {m,p,expr,nullable,cls} from './helpers.mjs';
const checked=method=>({...method,throws:'ModelingError'});
const addon=(type,args,methods)=>cls(type,args,methods,{factory:{name:type,args,js:type[0].toLowerCase()+type.slice(1),module:'topology'}});
export const topology=[
  ...['Vertex','Edge','Face'].map(kind=>cls('Mesh'+kind+'Id','',[p('index','Int')],{factory:null})),
  {...addon('MeshTopology','geometry : BufferGeometry',[
    ...['vertex','edge','face'].flatMap(kind=>{
      const type='Mesh'+kind[0].toUpperCase()+kind.slice(1)+'Id';
      return [m(kind==='vertex'?'vertices':kind+'s','','FixedArray['+type+']'),nullable(kind+'_id','index : Int',type,`self.${kind}Id(index)`)];
    }),
    checked(m('vertex_position','id : MeshVertexId','Vector3','vertexPosition')),
    checked(m('source_indices','id : MeshVertexId','FixedArray[Int]','sourceIndices')),
    ...[['vertex_edges','MeshVertexId','MeshEdgeId','vertexEdges'],['vertex_faces','MeshVertexId','MeshFaceId','vertexFaces'],
      ['edge_vertices','MeshEdgeId','MeshVertexId','edgeVertices'],['edge_faces','MeshEdgeId','MeshFaceId','edgeFaces'],
      ['face_vertices','MeshFaceId','MeshVertexId','faceVertices'],['face_edges','MeshFaceId','MeshEdgeId','faceEdges'],
      ['connected_faces','MeshFaceId','MeshFaceId','connectedFaces']].map(([name,input,output,js])=>checked(m(name,`id : ${input}`,`FixedArray[${output}]`,js))),
    checked(m('face_normal','id : MeshFaceId','Vector3','faceNormal')),
    ...[['boundary_edges','MeshEdgeId','boundaryEdges'],['nonmanifold_edges','MeshEdgeId','nonmanifoldEdges'],['inconsistent_edges','MeshEdgeId','inconsistentEdges'],['degenerate_faces','MeshFaceId','degenerateFaces']].map(([name,type,js])=>m(name,'',`FixedArray[${type}]`,js)),
    m('geometry','','BufferGeometry'),
  ]),factory:{name:'MeshTopology',args:'geometry : BufferGeometry',js:'meshTopologyChecked',module:'topology',throws:'ModelingError'},
    factories:[{name:'from_welded',args:'geometry : BufferGeometry, tolerance : Double',js:'meshTopologyWeldedChecked',module:'topology',throws:'ModelingError'}]},
  addon('MeshSelection','topology : MeshTopology',[
    m('topology','','MeshTopology'),
    ...['Vertex','Edge','Face'].flatMap(kind=>[
      checked(m('set_'+kind.toLowerCase(),`id : Mesh${kind}Id, selected : Bool`,'Unit','set'+kind)),
      m(kind==='Vertex'?'vertices':kind.toLowerCase()+'s','',`FixedArray[Mesh${kind}Id]`),
    ]),
    m('clear'),m('effective_vertices','','FixedArray[MeshVertexId]','effectiveVertices'),
    m('grow_vertices','','Unit','growVertices'),checked(m('select_connected_faces','face : MeshFaceId','Unit','selectConnectedFaces')),
    checked(m('translated_geometry','offset : Vector3','BufferGeometry','translatedGeometry')),
    checked(m('transformed_geometry','matrix : Matrix4','BufferGeometry','transformedGeometry')),
    checked(m('extruded_geometry','offset : Vector3, side_material : Int','BufferGeometry','extrudedGeometry')),
    checked(m('split_edges_geometry','fraction : Double','BufferGeometry','splitEdgesGeometry')),
    checked(m('beveled_geometry','width : Double, bevel_material : Int','BufferGeometry','beveledGeometry')),
  ]),
];
