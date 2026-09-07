# Type definition audit

three.js 0.185.1; @types/three 0.185.4.

Runtime-exported WebGL core classes, existing core facades, currently imported addon classes and existing addon facades; excludes audio/XR, private/protected members and names with an underscore prefix or suffix. Includes merged local property interfaces. Inherited methods are counted on their declaring class; inherited constructors are reported on concrete subclasses with their original source location.

Mapped means at least one typed facade/overload exists, not full signature compatibility or both getter and setter coverage. Partial means an indirect reference was detected. Unavailable means a math method declared in the types is absent from the pinned runtime. Namespace counts are separate. Other functions, constants, interfaces and structural option objects are inventoried in otherExports, outside class-member counts.

Classes with bindings: 265/290. Member names: 2160 mapped, 32 partial, 889 missing, 7 unavailable.

Run `just audit-api` to regenerate; `just check` rejects stale reports. Signatures, source locations, excluded classes and other exported contracts: [type-audit.json](type-audit.json).

## Known type/runtime differences

- `NURBSUtils.calcBSplineDerivatives / calcNURBSDerivatives`: types declare derivative arrays; runtime: r185 appends an extra entry and sets homogeneous zero-derivative weights to 1. MoonBit: returns orders 0..n and corrects higher homogeneous derivatives to zero before rational conversion.
- `NURBSUtils.calcSurfacePoint / calcVolumePoint`: types declare Vector3 return; runtime: void; writes to target. MoonBit: validated facade returns the supplied Vector3 target.
- `FBXLoader.parse`: types declare ArrayBuffer | string; runtime: ArrayBuffer. MoonBit: parse_ascii encodes text as UTF-8 before parsing.
- `SkeletonUtils.retargetClip target`: types declare Object3D | Skeleton; runtime: requires target.skeleton. MoonBit: SkinnedMesh target; source can be SkinnedMesh or Skeleton.
- `RetargetOptions`: types declare preserveHipPosition; runtime: preserveBonePositions. MoonBit: preserve_bone_positions controls the actual runtime flag.
- `SceneUtils.createMeshesFromMultiMaterialMesh`: types declare Group; runtime: returns the input Mesh for a single material; mutates geometry while merging groups. MoonBit: always returns a new Group and preserves input geometry.
- `Ray.distanceToPlane`: types declare number; runtime: number | null. MoonBit: Double?.
- `KeyframeTrack.values`: types declare Float32Array; runtime: String and Boolean tracks also inherit KeyframeTrack. MoonBit: number_values returns an Option; concrete string/boolean tracks expose typed values.
- `BufferGeometryUtils.interleaveAttributes`: types declare InterleavedBufferAttribute; runtime: InterleavedBufferAttribute[] | null. MoonBit: FixedArray[InterleavedBufferAttribute]?.
- `BufferGeometryUtils.deinterleaveAttribute`: types declare (BufferGeometry) => void; runtime: (InterleavedBufferAttribute) => BufferAttribute. MoonBit: (InterleavedBufferAttribute) -> PackedBufferAttribute.
- `BufferGeometryUtils.mergeAttributes / mergeGeometries`: types declare non-null result; runtime: null for incompatible inputs. MoonBit: optional result; empty input also returns None.
- `SVGResult.xml`: types declare XMLDocument; runtime: SVG root element. MoonBit: xml_string serializes the element; DOM internals are not exposed.
- `SelectionHelper pointer handlers and points`: types declare public methods and properties; runtime: underscore-prefixed private members. MoonBit: uses native event listeners; only public state and dispose are bound.
- `TransformControls.minx`: types declare minx; runtime: minX. MoonBit: min_x / set_min_x.
- `Flow.curveArray`: types declare number[]; runtime: Curve[] with empty slots before updateCurve. MoonBit: curve(index) returns Curve3?.
- `MeshSurfaceSampler.sampleFace / binarySearch`: types declare public methods; runtime: underscore-prefixed private methods. MoonBit: public sample / sample_full only.
- `MeshSurfaceSampler.setRandomGenerator`: types declare absent; runtime: public callback setter. MoonBit: set_random_generator(() -> Double).
- `Octree.getRayTriangles`: types declare Triangle[]; runtime: void; appends to the supplied array. MoonBit: ray_triangles returns the filled array.
- `BatchedMesh.getGeometryRangeAt / getBoundingBoxAt / getBoundingSphereAt`: types declare nullable results for invalid geometry IDs; runtime: range lookup throws on invalid/deleted IDs; bounds can retain deleted geometry. MoonBit: validate through range lookup and return None for invalid/deleted IDs.

## Class coverage

| Class | Mapped | Partial | Missing | Unavailable |
| --- | ---: | ---: | ---: | ---: |
| AmbientLight | 1 | 0 | 1 | 0 |
| AnimationAction | 35 | 0 | 1 | 0 |
| AnimationClip | 13 | 0 | 5 | 0 |
| AnimationLoader | 2 | 0 | 0 | 0 |
| AnimationMixer | 13 | 0 | 0 | 0 |
| AnimationObjectGroup | 5 | 0 | 1 | 0 |
| AnimationUtils | 2 | 0 | 5 | 0 |
| ArcCurve | 1 | 0 | 2 | 0 |
| ArrayCamera | 4 | 0 | 0 | 0 |
| ArrowHelper | 5 | 0 | 3 | 0 |
| AxesHelper | 2 | 0 | 1 | 0 |
| BatchedMesh | 31 | 0 | 3 | 0 |
| BezierInterpolant | 1 | 0 | 0 | 0 |
| BokehPass | 2 | 0 | 8 | 0 |
| Bone | 1 | 0 | 2 | 0 |
| BooleanKeyframeTrack | 1 | 0 | 0 | 0 |
| Box2 | 25 | 0 | 0 | 2 |
| Box3 | 35 | 0 | 2 | 0 |
| Box3Helper | 2 | 0 | 1 | 0 |
| BoxGeometry | 2 | 0 | 2 | 0 |
| BoxHelper | 2 | 0 | 4 | 0 |
| BufferAttribute | 40 | 1 | 1 | 0 |
| BufferGeometry | 39 | 3 | 6 | 0 |
| BufferGeometryLoader | 2 | 0 | 0 | 0 |
| BVHLoader | 4 | 0 | 0 | 0 |
| Camera | 8 | 0 | 2 | 0 |
| CameraHelper | 2 | 0 | 4 | 0 |
| CanvasTexture | 1 | 0 | 1 | 0 |
| Capsule | 10 | 0 | 1 | 0 |
| CapsuleGeometry | 2 | 0 | 2 | 0 |
| CatmullRomCurve3 | 4 | 0 | 3 | 0 |
| CCDIKHelper | 1 | 0 | 8 | 0 |
| CCDIKSolver | 5 | 0 | 1 | 0 |
| CircleGeometry | 2 | 0 | 2 | 0 |
| Clock | 0 | 0 | 10 | 0 |
| ColladaLoader | 2 | 0 | 0 | 0 |
| Color | 39 | 0 | 3 | 0 |
| ColorKeyframeTrack | 1 | 0 | 0 | 0 |
| CompressedArrayTexture | 0 | 0 | 6 | 0 |
| CompressedCubeTexture | 0 | 0 | 3 | 0 |
| CompressedTexture | 0 | 0 | 6 | 0 |
| CompressedTextureLoader | 0 | 0 | 2 | 0 |
| ConeGeometry | 2 | 0 | 2 | 0 |
| Controls | 0 | 0 | 8 | 0 |
| ConvexGeometry | 1 | 0 | 0 | 0 |
| ConvexHull | 9 | 0 | 19 | 0 |
| CubeCamera | 2 | 0 | 4 | 0 |
| CubeDepthTexture | 0 | 0 | 4 | 0 |
| CubeTexture | 1 | 0 | 4 | 0 |
| CubeTextureLoader | 1 | 0 | 1 | 0 |
| CubicBezierCurve | 5 | 0 | 2 | 0 |
| CubicBezierCurve3 | 5 | 0 | 2 | 0 |
| CubicInterpolant | 1 | 0 | 0 | 0 |
| Curve | 16 | 0 | 1 | 0 |
| CurvePath | 9 | 0 | 3 | 0 |
| CylinderGeometry | 2 | 0 | 2 | 0 |
| Cylindrical | 9 | 0 | 0 | 0 |
| Data3DTexture | 2 | 0 | 6 | 0 |
| DataArrayTexture | 5 | 0 | 6 | 0 |
| DataTexture | 1 | 0 | 6 | 0 |
| DataTextureLoader | 0 | 0 | 4 | 0 |
| DataUtils | 2 | 0 | 0 | 0 |
| DecalGeometry | 1 | 0 | 0 | 0 |
| DepthTexture | 1 | 0 | 8 | 0 |
| DirectionalLight | 4 | 0 | 2 | 0 |
| DirectionalLightHelper | 3 | 0 | 4 | 0 |
| DiscreteInterpolant | 1 | 0 | 0 | 0 |
| DodecahedronGeometry | 1 | 0 | 2 | 0 |
| DRACOExporter | 2 | 0 | 0 | 0 |
| DRACOLoader | 5 | 0 | 3 | 0 |
| EdgesGeometry | 1 | 0 | 2 | 0 |
| EdgeSplitModifier | 2 | 0 | 0 | 0 |
| EffectComposer | 12 | 0 | 8 | 0 |
| EllipseCurve | 9 | 0 | 2 | 0 |
| Euler | 13 | 0 | 5 | 0 |
| EventDispatcher | 0 | 0 | 5 | 0 |
| EXRExporter | 1 | 0 | 0 | 0 |
| EXRLoader | 2 | 0 | 6 | 0 |
| ExternalTexture | 0 | 0 | 3 | 0 |
| ExtrudeGeometry | 3 | 0 | 1 | 0 |
| Face | 5 | 0 | 6 | 0 |
| FBXLoader | 2 | 0 | 0 | 0 |
| FileLoader | 5 | 0 | 1 | 0 |
| Float16BufferAttribute | 1 | 0 | 0 | 0 |
| Float32BufferAttribute | 1 | 0 | 0 | 0 |
| Flow | 6 | 2 | 0 | 0 |
| Flow | 6 | 2 | 0 | 0 |
| Fog | 5 | 0 | 3 | 0 |
| FogExp2 | 4 | 0 | 3 | 0 |
| Font | 1 | 1 | 3 | 0 |
| FontLoader | 2 | 0 | 1 | 0 |
| FramebufferTexture | 1 | 0 | 4 | 0 |
| Frustum | 11 | 0 | 0 | 0 |
| FrustumArray | 0 | 0 | 9 | 0 |
| GLBufferAttribute | 0 | 0 | 15 | 0 |
| GLTFExporter | 4 | 0 | 3 | 0 |
| GLTFLoader | 8 | 0 | 3 | 0 |
| GLTFParser | 1 | 1 | 29 | 0 |
| GLTFWriter | 1 | 2 | 6 | 0 |
| GridHelper | 2 | 0 | 0 | 0 |
| Group | 1 | 0 | 1 | 0 |
| GTAOPass | 8 | 0 | 28 | 0 |
| HDRLoader | 2 | 0 | 2 | 0 |
| HemisphereLight | 2 | 0 | 3 | 0 |
| HemisphereLightHelper | 3 | 0 | 3 | 0 |
| HTMLTexture | 0 | 0 | 2 | 0 |
| IcosahedronGeometry | 1 | 0 | 2 | 0 |
| ImageBitmapLoader | 0 | 0 | 5 | 0 |
| ImageLoader | 0 | 0 | 2 | 0 |
| ImageUtils | 0 | 0 | 2 | 0 |
| ImprovedNoise | 2 | 0 | 0 | 0 |
| InstancedBufferAttribute | 2 | 0 | 1 | 0 |
| InstancedBufferGeometry | 2 | 0 | 3 | 0 |
| InstancedFlow | 4 | 1 | 1 | 0 |
| InstancedInterleavedBuffer | 2 | 0 | 0 | 0 |
| InstancedMesh | 11 | 2 | 6 | 0 |
| Int16BufferAttribute | 1 | 0 | 0 | 0 |
| Int32BufferAttribute | 1 | 0 | 0 | 0 |
| Int8BufferAttribute | 1 | 0 | 0 | 0 |
| InterleavedBuffer | 17 | 0 | 3 | 0 |
| InterleavedBufferAttribute | 25 | 0 | 3 | 0 |
| Interpolant | 5 | 0 | 2 | 0 |
| KeyframeTrack | 15 | 0 | 7 | 0 |
| KTX2Exporter | 1 | 0 | 0 | 0 |
| KTX2Loader | 4 | 0 | 10 | 0 |
| LatheGeometry | 2 | 0 | 2 | 0 |
| Layers | 9 | 1 | 0 | 0 |
| Light | 4 | 0 | 3 | 0 |
| LightProbe | 3 | 0 | 2 | 0 |
| LightShadow | 19 | 0 | 5 | 0 |
| Line | 3 | 0 | 6 | 0 |
| Line2 | 1 | 0 | 3 | 0 |
| Line2 | 1 | 0 | 3 | 0 |
| Line3 | 16 | 0 | 0 | 0 |
| LinearInterpolant | 1 | 0 | 0 | 0 |
| LineBasicMaterial | 5 | 0 | 4 | 0 |
| LineCurve | 3 | 0 | 2 | 0 |
| LineCurve3 | 3 | 0 | 2 | 0 |
| LineDashedMaterial | 4 | 0 | 2 | 0 |
| LineGeometry | 1 | 0 | 2 | 0 |
| LineLoop | 1 | 0 | 2 | 0 |
| LineMaterial | 9 | 0 | 1 | 0 |
| LineSegments | 1 | 0 | 2 | 0 |
| Loader | 11 | 0 | 5 | 0 |
| LoaderUtils | 0 | 0 | 2 | 0 |
| LoadingManager | 13 | 0 | 2 | 0 |
| LOD | 8 | 0 | 3 | 0 |
| LoftGeometry | 1 | 1 | 0 | 0 |
| MapControls | 1 | 0 | 0 | 0 |
| Material | 55 | 0 | 5 | 0 |
| MaterialCreator | 5 | 0 | 14 | 0 |
| MaterialLoader | 5 | 0 | 2 | 0 |
| Matrix2 | 6 | 0 | 0 | 0 |
| Matrix3 | 27 | 0 | 1 | 0 |
| Matrix4 | 39 | 0 | 0 | 0 |
| Mesh | 6 | 1 | 4 | 0 |
| MeshBasicMaterial | 17 | 0 | 4 | 0 |
| MeshDepthMaterial | 9 | 0 | 2 | 0 |
| MeshDistanceMaterial | 6 | 0 | 2 | 0 |
| MeshLambertMaterial | 30 | 0 | 4 | 0 |
| MeshMatcapMaterial | 17 | 0 | 2 | 0 |
| MeshNormalMaterial | 12 | 0 | 2 | 0 |
| MeshPhongMaterial | 32 | 0 | 4 | 0 |
| MeshPhysicalMaterial | 33 | 0 | 2 | 0 |
| MeshStandardMaterial | 30 | 0 | 4 | 0 |
| MeshSurfaceSampler | 5 | 1 | 4 | 0 |
| MeshToonMaterial | 23 | 0 | 4 | 0 |
| MTLLoader | 3 | 0 | 1 | 0 |
| NumberKeyframeTrack | 1 | 0 | 0 | 0 |
| NURBSCurve | 8 | 0 | 0 | 0 |
| NURBSSurface | 2 | 0 | 0 | 0 |
| NURBSVolume | 9 | 0 | 0 | 0 |
| OBB | 19 | 0 | 0 | 0 |
| Object3D | 75 | 0 | 5 | 0 |
| ObjectLoader | 2 | 0 | 9 | 0 |
| OBJExporter | 2 | 0 | 0 | 0 |
| OBJLoader | 3 | 0 | 1 | 0 |
| OctahedronGeometry | 1 | 0 | 2 | 0 |
| Octree | 23 | 0 | 2 | 0 |
| OrbitControls | 44 | 0 | 3 | 0 |
| OrthographicCamera | 13 | 0 | 2 | 0 |
| OutlinePass | 8 | 0 | 36 | 0 |
| OutputPass | 1 | 0 | 3 | 0 |
| ParametricGeometry | 2 | 0 | 1 | 0 |
| Pass | 6 | 0 | 3 | 0 |
| Path | 14 | 0 | 1 | 0 |
| PerspectiveCamera | 21 | 0 | 2 | 0 |
| Plane | 22 | 0 | 1 | 1 |
| PlaneGeometry | 2 | 0 | 2 | 0 |
| PlaneHelper | 2 | 0 | 2 | 0 |
| PLYExporter | 2 | 0 | 0 | 0 |
| PLYLoader | 4 | 0 | 2 | 0 |
| PMREMGenerator | 7 | 0 | 0 | 0 |
| PMREMGenerator | 7 | 0 | 3 | 0 |
| PointerLockControls | 10 | 0 | 0 | 0 |
| PointLight | 6 | 0 | 2 | 0 |
| PointLightHelper | 3 | 0 | 2 | 0 |
| Points | 3 | 0 | 5 | 0 |
| PointsMaterial | 7 | 0 | 2 | 0 |
| PolarGridHelper | 0 | 0 | 2 | 0 |
| PolyhedronGeometry | 1 | 0 | 3 | 0 |
| PropertyBinding | 0 | 0 | 11 | 0 |
| PropertyMixer | 0 | 0 | 13 | 0 |
| QuadraticBezierCurve | 4 | 0 | 2 | 0 |
| QuadraticBezierCurve3 | 4 | 0 | 2 | 0 |
| Quaternion | 34 | 0 | 2 | 0 |
| QuaternionKeyframeTrack | 1 | 0 | 0 | 0 |
| QuaternionLinearInterpolant | 1 | 0 | 0 | 0 |
| RawShaderMaterial | 1 | 0 | 1 | 0 |
| Ray | 23 | 0 | 0 | 3 |
| Raycaster | 10 | 1 | 1 | 0 |
| RectAreaLight | 3 | 0 | 3 | 0 |
| RectAreaLightUniformsLib | 0 | 0 | 1 | 0 |
| RenderPass | 2 | 0 | 8 | 0 |
| RenderTarget | 0 | 0 | 22 | 0 |
| RenderTarget3D | 0 | 0 | 2 | 0 |
| Rhino3dmLoader | 5 | 0 | 0 | 0 |
| RingGeometry | 2 | 0 | 2 | 0 |
| RoundedBoxGeometry | 1 | 0 | 0 | 0 |
| Scene | 9 | 0 | 4 | 0 |
| SelectionBox | 8 | 2 | 0 | 0 |
| SelectionHelper | 6 | 0 | 6 | 0 |
| ShaderMaterial | 14 | 1 | 6 | 0 |
| ShaderPass | 4 | 0 | 1 | 0 |
| ShadowMaterial | 3 | 0 | 2 | 0 |
| Shape | 7 | 0 | 1 | 0 |
| ShapeGeometry | 2 | 0 | 2 | 0 |
| ShapePath | 10 | 0 | 1 | 0 |
| ShapeUtils | 3 | 0 | 0 | 0 |
| SimplexNoise | 4 | 0 | 3 | 0 |
| SimplifyModifier | 2 | 0 | 0 | 0 |
| Skeleton | 16 | 0 | 1 | 0 |
| SkeletonHelper | 3 | 0 | 3 | 0 |
| SkinnedMesh | 12 | 0 | 4 | 0 |
| SMAAPass | 1 | 0 | 13 | 0 |
| Source | 6 | 1 | 3 | 0 |
| Sphere | 22 | 0 | 2 | 1 |
| SphereGeometry | 2 | 0 | 2 | 0 |
| Spherical | 10 | 0 | 0 | 0 |
| SphericalHarmonics3 | 16 | 0 | 1 | 0 |
| SplineCurve | 2 | 0 | 2 | 0 |
| SpotLight | 10 | 0 | 2 | 0 |
| SpotLightHelper | 3 | 0 | 3 | 0 |
| Sprite | 2 | 0 | 6 | 0 |
| SpriteMaterial | 7 | 0 | 2 | 0 |
| StereoCamera | 6 | 0 | 0 | 0 |
| STLExporter | 2 | 0 | 0 | 0 |
| STLLoader | 2 | 0 | 0 | 0 |
| StringKeyframeTrack | 1 | 0 | 0 | 0 |
| SVGLoader | 7 | 0 | 3 | 0 |
| TessellateModifier | 4 | 0 | 0 | 0 |
| TetrahedronGeometry | 1 | 0 | 2 | 0 |
| TextGeometry | 2 | 0 | 0 | 0 |
| Texture | 34 | 1 | 20 | 0 |
| TextureLoader | 1 | 0 | 1 | 0 |
| ThreeMFLoader | 2 | 0 | 2 | 0 |
| Timer | 8 | 0 | 2 | 0 |
| TorusGeometry | 2 | 0 | 2 | 0 |
| TorusKnotGeometry | 2 | 0 | 2 | 0 |
| TransformControls | 28 | 2 | 12 | 0 |
| Triangle | 25 | 0 | 1 | 0 |
| TubeGeometry | 5 | 0 | 2 | 0 |
| Uint16BufferAttribute | 1 | 0 | 0 | 0 |
| Uint32BufferAttribute | 1 | 0 | 0 | 0 |
| Uint8BufferAttribute | 1 | 0 | 0 | 0 |
| Uint8ClampedBufferAttribute | 1 | 0 | 0 | 0 |
| Uniform | 1 | 0 | 3 | 0 |
| Uniform | 3 | 0 | 0 | 0 |
| UniformsGroup | 9 | 1 | 2 | 0 |
| UnrealBloomPass | 4 | 0 | 14 | 0 |
| USDLoader | 2 | 0 | 0 | 0 |
| USDZExporter | 2 | 0 | 3 | 0 |
| Vector2 | 56 | 0 | 1 | 0 |
| Vector3 | 78 | 0 | 1 | 0 |
| Vector4 | 55 | 0 | 1 | 0 |
| VectorKeyframeTrack | 1 | 0 | 0 | 0 |
| VertexNormalsHelper | 5 | 0 | 1 | 0 |
| VertexTangentsHelper | 5 | 0 | 0 | 0 |
| VideoFrameTexture | 0 | 0 | 2 | 0 |
| VideoTexture | 2 | 0 | 5 | 0 |
| WebGL3DRenderTarget | 2 | 0 | 2 | 0 |
| WebGLArrayRenderTarget | 2 | 0 | 2 | 0 |
| WebGLCapabilities | 7 | 0 | 12 | 0 |
| WebGLCapabilities | 1 | 0 | 5 | 0 |
| WebGLCubeRenderTarget | 3 | 0 | 2 | 0 |
| WebGLInfo | 2 | 3 | 2 | 0 |
| WebGLRenderer | 40 | 1 | 28 | 0 |
| WebGLRenderTarget | 1 | 0 | 1 | 0 |
| WebGLUtils | 0 | 0 | 2 | 0 |
| WireframeGeometry | 1 | 0 | 2 | 0 |

## Namespace coverage

### MathUtils

19/24 exported member names mapped.

Remaining: `DEG2RAD`, `RAD2DEG`, `setQuaternionFromProperEuler`, `denormalize`, `normalize`

### BufferGeometryUtils

13/13 exported member names mapped.

Remaining: none

### SceneUtils

4/10 exported member names mapped.

Remaining: `detach`, `attach`, `reduceVertices`, `traverseGenerator`, `traverseVisibleGenerator`, `traverseAncestorsGenerator`

### SkeletonUtils

0/0 exported member names mapped.

Remaining: none

### WebGLTextureUtils

1/1 exported member names mapped.

Remaining: none

### NURBSUtils

10/10 exported member names mapped.

Remaining: none

## Remaining class members

### AmbientLight

`isAmbientLight`

### AnimationAction

`constructor`

### AnimationClip

`static parse`, `static toJSON`, `static CreateFromMorphTargetSequence`, `static findByName`, `static CreateClipsFromMorphTargetSequences`

### AnimationObjectGroup

`isAnimationObjectGroup`

### AnimationUtils

`static convertArray`, `static isTypedArray`, `static getKeyframeOrder`, `static sortedArray`, `static flattenJSON`

### ArcCurve

`isArcCurve`, `type`

### ArrowHelper

`line`, `cone`, `copy`

### AxesHelper

`setColors`

### BatchedMesh

`customSort`, `isBatchedMesh`, `setCustomSort`

### BokehPass

`scene`, `camera`, `renderTargetColor`, `renderTargetDepth`, `materialDepth`, `materialBokeh`, `fsQuad`, `oldClearColor`

### Bone

`isBone`, `type`

### Box2

`empty` (unavailable) (deprecated), `isIntersectionBox` (unavailable) (deprecated)

### Box3

`isBox3`, `fromJSON`

### Box3Helper

`box`

### BoxGeometry

`type`, `static fromJSON`

### BoxHelper

`object`, `update`, `setFromObject`, `copy`

### BufferAttribute

`isBufferAttribute` (partial), `onUploadCallback`

### BufferGeometry

`index`, `indirect`, `indirectOffset`, `attributes` (partial), `morphAttributes` (partial), `drawRange` (partial), `isBufferGeometry`, `setIndirect`, `getIndirect`

### Camera

`constructor`, `isCamera`

### CameraHelper

`camera`, `pointMap`, `setColors`, `update`

### CanvasTexture

`isCanvasTexture`

### Capsule

`checkAABBAxis`

### CapsuleGeometry

`type`, `static fromJSON`

### CatmullRomCurve3

`isCatmullRomCurve3`, `type`, `curveType`

### CCDIKHelper

`root`, `iks`, `sphereGeometry`, `targetSphereMaterial`, `effectorSphereMaterial`, `linkSphereMaterial`, `lineMaterial`, `constructor`

### CCDIKSolver

`iks`

### CircleGeometry

`type`, `static fromJSON`

### Clock

`constructor` (deprecated), `autoStart`, `startTime`, `oldTime`, `elapsedTime`, `running`, `start`, `stop`, `getElapsedTime`, `getDelta`

### Color

`isColor`, `[Symbol.iterator]`, `static NAMES`

### CompressedArrayTexture

`isCompressedArrayTexture`, `wrapR`, `layerUpdates`, `constructor`, `addLayerUpdate`, `clearLayerUpdates`

### CompressedCubeTexture

`isCompressedCubeTexture`, `isCubeTexture`, `constructor`

### CompressedTexture

`constructor`, `isCompressedTexture`, `mipmaps`, `format`, `flipY`, `generateMipmaps`

### CompressedTextureLoader

`constructor`, `load`

### ConeGeometry

`type`, `static fromJSON`

### Controls

`object`, `domElement`, `enabled`, `constructor`, `connect`, `disconnect`, `dispose`, `update`

### ConvexHull

`newFaces`, `assigned`, `unassigned`, `vertices`, `addAdjoiningFace`, `addNewFaces`, `addVertexToFace`, `addVertexToHull`, `cleanup`, `compute`, `computeExtremes`, `computeHorizon`, `computeInitialHull`, `deleteFaceVertices`, `nextVertexToAdd`, `reindexFaces`, `removeAllVerticesFromFace`, `removeVertexFromFace`, `resolveUnassignedPoints`

### CubeCamera

`renderTarget`, `coordinateSystem`, `activeMipmapLevel`, `updateCoordinateSystem`

### CubeDepthTexture

`isCubeDepthTexture`, `isCubeTexture`, `constructor`, `images`

### CubeTexture

`isCubeTexture`, `images`, `mapping`, `flipY`

### CubeTextureLoader

`load`

### CubicBezierCurve

`isCubicBezierCurve`, `type`

### CubicBezierCurve3

`isCubicBezierCurve3`, `type`

### Curve

`type`

### CurvePath

`type`, `getPoints`, `getSpacedPoints`

### CylinderGeometry

`type`, `static fromJSON`

### Data3DTexture

`isData3DTexture`, `magFilter`, `minFilter`, `flipY`, `generateMipmaps`, `unpackAlignment`

### DataArrayTexture

`isDataArrayTexture`, `magFilter`, `minFilter`, `generateMipmaps`, `flipY`, `unpackAlignment`

### DataTexture

`isDataTexture`, `magFilter`, `minFilter`, `flipY`, `generateMipmaps`, `unpackAlignment`

### DataTextureLoader

`constructor`, `load`, `parse`, `createDataTexture`

### DepthTexture

`isDepthTexture`, `flipY`, `magFilter`, `minFilter`, `generateMipmaps`, `format`, `type`, `compareFunction`

### DirectionalLight

`isDirectionalLight`, `toJSON`

### DirectionalLightHelper

`light`, `color`, `lightPlane`, `targetLine`

### DodecahedronGeometry

`type`, `static fromJSON`

### DRACOLoader

`setDecoderConfig` (deprecated), `load`, `parse`

### EdgesGeometry

`type`, `parameters`

### EffectComposer

`renderer`, `renderTarget1`, `renderTarget2`, `copyPass`, `timer`, `swapBuffers`, `isLastEnabledPass`, `reset`

### EllipseCurve

`isEllipseCurve`, `type`

### Euler

`isEuler`, `fromArray`, `toArray`, `static DEFAULT_ORDER`, `[Symbol.iterator]`

### EventDispatcher

`constructor`, `addEventListener`, `hasEventListener`, `removeEventListener`, `dispatchEvent`

### EXRLoader

`type`, `outputFormat`, `part`, `parse`, `setOutputFormat`, `setPart`

### ExternalTexture

`sourceTexture`, `isExternalTexture`, `constructor`

### ExtrudeGeometry

`type`

### Face

`constructor`, `outside`, `mark`, `edge`, `static create`, `compute`

### FileLoader

`load`

### Flow

`curveArray` (partial), `curveLengthArray` (partial)

### Flow

`curveArray` (partial), `curveLengthArray` (partial)

### Fog

`isFog`, `name`, `clone`

### FogExp2

`isFogExp2`, `name`, `clone`

### Font

`isFont`, `type`, `data` (partial), `constructor`

### FontLoader

`load`

### FramebufferTexture

`isFramebufferTexture`, `magFilter`, `minFilter`, `generateMipmaps`

### FrustumArray

`coordinateSystem`, `setFromArrayCamera`, `intersectsObject`, `intersectsSprite`, `intersectsSphere`, `intersectsBox`, `containsPoint`, `copy`, `clone`

### GLBufferAttribute

`constructor`, `isGLBufferAttribute`, `name`, `buffer`, `type`, `itemSize`, `elementSize`, `count`, `normalized`, `version`, `needsUpdate`, `setBuffer`, `setType`, `setItemSize`, `setCount`

### GLTFExporter

`textureUtils`, `setTextureUtils`, `parse`

### GLTFLoader

`dracoLoader`, `ktx2Loader`, `meshoptDecoder`

### GLTFParser

`json` (partial), `options`, `fileLoader`, `textureLoader`, `plugins`, `extensions`, `associations`, `setExtensions`, `setPlugins`, `parse`, `getDependencies`, `loadBuffer`, `loadBufferView`, `loadAccessor`, `loadTexture`, `loadTextureImage`, `loadImageSource`, `assignTexture`, `assignFinalMaterial`, `getMaterialType`, `loadMaterial`, `createUniqueName`, `createNodeMesh`, `loadGeometries`, `loadMesh`, `loadCamera`, `loadSkin`, `loadAnimation`, `loadNode`, `loadScene`

### GLTFWriter

`textureUtils`, `extensionsUsed` (partial), `extensionsRequired` (partial), `constructor`, `setPlugins`, `setTextureUtils`, `applyTextureTransform`, `writeAsync`

### Group

`isGroup`

### GTAOPass

`width`, `height`, `clear`, `camera`, `scene`, `pdRings`, `pdRadiusExponent`, `pdSamples`, `gtaoNoiseTexture`, `pdNoiseTexture`, `gtaoRenderTarget`, `pdRenderTarget`, `gtaoMaterial`, `normalMaterial`, `pdMaterial`, `depthRenderMaterial`, `copyMaterial`, `blendMaterial`, `fsQuad`, `originalClearColor`, `depthTexture`, `normalTexture`, `renderPass`, `renderOverride`, `overrideVisibility`, `restoreVisibility`, `generateNoise`, `static OUTPUT`

### HDRLoader

`type`, `parse`

### HemisphereLight

`isHemisphereLight`, `copy`, `toJSON`

### HemisphereLightHelper

`light`, `color`, `material`

### HTMLTexture

`isHTMLTexture`, `constructor`

### IcosahedronGeometry

`type`, `static fromJSON`

### ImageBitmapLoader

`isImageBitmapLoader`, `options`, `constructor`, `setOptions`, `load`

### ImageLoader

`constructor`, `load`

### ImageUtils

`static getDataURL`, `static sRGBToLinear`

### InstancedBufferAttribute

`isInstancedBufferAttribute`

### InstancedBufferGeometry

`type`, `isInstancedBufferGeometry`, `copy`

### InstancedFlow

`offsets`, `whichCurve` (partial)

### InstancedMesh

`isInstancedMesh`, `instanceMatrix` (partial), `instanceColor` (partial), `morphTexture`, `boundingBox`, `boundingSphere`, `updateMorphTargets`, `toJSON`

### InterleavedBuffer

`isInterleavedBuffer`, `onUploadCallback`, `toJSON`

### InterleavedBufferAttribute

`array`, `isInterleavedBufferAttribute`, `toJSON`

### Interpolant

`constructor`, `settings`

### KeyframeTrack

`constructor`, `InterpolantFactoryMethodDiscrete`, `InterpolantFactoryMethodLinear`, `InterpolantFactoryMethodSmooth`, `InterpolantFactoryMethodBezier`, `TimeBufferType`, `ValueBufferType`

### KTX2Loader

`transcoderPath`, `transcoderBinary`, `transcoderPending`, `workerPool`, `workerSourceURL`, `workerConfig`, `setWorkerLimit`, `detectSupportAsync`, `init`, `parse`

### LatheGeometry

`type`, `static fromJSON`

### Layers

`mask` (partial)

### Light

`constructor`, `isLight`, `toJSON`

### LightProbe

`isLightProbe`, `toJSON`

### LightShadow

`constructor`, `biasNode`, `mapType`, `map`, `mapPass`

### Line

`isLine`, `type`, `material`, `morphTargetInfluences`, `morphTargetDictionary`, `updateMorphTargets`

### Line2

`geometry`, `material`, `isLine2`

### Line2

`geometry`, `material`, `isLine2`

### LineBasicMaterial

`isLineBasicMaterial`, `setValues`, `linecap`, `linejoin`

### LineCurve

`isLineCurve`, `type`

### LineCurve3

`isLineCurve3`, `type`

### LineDashedMaterial

`isLineDashedMaterial`, `setValues`

### LineGeometry

`isLineGeometry`, `fromLine`

### LineLoop

`isLineLoop`, `type`

### LineMaterial

`isLineMaterial`

### LineSegments

`isLineSegments`, `type`

### Loader

`constructor`, `load`, `loadAsync`, `abort`, `static DEFAULT_MATERIAL_NAME`

### LoaderUtils

`static extractUrlBase`, `static resolveURL`

### LoadingManager

`abortController`, `removeHandler`

### LOD

`isLOD`, `type`, `toJSON`

### LoftGeometry

`parameters` (partial)

### Material

`constructor`, `isMaterial`, `setValues`, `fromJSON`, `precision`

### MaterialCreator

`constructor`, `baseUrl`, `options`, `materialsInfo`, `materials`, `nameLookup`, `side`, `wrap`, `crossOrigin`, `setMaterials`, `convert`, `getIndex`, `getTextureParams`, `loadTexture`

### MaterialLoader

`static createMaterialFromType`, `static registerMaterial`

### Matrix3

`isMatrix3`

### Mesh

`isMesh`, `type`, `morphTargetDictionary` (partial), `count`, `toJSON`

### MeshBasicMaterial

`isMeshBasicMaterial`, `setValues`, `wireframeLinecap`, `wireframeLinejoin`

### MeshDepthMaterial

`isMeshDepthMaterial`, `setValues`

### MeshDistanceMaterial

`isMeshDistanceMaterial`, `setValues`

### MeshLambertMaterial

`isMeshLambertMaterial`, `setValues`, `wireframeLinecap`, `wireframeLinejoin`

### MeshMatcapMaterial

`isMeshMatcapMaterial`, `setValues`

### MeshNormalMaterial

`isMeshNormalMaterial`, `setValues`

### MeshPhongMaterial

`isMeshPhongMaterial`, `setValues`, `wireframeLinecap`, `wireframeLinejoin`

### MeshPhysicalMaterial

`isMeshPhysicalMaterial`, `setValues`

### MeshStandardMaterial

`isMeshStandardMaterial`, `setValues`, `wireframeLinecap`, `wireframeLinejoin`

### MeshSurfaceSampler

`geometry`, `positionAttribute`, `weightAttribute` (partial), `binarySearch`, `sampleFace`

### MeshToonMaterial

`isMeshToonMaterial`, `setValues`, `wireframeLinecap`, `wireframeLinejoin`

### MTLLoader

`materialOptions`

### Object3D

`isObject3D`, `static DEFAULT_UP`, `static DEFAULT_MATRIX_AUTO_UPDATE`, `static DEFAULT_MATRIX_WORLD_AUTO_UPDATE`, `raycast`

### ObjectLoader

`load`, `parse`, `parseGeometries`, `parseMaterials`, `parseAnimations`, `parseImages`, `parseImagesAsync`, `parseTextures`, `parseObject`

### OBJLoader

`materials`

### OctahedronGeometry

`type`, `static fromJSON`

### Octree

`calcBox`, `split`

### OrbitControls

`target0`, `position0`, `zoom0`

### OrthographicCamera

`isOrthographicCamera`, `toJSON`

### OutlinePass

`renderScene`, `renderCamera`, `usePatternTexture`, `downSampleRatio`, `resolution`, `patternTexture`, `maskBufferMaterial`, `renderTargetMaskBuffer`, `depthMaterial`, `prepareMaskMaterial`, `renderTargetDepthBuffer`, `renderTargetMaskDownSampleBuffer`, `renderTargetBlurBuffer1`, `renderTargetBlurBuffer2`, `edgeDetectionMaterial`, `renderTargetEdgeBuffer1`, `renderTargetEdgeBuffer2`, `separableBlurMaterial1`, `separableBlurMaterial2`, `overlayMaterial`, `copyUniforms`, `materialCopy`, `oldClearColor`, `oldClearAlpha`, `fsQuad`, `tempPulseColor1`, `tempPulseColor2`, `textureMatrix`, `updateSelectionCache`, `changeVisibilityOfSelectedObjects`, `changeVisibilityOfNonSelectedObjects`, `updateTextureMatrix`, `getPrepareMaskMaterial`, `getEdgeDetectionMaterial`, `getSeparableBlurMaterial`, `getOverlayMaterial`

### OutputPass

`isOutputPass`, `uniforms`, `material`

### ParametricGeometry

`type`

### Pass

`constructor`, `isPass`, `render`

### Path

`type`

### PerspectiveCamera

`isPerspectiveCamera`, `toJSON`

### Plane

`isPlane`, `isIntersectionLine` (unavailable) (deprecated)

### PlaneGeometry

`type`, `static fromJSON`

### PlaneHelper

`plane`, `size`

### PLYLoader

`propertyNameMapping`, `customPropertyMapping`

### PMREMGenerator

`fromSceneAsync` (deprecated), `fromEquirectangularAsync` (deprecated), `fromCubemapAsync` (deprecated)

### PointLight

`isPointLight`, `toJSON`

### PointLightHelper

`light`, `color`

### Points

`isPoints`, `type`, `morphTargetInfluences`, `morphTargetDictionary`, `updateMorphTargets`

### PointsMaterial

`isPointsMaterial`, `setValues`

### PolarGridHelper

`constructor`, `dispose`

### PolyhedronGeometry

`type`, `parameters`, `static fromJSON`

### PropertyBinding

`static create`, `static sanitizeNodeName`, `static parseTrackName`, `static findNode`, `constructor`, `path`, `parsedPath`, `node`, `rootNode`, `bind`, `unbind`

### PropertyMixer

`constructor`, `binding`, `valueSize`, `buffer`, `cumulativeWeight`, `cumulativeWeightAdditive`, `useCount`, `referenceCount`, `accumulate`, `accumulateAdditive`, `apply`, `saveOriginalState`, `restoreOriginalState`

### QuadraticBezierCurve

`isQuadraticBezierCurve`, `type`

### QuadraticBezierCurve3

`isQuadraticBezierCurve3`, `type`

### Quaternion

`isQuaternion`, `[Symbol.iterator]`

### RawShaderMaterial

`isRawShaderMaterial`

### Ray

`isIntersectionBox` (unavailable) (deprecated), `isIntersectionPlane` (unavailable) (deprecated), `isIntersectionSphere` (unavailable) (deprecated)

### Raycaster

`params` (partial), `setFromXRController`

### RectAreaLight

`isRectAreaLight`, `power`, `copy`

### RectAreaLightUniformsLib

`static init`

### RenderPass

`scene`, `camera`, `overrideMaterial`, `clearColor`, `clearAlpha`, `clear`, `needsSwap`, `isRenderPass`

### RenderTarget

`isRenderTarget`, `width`, `height`, `depth`, `scissor`, `scissorTest`, `viewport`, `textures`, `depthBuffer`, `stencilBuffer`, `resolveDepthBuffer`, `resolveStencilBuffer`, `samples`, `multiview`, `useArrayDepthTexture`, `constructor`, `texture`, `depthTexture`, `setSize`, `clone`, `copy`, `dispose`

### RenderTarget3D

`isRenderTarget3D`, `constructor`

### RingGeometry

`type`, `static fromJSON`

### Scene

`isScene`, `overrideMaterial`, `copy`, `toJSON`

### SelectionBox

`instances` (partial), `batches` (partial)

### SelectionHelper

`pointBottomRight`, `pointTopLeft`, `startPoint`, `onSelectStart`, `onSelectMove`, `onSelectOver`

### ShaderMaterial

`isShaderMaterial`, `setValues`, `toJSON`, `fromJSON`, `defines`, `extensions` (partial), `defaultAttributeValues`

### ShaderPass

`fsQuad`

### ShadowMaterial

`isShadowMaterial`, `setValues`

### Shape

`type`

### ShapeGeometry

`type`, `static fromJSON`

### ShapePath

`type`

### SimplexNoise

`dot`, `dot3`, `dot4`

### Skeleton

`fromJSON`

### SkeletonHelper

`isSkeletonHelper`, `root`, `bones`

### SkinnedMesh

`isSkinnedMesh`, `type`, `bindMode`, `toJSON`

### SMAAPass

`edgesRT`, `weightsRT`, `areaTexture`, `searchTexture`, `uniformsEdges`, `materialEdges`, `uniformsWeights`, `materialWeights`, `uniformsBlend`, `materialBlend`, `fsQuad`, `getAreaTexture`, `getSearchTexture`

### Source

`isSource`, `id`, `data` (partial), `toJSON`

### Sphere

`isSphere`, `empty` (unavailable) (deprecated), `fromJSON`

### SphereGeometry

`type`, `static fromJSON`

### SphericalHarmonics3

`isSphericalHarmonics3`

### SplineCurve

`isSplineCurve`, `type`

### SpotLight

`isSpotLight`, `toJSON`

### SpotLightHelper

`light`, `color`, `cone`

### Sprite

`isSprite`, `type`, `castShadow`, `geometry`, `material`, `count`

### SpriteMaterial

`isSpriteMaterial`, `setValues`

### SVGLoader

`static getStrokeStyle`, `static pointsToStrokeWithBuffers`, `static createShapes` (deprecated)

### TetrahedronGeometry

`type`, `static fromJSON`

### Texture

`isTexture`, `id`, `width`, `height`, `depth`, `image`, `type` (partial), `internalFormat`, `premultiplyAlpha`, `isRenderTargetTexture`, `isArrayTexture`, `version`, `pmremVersion`, `normalized`, `needsPMREMUpdate`, `static DEFAULT_ANISOTROPY`, `static DEFAULT_IMAGE`, `static DEFAULT_MAPPING`, `renderTarget`, `onUpdate`, `setValues`

### TextureLoader

`load`

### ThreeMFLoader

`availableExtensions`, `addExtension`

### Timer

`connect`, `disconnect`

### TorusGeometry

`type`, `static fromJSON`

### TorusKnotGeometry

`type`, `static fromJSON`

### TransformControls

`camera`, `axis`, `mode` (partial), `space` (partial), `minx`, `pointerHover`, `pointerDown`, `pointerMove`, `pointerUp`, `getMode`, `setTranslationSnap`, `setRotationSnap`, `setScaleSnap`, `setSize`

### Triangle

`static getInterpolation`

### TubeGeometry

`type`, `static fromJSON`

### Uniform

`type`, `name`, `isUniform`

### UniformsGroup

`isUniformsGroup`, `id`, `uniforms` (partial)

### UnrealBloomPass

`resolution`, `clearColor`, `needsUpdate`, `renderTargetsHorizontal`, `renderTargetsVertical`, `nMips`, `renderTargetBright`, `highPassUniforms`, `materialHighPassFilter`, `separableBlurMaterials`, `compositeMaterial`, `bloomTintColors`, `copyUniforms`, `blendMaterial`

### USDZExporter

`textureUtils`, `setTextureUtils`, `parse`

### Vector2

`[Symbol.iterator]`

### Vector3

`[Symbol.iterator]`

### Vector4

`[Symbol.iterator]`

### VertexNormalsHelper

`isVertexNormalsHelper`

### VideoFrameTexture

`constructor`, `setFrame`

### VideoTexture

`isVideoTexture`, `magFilter`, `minFilter`, `generateMipmaps`, `needsUpdate`

### WebGL3DRenderTarget

`textures`, `isWebGL3DRenderTarget`

### WebGLArrayRenderTarget

`textures`, `isWebGLArrayRenderTarget`

### WebGLCapabilities

`constructor`, `isWebGL2`, `getMaxPrecision`, `textureFormatReadable`, `textureTypeReadable`, `logarithmicDepthBuffer`, `reversedDepthBuffer`, `maxVertexTextures`, `maxVertexUniforms`, `maxVaryings`, `maxFragmentUniforms`, `samples`

### WebGLCapabilities

`constructor`, `backend`, `maxAnisotropy`, `maxUniformBlockSize`, `getUniformBufferLimit`

### WebGLCubeRenderTarget

`textures`, `clear`

### WebGLInfo

`constructor`, `memory` (partial), `programs` (partial), `render` (partial), `update`

### WebGLRenderer

`autoClearColor`, `autoClearDepth`, `autoClearStencil`, `debug`, `sortObjects`, `extensions`, `coordinateSystem`, `transmissionResolutionScale`, `shadowMap` (partial), `properties`, `renderLists`, `state`, `xr`, `getContext`, `getContextAttributes`, `forceContextRestore`, `setDrawingBufferSize`, `setEffects`, `getCurrentViewport`, `setOpaqueSort`, `setTransparentSort`, `getClearColor`, `getClearAlpha`, `setClearAlpha`, `clearColor`, `clearDepth`, `clearStencil`, `setNodesHandler`, `renderBufferDirect`

### WebGLRenderTarget

`isWebGLRenderTarget`

### WebGLUtils

`constructor`, `convert`

### WireframeGeometry

`type`, `parameters`

