import {LoftGeometry} from 'three/addons/geometries/LoftGeometry.js';
import {NURBSVolume} from 'three/addons/curves/NURBSVolume.js';
import * as NURBSUtils from 'three/addons/curves/NURBSUtils.js';
import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';
import {SimplexNoise} from 'three/addons/math/SimplexNoise.js';

export const checked = fn => (...args) => {
  try { return {ok:true,value:fn(...args)}; }
  catch(error) { return {ok:false,error:String(error)}; }
};
const finitePoint = point => [point.x,point.y,point.z].every(Number.isFinite);
export const loftOptions = () => ({closed:true,capStart:false,capEnd:false});
export function loftGeometry(sections, options) {
  const columns=sections[0]?.length??0;
  if(sections.length<2 || columns<(options.closed?3:2) ||
    sections.some(section=>section.length!==columns||section.some(point=>!finitePoint(point)))) {
    throw new RangeError('At least two finite sections with matching point counts are required');
  }
  if(!options.closed&&(options.capStart||options.capEnd))throw new RangeError('Caps require closed sections');
  return new LoftGeometry(sections.map(section=>section.map(point=>point.clone())),{...options});
}
export const loftGeometryChecked=checked(loftGeometry);

function spline(degree, knots, count=knots.length-degree-1, u) {
  if(!Number.isInteger(degree)||degree<0||count<=degree||knots.length!==count+degree+1 ||
    knots.some((value,i)=>!Number.isFinite(value)||(i>0&&value<knots[i-1])) ||
    !(knots[degree]<knots[count]))throw new RangeError('Invalid NURBS degree, knot vector, or control point count');
  if(u!==undefined && (!Number.isFinite(u)||u<knots[degree]||u>knots[count]))throw new RangeError('NURBS parameter out of range');
}
function pointsValid(points) {
  if(points.some(point=>!finitePoint(point)||!Number.isFinite(point.w)||point.w<=0))throw new RangeError('Finite control points with positive weights required');
}
function gridValid(degrees, knots, points) {
  function axis(grid, depth) {
    spline(degrees[depth],knots[depth],grid.length);
    if(depth===degrees.length-1)pointsValid(grid);
    else for(const row of grid)axis(row,depth+1);
  }
  axis(points,0);
}
function derivativeOrder(n, max=64) {
  if(!Number.isInteger(n)||n<0||n>max)throw new RangeError('Invalid derivative order');
}
function spanValid(span,u,p,knots) {
  spline(p,knots,undefined,u);
  if(span!==NURBSUtils.findSpan(p,u,knots))throw new RangeError('Span does not contain the parameter');
}
function bsplineDerivatives(p,U,P,u,n) {
  spline(p,U,P.length,u);pointsValid(P);derivativeOrder(n);
  // r185 appends an extra derivative and gives higher zero derivatives w=1.
  const derivatives=NURBSUtils.calcBSplineDerivatives(p,U,P,u,n).slice(0,n+1);
  for(let k=p+1;k<=n;k++)derivatives[k].set(0,0,0,0);
  return derivatives;
}
export function nURBSVolume(p,q,r,U,V,W,points) {
  gridValid([p,q,r],[U,V,W],points);
  // Native getPoint maps [0,1] over the entire knot vector; require clamped ends.
  for(const [degree,knots] of [[p,U],[q,V],[r,W]]) {
    if(knots[0]!==knots[degree]||knots.at(-1)!==knots[knots.length-degree-1])throw new RangeError('Volume evaluation requires clamped endpoint knots');
  }
  const volume=new NURBSVolume(p,q,r,U.slice(),V.slice(),W.slice(),points);
  volume.getPoint=function(u,v,w,target) {
    if([u,v,w].some(t=>!Number.isFinite(t)||t<0||t>1))throw new RangeError('Volume parameter out of range [0,1]');
    gridValid([this.degree1,this.degree2,this.degree3],[this.knots1,this.knots2,this.knots3],this.controlPoints);
    return NURBSVolume.prototype.getPoint.call(this,u,v,w,target);
  };
  return volume;
}
export const nURBSVolumeChecked=checked(nURBSVolume);
export const nURBSUtils=()=>({
  findSpan(p,u,U) { spline(p,U,undefined,u);return NURBSUtils.findSpan(p,u,U); },
  calcBasisFunctions(span,u,p,U) { spanValid(span,u,p,U);return NURBSUtils.calcBasisFunctions(span,u,p,U); },
  calcBasisFunctionDerivatives(span,u,p,n,U) { spanValid(span,u,p,U);derivativeOrder(n,p);return NURBSUtils.calcBasisFunctionDerivatives(span,u,p,n,U); },
  calcBSplinePoint(p,U,P,u) { spline(p,U,P.length,u);pointsValid(P);return NURBSUtils.calcBSplinePoint(p,U,P,u); },
  calcBSplineDerivatives:bsplineDerivatives,
  calcNURBSDerivatives(p,U,P,u,n) { return NURBSUtils.calcRationalCurveDerivatives(bsplineDerivatives(p,U,P,u,n)); },
  calcKoverI(k,i) { if(!Number.isInteger(k)||!Number.isInteger(i)||i<0||k<i||k>170)throw new RangeError('Require 0 <= i <= k <= 170');return NURBSUtils.calcKoverI(k,i); },
  calcRationalCurveDerivatives(P) { if(!P.length||!Number.isFinite(P[0].w)||P[0].w===0||P.some(p=>!finitePoint(p)||!Number.isFinite(p.w)))throw new RangeError('Finite derivatives and nonzero base weight required');return NURBSUtils.calcRationalCurveDerivatives(P); },
  calcSurfacePoint(p,q,U,V,P,u,v,target) {
    gridValid([p,q],[U,V],P);spline(p,U,undefined,u);spline(q,V,undefined,v);
    NURBSUtils.calcSurfacePoint(p,q,U,V,P,u,v,target);return target;
  },
  calcVolumePoint(p,q,r,U,V,W,P,u,v,w,target) {
    gridValid([p,q,r],[U,V,W],P);spline(p,U,undefined,u);spline(q,V,undefined,v);spline(r,W,undefined,w);
    NURBSUtils.calcVolumePoint(p,q,r,U,V,W,P,u,v,w,target);return target;
  },
});
export const improvedNoise=()=>new ImprovedNoise();
export const simplexNoise=()=>new SimplexNoise();
export const simplexNoiseRandom=random=>new SimplexNoise({random:()=>{
  const value=random();if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError('Random callback must return a value in [0,1)');
  return value;
}});
export const simplexNoiseSeeded=seed=>{
  let state=seed>>>0;
  return simplexNoiseRandom(()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;});
};
export const simplexNoiseRandomChecked=checked(simplexNoiseRandom);
