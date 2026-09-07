import {booleanGeometry,booleanMesh} from './csg-geometry.js';

class CSG {
  #wasm;
  #initializing;
  #weldTolerance=1e-6;
  async #initialize(options) {
    if(this.#wasm)return;
    if(this.#initializing)return this.#initializing;
    this.#initializing=(async()=>{
      const config=await options();
      const {default:Module}=await import('manifold-3d');
      const wasm=await Module({...config,printErr:()=>{}});
      wasm.setup();this.#wasm=wasm;
    })();
    try {await this.#initializing;}finally{this.#initializing=undefined;}
  }
  initialize(){return this.#initialize(async()=>({}));}
  initializeFromBytes(bytes){const copy=Uint8Array.from(bytes);return this.#initialize(async()=>({wasmBinary:copy}));}
  initializeFromUrl(url){return this.#initialize(async()=>{
    const response=await fetch(url);
    if(!response.ok)throw new Error('CSG WASM load failed: HTTP '+response.status);
    return {wasmBinary:new Uint8Array(await response.arrayBuffer())};
  });}
  ready(){return !!this.#wasm;}
  setWeldTolerance(value) {
    if(!Number.isFinite(value)||value<0)throw new RangeError('Nonnegative finite CSG weld tolerance required');
    this.#weldTolerance=value;
  }
  weldTolerance(){return this.#weldTolerance;}
  #engine(){if(!this.#wasm)throw new Error('Initialize CSG before running Boolean operations');return this.#wasm;}
  unionGeometry(a,b,offset){return booleanGeometry(this.#engine(),'add',a,b,offset,this.#weldTolerance);}
  subtractGeometry(a,b,offset){return booleanGeometry(this.#engine(),'subtract',a,b,offset,this.#weldTolerance);}
  intersectGeometry(a,b,offset){return booleanGeometry(this.#engine(),'intersect',a,b,offset,this.#weldTolerance);}
  unionMesh(a,b){return booleanMesh(this.#engine(),'add',a,b,this.#weldTolerance);}
  subtractMesh(a,b){return booleanMesh(this.#engine(),'subtract',a,b,this.#weldTolerance);}
  intersectMesh(a,b){return booleanMesh(this.#engine(),'intersect',a,b,this.#weldTolerance);}
}
export const cSG=()=>new CSG();
