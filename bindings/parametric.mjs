import {m,p,rw,expr,upcast,cls} from './helpers.mjs';
const addon=(type,args,methods,checked=false)=>cls(type,args,methods,{factory:{
  name:type,args,js:type[0].toLowerCase()+type.slice(1)+(checked?'Checked':''),module:'parametric',
  ...(checked?{throws:'ModelingError'}:{}),
}});
const checked=method=>({...method,throws:'ModelingError'});
export const parametric=[
  addon('LoftOptions','',[...rw('closed','Bool'),...rw('cap_start','Bool','capStart'),...rw('cap_end','Bool','capEnd')]),
  addon('LoftGeometry','sections : FixedArray[FixedArray[Vector3]], options : LoftOptions',[
    upcast('buffer_geometry','BufferGeometry'),
    expr('sections','','FixedArray[FixedArray[Vector3]]','self.parameters.sections.map(row=>row.map(point=>point.clone()))'),
  ],true),
  addon('NURBSVolume','degree_u : Int, degree_v : Int, degree_w : Int, knots_u : FixedArray[Double], knots_v : FixedArray[Double], knots_w : FixedArray[Double], points : FixedArray[FixedArray[FixedArray[Vector4]]]',[
    checked(m('get_point','u : Double, v : Double, w : Double, target : Vector3','Unit','getPoint')),
    ...['u','v','w'].flatMap((axis,i)=>[p('degree_'+axis,'Int','degree'+(i+1)),expr('knots_'+axis,'','FixedArray[Double]',`self.knots${i+1}.slice()`)]),
    expr('control_points','','FixedArray[FixedArray[FixedArray[Vector4]]]','self.controlPoints.map(plane=>plane.map(row=>row.map(point=>point.clone())))'),
    checked(expr('set_control_point','u : Int, v : Int, w : Int, point : Vector4','Unit','{ const target=self.controlPoints[u]?.[v]?.[w];if(!target||![point.x,point.y,point.z,point.w].every(Number.isFinite)||point.w<=0)throw new RangeError("Invalid control point or index");target.copy(point); }')),
  ],true),
  addon('NURBSUtils','',[
    checked(m('find_span','degree : Int, u : Double, knots : FixedArray[Double]','Int','findSpan')),
    checked(m('basis_functions','span : Int, u : Double, degree : Int, knots : FixedArray[Double]','FixedArray[Double]','calcBasisFunctions')),
    checked(m('basis_derivatives','span : Int, u : Double, degree : Int, order : Int, knots : FixedArray[Double]','FixedArray[FixedArray[Double]]','calcBasisFunctionDerivatives')),
    checked(m('bspline_point','degree : Int, knots : FixedArray[Double], points : FixedArray[Vector4], u : Double','Vector4','calcBSplinePoint')),
    ...[['bspline_derivatives','Vector4','calcBSplineDerivatives'],['curve_derivatives','Vector3','calcNURBSDerivatives']].map(([name,type,js])=>checked(m(name,'degree : Int, knots : FixedArray[Double], points : FixedArray[Vector4], u : Double, order : Int',`FixedArray[${type}]`,js))),
    checked(m('binomial','k : Int, i : Int','Double','calcKoverI')),
    checked(m('rational_derivatives','derivatives : FixedArray[Vector4]','FixedArray[Vector3]','calcRationalCurveDerivatives')),
    checked(m('surface_point','degree_u : Int, degree_v : Int, knots_u : FixedArray[Double], knots_v : FixedArray[Double], points : FixedArray[FixedArray[Vector4]], u : Double, v : Double, target : Vector3','Vector3','calcSurfacePoint')),
    checked(m('volume_point','degree_u : Int, degree_v : Int, degree_w : Int, knots_u : FixedArray[Double], knots_v : FixedArray[Double], knots_w : FixedArray[Double], points : FixedArray[FixedArray[FixedArray[Vector4]]], u : Double, v : Double, w : Double, target : Vector3','Vector3','calcVolumePoint')),
  ]),
  addon('ImprovedNoise','',[m('noise','x : Double, y : Double, z : Double','Double')]),
  {...addon('SimplexNoise','',[
    m('noise','x : Double, y : Double','Double'),m('noise3d','x : Double, y : Double, z : Double','Double'),m('noise4d','x : Double, y : Double, z : Double, w : Double','Double'),
  ]),factories:[
    {name:'seeded',args:'seed : Int',js:'simplexNoiseSeeded',module:'parametric'},
    {name:'with_random',args:'random : () -> Double',js:'simplexNoiseRandomChecked',module:'parametric',throws:'ModelingError'},
  ]},
];
