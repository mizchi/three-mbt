export const fbx=`; FBX 7.4.0 project file
FBXHeaderExtension:  {
\tFBXHeaderVersion: 1003
\tFBXVersion: 7400
}
Objects:  {
\tGeometry: 100, "Geometry::Triangle", "Mesh" {
\t\tVertices: *9 {
\t\t\ta: 0,0,0,1,0,0,0,1,0
\t\t}
\t\tPolygonVertexIndex: *3 {
\t\t\ta: 0,1,-3
\t\t}
\t}
\tModel: 200, "Model::Triangle", "Mesh" {
\t\tVersion: 232
\t}
}
Connections:  {
\tC: "OO",100,200
\tC: "OO",200,0
}
`;
export const collada=`<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">
<asset><created>2026-01-01T00:00:00Z</created><modified>2026-01-01T00:00:00Z</modified><unit meter="1"/><up_axis>Y_UP</up_axis></asset>
<library_geometries><geometry id="triangle"><mesh>
<source id="positions"><float_array id="position-array" count="9">0 0 0 1 0 0 0 1 0</float_array><technique_common><accessor source="#position-array" count="3" stride="3"><param name="X" type="float"/><param name="Y" type="float"/><param name="Z" type="float"/></accessor></technique_common></source>
<vertices id="vertices"><input semantic="POSITION" source="#positions"/></vertices>
<triangles count="1"><input semantic="VERTEX" source="#vertices" offset="0"/><p>0 1 2</p></triangles>
</mesh></geometry></library_geometries>
<library_visual_scenes><visual_scene id="Scene"><node id="part"><instance_geometry url="#triangle"/></node></visual_scene></library_visual_scenes>
<scene><instance_visual_scene url="#Scene"/></scene></COLLADA>`;
export const bvh='HIERARCHY\nROOT hip\n{\nOFFSET 0 0 0\nCHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation\nEnd Site\n{\nOFFSET 0 1 0\n}\n}\nMOTION\nFrames: 2\nFrame Time: 1\n0 0 0 0 0 0\n2 0 0 0 0 0\n';
