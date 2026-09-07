import {m,cls} from './helpers.mjs';
const checked=method=>({...method,throws:'ModelingError'});
const initialize=(name,args='',js=name)=>({...checked(m(name,args,'Unit',js)),async:true});
export const csg=[cls('CSG','',[
  initialize('initialize'),initialize('initialize_from_url','url : String','initializeFromUrl'),
  initialize('initialize_from_bytes','data : Bytes','initializeFromBytes'),
  m('ready','','Bool'),m('weld_tolerance','','Double','weldTolerance'),
  checked(m('set_weld_tolerance','value : Double','Unit','setWeldTolerance')),
  ...['union','subtract','intersect'].flatMap(operation=>[
    checked(m(operation+'_geometry','left : BufferGeometry, right : BufferGeometry, right_material_offset : Int','BufferGeometry',operation+'Geometry')),
    checked(m(operation+'_mesh','left : Mesh, right : Mesh','Mesh',operation+'Mesh')),
  ]),
],{factory:{name:'CSG',args:'',js:'cSG',module:'csg'}})];
