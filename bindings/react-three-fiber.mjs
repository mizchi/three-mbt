// Public MoonBit types and signatures for @react-three/fiber 9.7 (React 19).
// React owns reconciliation, hooks, scheduling, and disposal. All mappings are immediate.
export const types = ['Node', 'Component', 'Props', 'CanvasProps', 'CameraProps', 'RootOptions',
  'Clock', 'RootState', 'RootStore', 'FiberRoot', 'Size', 'Viewport', 'ThreeEvent', 'XRFrame',
  'ObjectRef', 'ObjectMap', 'Subscription', 'Arg', 'Dependency', 'State[T]', 'Ref[T]', 'Loader[T]'];
export const imports = `import * as React from 'react';
import * as Fiber from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';`;
export const functions = [];
const fn = (name, args, returns, expression, options = {}) => functions.push({ name, args, returns, expression, ...options });
const method = (type, name, args, returns, expression, options) => fn(`${type}::${name}`, `self : ${type}${args ? ', ' + args : ''}`, returns, expression, options);
const setter = (type, name, arg, expression) => method(type, name, arg, 'Unit', `{ ${expression}; }`);
const get = (type, name, returns, expression = `self.${name}`) => method(type, name, '', returns, expression);
for (const type of ['Props', 'CanvasProps', 'CameraProps', 'RootOptions']) fn(`${type}::${type}`, '', type, '({})');
fn('empty', '', 'Node', 'null');
fn('text', 'value : String', 'Node', 'value');
fn('element', 'name : String, props : Props, children : FixedArray[Node]', 'Node', 'React.createElement(name, props, ...children)');
fn('canvas', 'props : CanvasProps, children : FixedArray[Node]', 'Node', 'React.createElement(Fiber.Canvas, props, ...children)');
fn('fragment', 'children : FixedArray[Node]', 'Node', 'React.createElement(React.Fragment, null, ...children)');
fn('suspense', 'fallback : Node, children : FixedArray[Node]', 'Node', 'React.createElement(React.Suspense, { fallback }, ...children)');
fn('component', 'render : () -> Node', 'Component', 'function MoonBitComponent() { return render(); }', { doc: 'Create once outside render to keep React component identity stable.' });
method('Component', 'element', '', 'Node', 'React.createElement(self)');
for (const name of ['group', 'mesh', 'scene', 'points', 'line', 'instancedMesh', 'skinnedMesh']) {
  fn(name.replace(/[A-Z]/g, c => '_' + c.toLowerCase()), 'props : Props, children : FixedArray[Node]', 'Node', `React.createElement('${name}', props, ...children)`);
}
for (const name of ['primitive', 'boxGeometry', 'sphereGeometry', 'planeGeometry', 'cylinderGeometry', 'coneGeometry', 'torusGeometry', 'icosahedronGeometry', 'bufferGeometry', 'bufferAttribute', 'meshStandardMaterial', 'meshBasicMaterial', 'meshPhysicalMaterial', 'meshNormalMaterial', 'ambientLight', 'directionalLight', 'pointLight', 'spotLight', 'hemisphereLight', 'perspectiveCamera', 'orthographicCamera', 'color']) {
  fn(name.replace(/[A-Z]/g, c => '_' + c.toLowerCase()), 'props : Props', 'Node', `React.createElement('${name}', props)`);
}
for (const [name, type] of [['number','Double'], ['int','Int'], ['string','String'], ['bool','Bool'], ['vector3','@three.Vector3'], ['color','@three.Color'], ['geometry','@three.BufferGeometry'], ['material','@three.Material'], ['numbers','FixedArray[Double]'], ['ints','FixedArray[Int]']]) {
  fn(`Arg::${name}`, `value : ${type}`, 'Arg', 'value');
}
fn('Dependency::of', 'value : T', 'Dependency', 'value', { generics: 'T', doc: 'React compares dependencies with Object.is; pass stable identities when needed.' });
for (const [name, type, prop] of [
  ['key','String','key'], ['name','String','name'], ['attach','String','attach'],
  ['args','FixedArray[Arg]','args'], ['object','@three.Object3D','object'],
  ['geometry','@three.BufferGeometry','geometry'], ['material','@three.Material','material'],
  ['position','@three.Vector3','position'], ['rotation','@three.Euler','rotation'],
  ['quaternion','@three.Quaternion','quaternion'], ['scale','@three.Vector3','scale'],
  ['uniform_scale','Double','scale'], ['color','Int','color'], ['color_css','String','color'],
  ['roughness','Double','roughness'], ['metalness','Double','metalness'], ['opacity','Double','opacity'],
  ['intensity','Double','intensity'], ['visible','Bool','visible'], ['wireframe','Bool','wireframe'],
  ['transparent','Bool','transparent'], ['flat_shading','Bool','flatShading'],
  ['cast_shadow','Bool','castShadow'], ['receive_shadow','Bool','receiveShadow'], ['ref','ObjectRef','ref'],
]) setter('Props', `set_${name}`, `value : ${type}`, `self.${prop} = value`);
for (const name of ['position', 'rotation', 'scale']) setter('Props', `set_${name}_xyz`, 'x : Double, y : Double, z : Double', `self.${name} = [x, y, z]`);
for (const [name, type] of [['number','Double'], ['string','String'], ['bool','Bool']]) setter('Props', `set_${name}`, `name : String, value : ${type}`, 'self[name] = value');
setter('Props', 'set_dispose_automatic', 'enabled : Bool', 'if (enabled) { delete self.dispose; } else { self.dispose = null; }');
for (const name of ['click','doubleClick','contextMenu','pointerDown','pointerUp','pointerOver','pointerOut','pointerEnter','pointerLeave','pointerMove','pointerCancel','lostPointerCapture','wheel']) {
  setter('Props', 'on_' + name.replace(/[A-Z]/g, c => '_' + c.toLowerCase()), 'callback : (ThreeEvent) -> Unit', `self.on${name[0].toUpperCase() + name.slice(1)} = callback`);
}
setter('Props', 'on_update', 'callback : (@three.Object3D) -> Unit', 'self.onUpdate = callback');
for (const type of ['CanvasProps', 'RootOptions']) {
  for (const [name, t, prop] of [['shadows','Bool','shadows'], ['linear','Bool','linear'], ['flat','Bool','flat'], ['legacy','Bool','legacy'], ['orthographic','Bool','orthographic'], ['dpr','Double','dpr'], ['camera','@three.Camera','camera'], ['camera_options','CameraProps','camera'], ['renderer','@three.WebGLRenderer','gl']]) setter(type, `set_${name}`, `value : ${t}`, `self.${prop} = value`);
  setter(type, 'set_dpr_range', 'min : Double, max : Double', 'self.dpr = [min, max]');
  setter(type, 'ffi_set_frameloop', 'value : String', 'self.frameloop = value');
  functions.at(-1).private = true;
  setter(type, 'on_created', 'callback : (RootState) -> Unit', 'self.onCreated = callback');
}
setter('CanvasProps', 'set_style_size', 'width : String, height : String', 'self.style = { ...self.style, width, height }');
setter('CanvasProps', 'set_class_name', 'value : String', 'self.className = value');
setter('CanvasProps', 'set_fallback', 'value : Node', 'self.fallback = value');
setter('RootOptions', 'set_size', 'width : Double, height : Double, top : Double, left : Double', 'self.size = { width, height, top, left }');
setter('RootOptions', 'set_pointer_events', '', 'self.events = Fiber.events');
setter('CameraProps', 'set_position_xyz', 'x : Double, y : Double, z : Double', 'self.position = [x, y, z]');
for (const name of ['fov','near','far','zoom','left','right','top','bottom']) setter('CameraProps', `set_${name}`, 'value : Double', `self.${name} = value`);
fn('use_three', '', 'RootState', 'Fiber.useThree()');
fn('use_three_select', 'selector : (RootState) -> T', 'T', 'Fiber.useThree(selector)', { generics: 'T' });
fn('use_store', '', 'RootStore', 'Fiber.useStore()');
fn('ffi_use_frame', 'callback : (RootState, Double) -> Unit, priority : Double', 'Unit', '{ Fiber.useFrame(callback, priority); }', { private: true });
fn('ffi_use_frame_xr', 'callback : (RootState, Double, Nullable[XRFrame]) -> Unit, priority : Double', 'Unit', '{ Fiber.useFrame(callback, priority); }', { private: true });
fn('use_state', 'initial : T', 'State[T]', 'React.useState(() => initial)', { generics: 'T' });
fn('State::value', 'self : State[T]', 'T', 'self[0]', { generics: 'T' });
fn('State::set', 'self : State[T], value : T', 'Unit', '{ self[1](() => value); }', { generics: 'T' });
fn('State::update', 'self : State[T], update : (T) -> T', 'Unit', '{ self[1](update); }', { generics: 'T' });
fn('use_ref', 'initial : T', 'Ref[T]', 'React.useRef(initial)', { generics: 'T' });
fn('Ref::current', 'self : Ref[T]', 'T', 'self.current', { generics: 'T' });
fn('Ref::set', 'self : Ref[T], value : T', 'Unit', '{ self.current = value; }', { generics: 'T' });
fn('use_object_ref', '', 'ObjectRef', 'React.useRef(null)');
method('ObjectRef', 'ffi_current', '', 'Nullable[@three.Object3D]', 'self.current', { private: true });
fn('use_effect', 'effect : () -> (() -> Unit), dependencies : FixedArray[Dependency]', 'Unit', '{ React.useEffect(effect, dependencies); }');
fn('use_memo', 'create : () -> T, dependencies : FixedArray[Dependency]', 'T', 'React.useMemo(create, dependencies)', { generics: 'T' });
fn('use_graph', 'object : @three.Object3D', 'ObjectMap', 'Fiber.useGraph(object)');
method('ObjectMap', 'ffi_node', 'name : String', 'Nullable[@three.Object3D]', 'self.nodes[name]', { private: true });
method('ObjectMap', 'ffi_material', 'name : String', 'Nullable[@three.Material]', 'self.materials[name]', { private: true });
fn('Loader::gltf', '', 'Loader[@three.GLTF]', 'GLTFLoader');
fn('Loader::texture', '', 'Loader[@three.Texture]', 'THREE.TextureLoader');
fn('Loader::from_gltf', 'loader : @three.GLTFLoader', 'Loader[@three.GLTF]', 'loader');
fn('use_loader', 'loader : Loader[T], url : String', 'T', 'Fiber.useLoader(loader, url)', { generics: 'T' });
fn('use_loaders', 'loader : Loader[T], urls : FixedArray[String]', 'FixedArray[T]', 'Fiber.useLoader(loader, urls)', { generics: 'T' });
fn('Loader::preload', 'self : Loader[T], url : String', 'Unit', '{ Fiber.useLoader.preload(self, url); }', { generics: 'T' });
fn('Loader::clear', 'self : Loader[T], url : String', 'Unit', '{ Fiber.useLoader.clear(self, url); }', { generics: 'T' });
for (const [name, type] of [['gl','@three.WebGLRenderer'],['scene','@three.Scene'],['camera','@three.Camera'],['raycaster','@three.Raycaster'],['clock','Clock'],['pointer','@three.Vector2'],['size','Size'],['viewport','Viewport']]) get('RootState',name,type);
method('RootState','invalidate','frames : Int','Unit','{ self.invalidate(frames); }');
method('RootState','advance','timestamp : Double, run_global_effects : Bool','Unit','{ self.advance(timestamp, run_global_effects); }');
method('RootState','set_dpr','value : Double','Unit','{ self.setDpr(value); }');
method('RootState','set_size','width : Double, height : Double','Unit','{ self.setSize(width, height); }');
method('RootState','set_camera','camera : @three.Camera','Unit','{ self.set({ camera }); }');
method('RootState','ffi_set_frameloop','value : String','Unit','{ self.setFrameloop(value); }',{private:true});
get('RootState','get','RootState','self.get()');
get('RootStore','get_state','RootState','self.getState()');
method('RootStore','subscribe','callback : (RootState, RootState) -> Unit','Subscription','self.subscribe(callback)');
for (const name of ['width','height','top','left']) { get('Size',name,'Double'); get('Viewport',name,'Double'); }
for (const name of ['dpr','factor','distance','aspect']) get('Viewport',name,'Double');
for (const [name,type,prop] of [['object','@three.Object3D','object'],['event_object','@three.Object3D','eventObject'],['point','@three.Vector3','point'],['pointer','@three.Vector2','pointer'],['ray','@three.Ray','ray'],['camera','@three.Camera','camera'],['distance','Double','distance'],['delta','Double','delta'],['stopped','Bool','stopped']]) get('ThreeEvent',name,type,`self.${prop}`);
method('ThreeEvent','stop_propagation','','Unit','{ self.stopPropagation(); }');
fn('register_three', '', 'Unit', '{ Fiber.extend(THREE); }');
fn('create_root', 'canvas : @three.Canvas', 'FiberRoot', 'Fiber.createRoot(canvas)');
method('FiberRoot','configure','options : RootOptions','@js_async.Promise[Unit]','self.configure(options).then(() => undefined)');
method('FiberRoot','render','node : Node','RootStore','self.render(node)');
method('FiberRoot','unmount','','Unit','{ self.unmount(); }');
fn('create_portal','children : Node, container : @three.Object3D','Node','Fiber.createPortal(children, container)');
for (const [name, native] of [['add_effect','addEffect'], ['add_after_effect','addAfterEffect'], ['add_tail','addTail']]) fn(name,'callback : (Double) -> Unit','Subscription',`Fiber.${native}(callback)`);
method('Subscription','unsubscribe','','Unit','{ self(); }');

get('Clock','elapsed_time','Double','self.elapsedTime');
