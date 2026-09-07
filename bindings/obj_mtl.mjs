import {p,expr,cls} from './helpers.mjs';
export const objMTL=[
 cls('TexturePaths','',[expr('set','texture : Texture, path : String','Unit','{ self[texture.uuid] = path; }')],{factory:{name:'TexturePaths',args:'',js:'texturePaths',module:'obj-mtl'}}),
 cls('OBJMTLExporter','',[{name:'export_bundle',args:'root : Object3D, mtl_file : String, textures : TexturePaths',returns:'OBJMTL',js:'export',throws:'ExportError'}],{factory:{name:'OBJMTLExporter',args:'',js:'oBJMTLExporter',module:'obj-mtl'}}),
 cls('OBJMTL','',[p('obj','String'),p('mtl','String'),expr('texture_paths','','FixedArray[String]','self.texturePaths.slice()'),expr('warnings','','FixedArray[String]','self.warnings.slice()')],{factory:null}),
];
