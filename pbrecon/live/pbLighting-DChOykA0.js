import{a5 as ce,aE as fe,a6 as de,af as be,ad as me,J as ge,l as he,aF as Pe,n as h,aG as R,aH as Y,aI as Me,V as v,x as N,al as T,b as _,aJ as ye,N as j,aK as De,aL as Le}from"./vendor-three-DP9E4hIN.js";import{g as ee,f as we}from"./settings-KiEmyUCV.js";import{l as _e,d as xe}from"./compressedTex-B-XwdJp4.js";import{b as Ae}from"./assetMap-BOyw80vP.js";function Ee(e,a=e){const r=e.userData.pbWorldRender;if(r?.version===1){if(r.blend){const{src:t,dst:n,op:i}=r.blend;if(t!==5||n!==3&&n!==6||i!==1)throw new Error("Unsupported map blend state");a.transparent=!0,a.blending=ce,a.blendEquation=fe,a.blendSrc=de,a.blendDst=n===3?be:me,a.premultipliedAlpha=!1}if(r.alphaTest!==void 0){a.alphaTest=r.alphaTest;const t=a.uniforms;t?.alphaTest&&(t.alphaTest.value=r.alphaTest)}r.depthWrite!==void 0&&(a.depthWrite=r.depthWrite),r.depthTest!==void 0&&(a.depthTest=r.depthTest)}}const f=typeof location>"u"||new URLSearchParams(location.search).get("pblight")!=="1",o={pbAmbient:{value:new v(1,1,1)},pbLightDir:{value:new v(0,1,0)},pbLightDiffuse:{value:new T(0,0,0,1)},pbLightSpecular:{value:new T(0,0,0,1)},pbEnvMap:{value:null},pbHasEnv:{value:0},pbEnvAvg:{value:Array.from({length:6},()=>new v)},pbFogMode:{value:0},pbFogColor:{value:new v(1,1,1)},pbFogParams:{value:new v(1,1e3,1)}},y=new Set;let U=!1;function ae(e){const a=ee();return e.userData.pbFullLook?{...a,normalMap:!0,specularMap:!0,reflection:!0}:a}function x(e){const a={};if(e.userData.pbArray&&(a.PB_ARRAY=""),f)a.PBM_LIGHT="",e.userData.pbFullLook&&(a.PBM_VIEW="");else if(!e.userData.pbLowEnvironment){const n=ae(e),i=e.uniforms,s=o.pbHasEnv.value>0;n.normalMap&&i.hasNormal.value&&(a.PB_NORMAL=""),i.hasSpec.value&&(a.PB_SPECMAP="",n.specularMap&&(a.PB_SPEC="")),n.reflection&&(i.hasEmissive.value&&(a.PB_EMISSIVE=""),i.hasRef.value&&s&&(a.PB_REFLECT="")),n.ibl&&s&&(a.PB_IBL=""),n.rimLight&&(a.PB_RIM="")}const r=e.defines??{},t=Object.keys(a);t.length===Object.keys(r).length&&t.every(n=>n in r)||(e.defines=a,e.needsUpdate=!0)}function V(){for(const e of y)x(e)}const L=new Set,K=new WeakMap,I=new WeakMap;function G(e){const a=ae(e);let r=K.get(e);r||K.set(e,r=new Set);const t=(n,i,s,p)=>{if(!n||typeof i!="string"||r.has(s))return;r.add(s);const l=_e(i).then(u=>{if(!u)throw new Error(`Material texture could not load: ${i}`);e.userData.pbKeepCanvas&&(u.userData.pbKeepCanvas=!0),e.uniforms[s].value=u,e.uniforms[p].value=1,x(e)});let c=I.get(e);c||I.set(e,c=new Map),c.set(s,l),l.catch(()=>{r.delete(s)})};t(!f&&a.normalMap,e.userData.pbNormalUrl,"normalMap","hasNormal"),t(!f&&(a.specularMap||a.ibl),e.userData.pbSpecUrl,"specMap","hasSpec"),t(!f&&a.reflection,e.userData.pbRefUrl,"refMap","hasRef"),t(!f&&a.reflection,e.userData.pbEmissiveUrl,"emissiveMap","hasEmissive")}let z=null,k=null,re=Promise.resolve();function A(){if(f)return;const e=z,a=ee();!e||e===k||!(a.reflection||a.ibl||U)||(k=e,re=xe(e).then(r=>{if(e!==z)return r?.tex.dispose();if(o.pbEnvMap.value=r?.tex??null,o.pbHasEnv.value=r?1:0,r)for(let t=0;t<6;t++)o.pbEnvAvg.value[t].fromArray(r.avg,t*3);V()}))}async function Oe(e){const a=new Set;e.traverse(r=>{const t=r.material;for(const n of Array.isArray(t)?t:t?[t]:[])if(L.has(n)){G(n);for(const i of I.get(n)?.values()??[])a.add(i)}}),A(),await Promise.all([...a,re])}function $(e){z=e,k=null,o.pbEnvMap.value?.dispose(),o.pbEnvMap.value=null,o.pbHasEnv.value=0,V(),A()}we(()=>{for(const e of L)G(e);V(),A()});let O=null,w=new v(.588,.588,.588);const E=new Set;function He(){return O}const Fe=new Set(["deadtown"]);async function qe(e){let a=null;const r=/\/maps\/([^/]+)\/lighting\.json$/.exec(e)?.[1];if(!Ae(e)||r&&Fe.has(r))return X(null),$(null),null;try{const t=await fetch(e),n=t.headers.get("content-type")??"";t.ok&&!n.includes("text/html")&&(a=await t.json())}catch{a=null}return X(a),$(a?.envRef?e.replace(/lighting.json$/,a.envRef):null),a}function X(e){if(O=e,le=!f&&e?.lightVolume?Ue(e.lightVolume):null,!e)return;o.pbAmbient.value.fromArray(e.ambient),w=new v().fromArray(e.defaultDiffuse),e.light?(o.pbLightDir.value.fromArray(e.light.dirToLight).normalize(),o.pbLightDiffuse.value.fromArray(e.light.diffuse),o.pbLightSpecular.value.fromArray(e.light.specular)):o.pbLightDiffuse.value.set(0,0,0,1);const a=e.fog.find(r=>r.index===0);o.pbFogMode.value=a&&a.enable?a.mode:0,a&&(o.pbFogColor.value.set(a.color[0]/255,a.color[1]/255,a.color[2]/255),o.pbFogParams.value.set(a.near,a.far,a.density));for(const r of E)r.reset()}function Ye(e,a){e.toneMapping=ge,e.toneMappingExposure=1;const r=f?void 0:O?.fog.find(t=>t.index===0);if(r&&r.enable){const t=new h().setRGB(r.color[0]/255,r.color[1]/255,r.color[2]/255,N);a.fog=r.mode===3?new De(t,r.near,r.far):r.mode===2?new Le(t,r.density):null}else a.fog=null}function je(){const e=new he;if(e.name="pbFallbackLights",f){e.add(new Pe(new h().setRGB(1,1,1,R),new h().setRGB(80/255,80/255,90/255,R),Math.PI));const i=new Y(new h().setRGB(1,1,1,R),.6*Math.PI);return i.position.set(30,60,20),e.add(i),e}const a=o.pbAmbient.value,r=o.pbLightDiffuse.value,t=w;e.add(new Me(new h().setRGB(a.x,a.y,a.z,N),Math.PI));const n=new Y(new h().setRGB(Math.min(1,r.x*t.x),Math.min(1,r.y*t.y),Math.min(1,r.z*t.z),N),Math.PI);return n.position.copy(o.pbLightDir.value).multiplyScalar(50),e.add(n),e}const H=`
vec3 pbmLin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c)); }
vec3 pbmOut(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
uniform int pbFogMode;
uniform vec3 pbFogColor;
uniform vec3 pbFogParams;
varying float vPbFogDepth;
vec3 pbFog(vec3 c) {
  if (pbFogMode == 0) return c;
  float z = vPbFogDepth, f;
  if (pbFogMode == 3) f = (pbFogParams.y - z) / (pbFogParams.y - pbFogParams.x);
  else if (pbFogMode == 1) f = exp(-pbFogParams.z * z);
  else f = exp(-(pbFogParams.z * z) * (pbFogParams.z * z));
  return mix(pbFogColor, c, clamp(f, 0.0, 1.0));
}`,Se=`
#include <common>
#ifndef USE_UV1
attribute vec2 uv1;
#endif
varying vec2 vPbUv;
varying vec2 vPbUv1;
varying float vPbFogDepth;
void main() {
  vPbUv = uv;
  vPbUv1 = uv1;
  #include <begin_vertex>
  #include <project_vertex>
  vPbFogDepth = -mvPosition.z; // table fog: view-space depth (W-friendly projection)
}`,Re=`
uniform sampler2D map;
uniform sampler2D luxMap;
uniform vec4 pbLightDiffuse;
uniform float alphaTest;
varying vec2 vPbUv;
varying vec2 vPbUv1;
${H}
void main() {
  vec4 D = texture2D(map, vPbUv);
  vec3 L = texture2D(luxMap, vPbUv1).rgb;
  float a = D.a * pbLightDiffuse.a;
  if (a <= alphaTest) discard;
#ifdef PBM_LIGHT
  gl_FragColor = vec4(pbmOut(pbmLin(D.rgb) * pbmLin(L) * 4.59), a); return; // MeshBasicMaterial + lightMap 4.59
#endif
  vec3 c = 2.0 * D.rgb * (L * ((L + D.rgb) * 0.3 + 1.0)); // Phong_DLX_Dir_
  gl_FragColor = vec4(pbFog(clamp(c, 0.0, 1.0)), a);
}`,te=`
#include <common>
#include <skinning_pars_vertex>
varying vec2 vPbUv;
varying vec3 vPbNormal;
varying vec3 vPbWorldPos;
varying float vPbFogDepth;
#ifdef PB_ARRAY
attribute float pbLayer;
varying float vPbLayer;
#endif
void main() {
  vPbUv = uv;
#ifdef PB_ARRAY
  vPbLayer = pbLayer;
#endif
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  vPbNormal = inverseTransformDirection(transformedNormal, viewMatrix); // vs_1_1: normalised per vertex
  vPbWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vPbFogDepth = -mvPosition.z;
}`,ne=`
uniform sampler2D map;
uniform float hasMap;
uniform sampler2D normalMap;
uniform sampler2D specMap;
#ifdef PB_ARRAY
uniform sampler2DArray mapArr;
uniform sampler2DArray normalArr;
uniform sampler2DArray specArr;
varying float vPbLayer;
#define PB_MAP(uv) texture(mapArr, vec3(uv, vPbLayer))
#define PB_NORMAL_MAP(uv) texture(normalArr, vec3(uv, vPbLayer))
#define PB_SPEC_MAP(uv) texture(specArr, vec3(uv, vPbLayer))
#else
#define PB_MAP(uv) texture2D(map, uv)
#define PB_NORMAL_MAP(uv) texture2D(normalMap, uv)
#define PB_SPEC_MAP(uv) texture2D(specMap, uv)
#endif
uniform sampler2D refMap;
uniform samplerCube pbEnvMap;
uniform vec3 pbEnvAvg[6];
uniform sampler2D emissiveMap;
uniform vec3 emissiveColor;
uniform vec3 baseColor;
uniform vec3 pbAmbient;
uniform vec3 pbLightDir;
uniform vec4 pbLightDiffuse;
uniform vec4 pbLightSpecular;
uniform vec4 mtlDiffuse;
uniform vec3 mtlSpecular;
uniform float mtlShininess;
uniform float alphaTest;
uniform float useFog;
varying vec2 vPbUv;
varying vec3 vPbNormal;
varying vec3 vPbWorldPos;
${H}
float d3dPow(float x, float y) { return y <= 0.0 ? 1.0 : pow(x, y); }
void main() {
  vec4 D = hasMap > 0.5 ? PB_MAP(vPbUv) : vec4(1.0);
  D.rgb *= baseColor;
  vec3 N = vPbNormal;                        // interpolated, not renormalised (ps_2_x uses t1 directly)
#ifdef PB_NORMAL
  {
    // Phong_DN*: n = x*T - y*B + sqrt(1-x^2-y^2)*N. The vertex tangent/binormal in the
    // i3 VA30 are not reliable (zero in half the triangles), so the frame comes from screen derivatives (cotangent frame).
    // [INFERIDO] sign: in the vertex data T = +dP/du and B = -dP/dv (measured on Weapon_AK-47_PBIC2013, B only where non-zero), so
    // -y*B = +y*dP/dv: the D3D map is a GL map with G flipped; uv here is the glTF/D3D one (v down), no flip needed.
    vec3 Ng = normalize(vPbNormal);
    vec3 dp1 = dFdx(vPbWorldPos), dp2 = dFdy(vPbWorldPos);
    vec2 duv1 = dFdx(vPbUv), duv2 = dFdy(vPbUv);
    vec3 dp2perp = cross(dp2, Ng), dp1perp = cross(Ng, dp1);
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
    float inv = inversesqrt(max(max(dot(T, T), dot(B, B)), 1e-20));
    vec2 xy = PB_NORMAL_MAP(vPbUv).rg * 2.0 - 1.0;
    N = normalize(xy.x * T * inv + xy.y * B * inv + sqrt(max(1.0 - dot(xy, xy), 0.0)) * Ng); // bytecode: nrm r1.xyz
  }
#endif
  vec3 L = pbLightDir;
  vec4 LD = pbLightDiffuse * mtlDiffuse;     // g_vLightDiffuse0
  float a = D.a * LD.a;
  if (a <= alphaTest) discard;
#ifdef PBM_LIGHT
  {
    // MeshLambertMaterial: D * (hemisphere + directional), linear; the viewmodel's lights are in its camera's frame
#ifdef PBM_VIEW
    vec3 Nl = normalize((viewMatrix * vec4(N, 0.0)).xyz), Ld = vec3(0.0, 1.0, 0.0);
    float Li = 0.5;
#else
    vec3 Nl = normalize(N), Ld = vec3(0.4286, 0.8571, 0.2857);
    float Li = 0.6;
#endif
    vec3 irr = mix(vec3(0.3137, 0.3137, 0.3529), vec3(1.0), 0.5 * Nl.y + 0.5) + Li * max(dot(Nl, Ld), 0.0);
    gl_FragColor = vec4(pbmOut(pbmLin(D.rgb) * irr), a);
    return;
  }
#endif
  float nl = dot(L, N);
  float ndl = clamp(nl, 0.0, 1.0);
  vec3 R = 2.0 * nl * N - L;
  vec3 V = normalize(cameraPosition - vPbWorldPos);
  float rv = clamp(dot(R, V), 0.0, 1.0);
  // d3dPow: ps_2_x pow = exp2(y * log2(x)) with the D3D9 rule 0 * anything = 0, so pow(0, 0) = 1. GLSL pow(0, 0) is NaN:
  // spec maps with alpha 0 (as-50_beyond_spec, coltppython_holder_spec 100 %) painted every R.V = 0 texel black.
#ifdef PB_SPEC
  vec4 S = PB_SPEC_MAP(vPbUv);               // Phong_*S*: specMap.rgb*2 * pow(R.V, specMap.a*255)
  vec3 spec = S.rgb * 2.0 * d3dPow(rv, S.a * 255.0);
#else
  vec3 spec = d3dPow(rv, mtlShininess) * pbLightSpecular.rgb * mtlSpecular; // g_vLightSpecular0
#endif
  vec3 k = (D.rgb + ndl) * 0.3 + 1.0;
  vec3 c = LD.rgb * (ndl * (D.rgb * k + spec)) + D.rgb * pbAmbient;   // Phong_D_Dir_
#ifdef PB_EMISSIVE
  c += texture2D(emissiveMap, vPbUv).rgb * emissiveColor * 4.0; // Phong_*E*: E * g_vMtlEmissive * 4
#endif
#ifdef PB_REFLECT
  {
    // Phong_*RM*: rgb += texCUBE(g_texReflect, g_mInvView * reflect(nrm(viewPos), N)) * reflectMask.rgb (additive, unlit). Done in world space:
    // the world coordinates are the D3D ones (cubemap +Y face = sky, measured), so no axis swap. [INFERIDO] face orientation / no x flip.
    vec3 Rw = reflect(normalize(vPbWorldPos - cameraPosition), normalize(N));
    c += textureCube(pbEnvMap, Rw).rgb * texture2D(refMap, vPbUv).rgb;
  }
#endif
#if defined(PB_RIM) || defined(PB_IBL)
  {
    // DX11 "máximo" (ini [DX11] RimLight / IBL): only booleans exist in the clients, the HLSL is encrypted.
    // Everything below is [RECRIADO]; constants are conservative guesses, not exe values.
    vec3 Nn = normalize(N);
    float mapLight = clamp(dot(pbAmbient + pbLightDiffuse.rgb, vec3(0.3333)), 0.0, 1.0); // dark map = no neon
#ifdef PB_IBL
    {
      // IBL diffuse: the env_ref.dds has no mips, so the CPU averaged each face (pbEnvAvg, cubeFaceAverages); blend the 6 colours by N^2
      // per axis (sign picks +/- face, same GL face order as the reflection sample) x albedo.
      vec3 w2 = Nn * Nn;
      vec3 irr = w2.x * (Nn.x >= 0.0 ? pbEnvAvg[0] : pbEnvAvg[1]) + w2.y * (Nn.y >= 0.0 ? pbEnvAvg[2] : pbEnvAvg[3]) + w2.z * (Nn.z >= 0.0 ? pbEnvAvg[4] : pbEnvAvg[5]);
      c += D.rgb * irr * 0.35;
      // IBL specular: sharp sample along reflect(V) x existing spec map (or its mean without one), fresnel-weighted.
      vec3 Vi = normalize(cameraPosition - vPbWorldPos);
      float fres = 0.04 + 0.96 * pow(1.0 - clamp(dot(Nn, Vi), 0.0, 1.0), 5.0);
#ifdef PB_SPECMAP
      vec3 sc = PB_SPEC_MAP(vPbUv).rgb;
#else
      vec3 sc = vec3(0.5);
#endif
      c += textureCube(pbEnvMap, reflect(-Vi, Nn), 2.0).rgb * sc * (0.25 + fres) * 0.5;
    }
#endif
#ifdef PB_RIM
    // Rim: pow(1-N.V, 3) * color * 0.5, additive, scaled by map light (ambient + directional).
    {
      float rim = pow(1.0 - clamp(dot(Nn, normalize(cameraPosition - vPbWorldPos)), 0.0, 1.0), 3.0);
      c += rim * vec3(0.85, 0.9, 1.0) * 0.5 * mapLight;
    }
#endif
  }
#endif
  c = clamp(c, 0.0, 1.0);
  gl_FragColor = vec4(useFog > 0.5 ? pbFog(c) : c, a);
}`;function W(e){return e?(e.colorSpace!==j&&(e.colorSpace=j,e.needsUpdate=!0),e):null}function F(e,a){return a.name=e.name,a.side=e.side,a.transparent=e.transparent,a.opacity=e.opacity,a.depthWrite=e.depthWrite,a.depthTest=e.depthTest,a.blending=e.blending,a.toneMapped=!1,a.userData.pb=!0,a}function Ke(e){const a=e.aoMap??e.lightMap,r=new _({vertexShader:Se,fragmentShader:Re,uniforms:{map:{value:W(e.map)},luxMap:{value:W(a)},alphaTest:{value:e.alphaTest>0?e.alphaTest:-1},pbLightDiffuse:o.pbLightDiffuse,pbFogMode:o.pbFogMode,pbFogColor:o.pbFogColor,pbFogParams:o.pbFogParams}});return f&&(r.defines={PBM_LIGHT:""}),F(e,r),Ee(e,r),r}const Be=`
#include <common>
#ifndef USE_UV1
attribute vec2 uv1;
#endif
attribute vec2 pbLayer;
varying vec2 vPbUv;
varying vec2 vPbUv1;
varying vec2 vPbLayer;
varying float vPbFogDepth;
void main() {
  vPbUv = uv;
  vPbUv1 = uv1;
  vPbLayer = pbLayer;
  #include <begin_vertex>
  #include <project_vertex>
  vPbFogDepth = -mvPosition.z;
}`,Ce=`
uniform sampler2DArray mapArr;
uniform sampler2DArray luxArr;
uniform vec4 pbLightDiffuse;
uniform float alphaTest;
varying vec2 vPbUv;
varying vec2 vPbUv1;
varying vec2 vPbLayer;
${H}
void main() {
  vec4 D = texture(mapArr, vec3(vPbUv, vPbLayer.x));
  vec3 L = texture(luxArr, vec3(vPbUv1, vPbLayer.y)).rgb;
  float a = D.a * pbLightDiffuse.a;
  if (a <= alphaTest) discard;
#ifdef PBM_LIGHT
  gl_FragColor = vec4(pbmOut(pbmLin(D.rgb) * pbmLin(L) * 4.59), a); return; // MeshBasicMaterial + lightMap 4.59
#endif
  vec3 c = 2.0 * D.rgb * (L * ((L + D.rgb) * 0.3 + 1.0)); // Phong_DLX_Dir_
  gl_FragColor = vec4(pbFog(clamp(c, 0.0, 1.0)), a);
}`;function $e(e,a,r){const t=new _({vertexShader:Be,fragmentShader:Ce,uniforms:{mapArr:{value:a},luxArr:{value:r},alphaTest:{value:e.uniforms.alphaTest.value},pbLightDiffuse:o.pbLightDiffuse,pbFogMode:o.pbFogMode,pbFogColor:o.pbFogColor,pbFogParams:o.pbFogParams}});return f&&(t.defines={PBM_LIGHT:""}),F(e,t)}const D=new WeakMap;class ie{diffuse={value:new T(.588,.588,.588,1)};specular={value:new v(0,0,0)};shininess={value:12.8};materials=new Map;bindMaterial(a,r){const t=(r&&this.materials.get(r))??a.transparent;this.materials.set(a,t),D.set(a,this),this.blendMaterial(a,t),a.addEventListener("dispose",()=>{this.materials.delete(a),D.delete(a)})}blendMaterial(a,r){const t=this.diffuse.value.w<1||r;a.transparent!==t&&(a.transparent=t,a.needsUpdate=!0)}setAlpha(a){const r=this.diffuse.value.w<1;if(this.diffuse.value.w=a,r!==a<1)for(const[t,n]of this.materials)this.blendMaterial(t,n)}releaseMaterials(){for(const a of this.materials.keys())D.delete(a);this.materials.clear()}t=1;prev=new v;target=new v;primed=!1;reset(){this.primed=!1,this.t=1}update(a,r){if(f)return;const t=this.diffuse.value;if(!this.primed){Z(a,this.target),this.prev.copy(this.target),t.set(this.target.x,this.target.y,this.target.z,t.w),this.primed=!0,this.t=0;return}if(this.t+=r,this.t>=J){this.prev.copy(this.target),Z(a,this.target),this.t=0;return}const n=Math.min(1,this.t*(1/J));t.set(this.prev.x+(this.target.x-this.prev.x)*n,this.prev.y+(this.target.y-this.prev.y)*n,this.prev.z+(this.target.z-this.prev.z)*n,t.w)}}const oe=new ie;E.add(oe);function Xe(){const e=new ie;return E.add(e),e}function Je(e){e!==oe&&(E.delete(e),e.releaseMaterials())}function Ne(e,a,r=!1,t=!1){const n=e,i=!!n.userData.pbLowEnvironment,s=W(n.map),p=n.color?n.color.clone():new h(1,1,1);s||p.convertLinearToSRGB();const l=new _({vertexShader:te,fragmentShader:ne,uniforms:{map:{value:s},hasMap:{value:s?1:0},normalMap:{value:null},hasNormal:{value:0},specMap:{value:null},hasSpec:{value:0},refMap:{value:null},hasRef:{value:0},emissiveMap:{value:null},hasEmissive:{value:0},emissiveColor:{value:new v().fromArray(n.userData.pbEmissiveColor??[1,1,1])},pbEnvMap:o.pbEnvMap,pbHasEnv:o.pbHasEnv,baseColor:{value:new v(p.r,p.g,p.b)},alphaTest:{value:n.alphaTest>0?n.alphaTest:-1},useFog:{value:r?1:0},mtlDiffuse:a.diffuse,mtlSpecular:a.specular,mtlShininess:a.shininess,pbEnvAvg:o.pbEnvAvg,pbAmbient:o.pbAmbient,pbLightDir:o.pbLightDir,pbLightDiffuse:o.pbLightDiffuse,pbLightSpecular:o.pbLightSpecular,pbFogMode:o.pbFogMode,pbFogColor:o.pbFogColor,pbFogParams:o.pbFogParams}});return l.userData.pbLowEnvironment=i,t&&!i&&(l.userData.pbFullLook=!0,U||(U=!0,A())),y.add(l),l.addEventListener("dispose",()=>{y.delete(l),L.delete(l)}),!i&&(n.userData.pbNormalUrl||n.userData.pbSpecUrl||n.userData.pbRefUrl||n.userData.pbEmissiveUrl)&&(l.userData.pbNormalUrl=n.userData.pbNormalUrl,l.userData.pbSpecUrl=n.userData.pbSpecUrl,l.userData.pbRefUrl=n.userData.pbRefUrl,l.userData.pbEmissiveUrl=n.userData.pbEmissiveUrl,L.add(l),G(l)),x(l),F(e,l),a.bindMaterial(l),l}function Qe(e,a,r,t){const n=e.uniforms,i=new _({vertexShader:te,fragmentShader:ne,uniforms:{...Object.fromEntries(Object.entries(n).map(([s,p])=>[s,p])),map:{value:null},hasMap:{value:1},normalMap:{value:null},hasNormal:{value:r?1:0},specMap:{value:null},hasSpec:{value:t?1:0},refMap:{value:null},hasRef:{value:0},emissiveMap:{value:null},hasEmissive:{value:0},mapArr:{value:a},normalArr:{value:r},specArr:{value:t},baseColor:{value:n.baseColor.value.clone()},alphaTest:{value:n.alphaTest.value},useFog:{value:n.useFog.value},emissiveColor:{value:n.emissiveColor.value.clone()}}});return i.userData.pbArray=!0,i.userData.pbLowEnvironment=!!e.userData.pbLowEnvironment,y.add(i),i.addEventListener("dispose",()=>y.delete(i)),x(i),F(e,i),D.get(e)?.bindMaterial(i,e),i}function Ze(e,a){const r=new Map;e.traverse(t=>{const n=t;if(!n.isMesh)return;const i=s=>{if(s.userData.pb||!s.colorWrite)return s;let p=r.get(s);return p||(p=Ne(s,a),r.set(s,p)),p};n.material=Array.isArray(n.material)?n.material.map(i):i(n.material)})}const J=.033,Te=1,P=.5,m=4,se=(e,a)=>(e+32768)*65536+(a+32768);let le=null;function Ue(e){const a=Float32Array.from(e.positions),r=Uint32Array.from(e.tris),t=new Float32Array(e.colors.length);for(let i=0;i<t.length;i++)t[i]=e.colors[i]*2/255;const n=new Map;for(let i=0;i<r.length/3;i++){let s=1/0,p=1/0,l=-1/0,c=-1/0;for(let u=0;u<3;u++){const d=r[i*3+u]*3;s=Math.min(s,a[d]),l=Math.max(l,a[d]),p=Math.min(p,a[d+2]),c=Math.max(c,a[d+2])}for(let u=Math.floor(s/m);u<=Math.floor(l/m);u++)for(let d=Math.floor(p/m);d<=Math.floor(c/m);d++){const M=se(u,d);let g=n.get(M);g||n.set(M,g=[]),g.push(i)}}return{p:a,t:r,c:t,grid:n,seen:new Uint32Array(r.length/3),stamp:0}}const Ie=new v,B=new v,ze=new v,C=new v,Q=new ye;function Z(e,a=new v){const r=le;if(!r)return a.copy(w);const t=e.x,n=e.y+Te,i=e.z,s=P*P;C.set(t,n,i);const p=r.seen,l=++r.stamp;let c=0,u=0,d=0,M=0;for(let g=Math.floor((t-P)/m);g<=Math.floor((t+P)/m);g++)for(let S=Math.floor((i-P)/m);S<=Math.floor((i+P)/m);S++){const q=r.grid.get(se(g,S));if(q)for(const b of q){if(p[b]===l)continue;p[b]=l;const pe=r.t[b*3]*3,ve=r.t[b*3+1]*3,ue=r.t[b*3+2]*3;Q.set(Ie.fromArray(r.p,pe),B.fromArray(r.p,ve),ze.fromArray(r.p,ue)),Q.closestPointToPoint(C,B),!(B.distanceToSquared(C)>s)&&(u+=r.c[b*3],d+=r.c[b*3+1],M+=r.c[b*3+2],c++)}}return c?a.set(u/c,d/c,M/c):a.copy(w)}export{oe as P,Qe as a,Ze as b,Xe as c,Je as d,Oe as e,Ne as f,je as g,Ee as h,Ke as i,Ye as j,He as k,qe as l,f as m,$e as p,Z as q};
