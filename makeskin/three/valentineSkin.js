/**
 * valentineSkin.js — three.js look-dev for the Zombie Slayer "Valentine" skin.
 *
 * Matches the Blender render: pearl metal panels, crimson lacquer, rose-gold
 * pinstripes, ivory rose marquetry, emissive hearts, thin-film iridescence,
 * clear coat and a field of twinkling surface sparkles.
 *
 * Usage (see preview_valentine.html for a runnable page):
 *
 *   const skin = new ValentineSkin({ basePath: './tex/sea3123_zombieslayer' });
 *   await skin.load();
 *   const model = await loadGlb('zombie_slayer_valentine.glb');
 *   skin.apply(model);
 *   scene.add(model, skin.sparkles);
 *   // in the render loop:
 *   skin.update(elapsedSeconds);
 */

import * as THREE from 'three';

const DEFAULTS = {
  // thin film: the rainbow seen on the pearl panels and the lacquer coat
  iridescence: 1.0,
  iridescenceIOR: 1.55,
  iridescenceMin: 140,
  iridescenceMax: 560,
  clearcoat: 0.45,
  clearcoatRoughness: 0.10,
  sheen: 0.55,
  sheenColor: 0xff8fb4,
  sheenRoughness: 0.55,
  emissiveIntensity: 0.9,
  sparkleStrength: 0.55,
  sparkleColor: 0xffc6dd,
  sparkleCount: 260,
};

/* -------------------------------------------------------------------------- */
/*  material                                                                  */
/* -------------------------------------------------------------------------- */

export class ValentineSkin {
  constructor(opts = {}) {
    this.opts = { ...DEFAULTS, ...opts };
    this.textures = {};
    this.materials = [];
    this._clock = new THREE.Clock();
    this.sparkles = null;
    this._uniforms = {
      uTime: { value: 0 },
      uSparkleStrength: { value: this.opts.sparkleStrength },
      uSparkleColor: { value: new THREE.Color(this.opts.sparkleColor) },
    };
  }

  async load() {
    const base = this.opts.basePath ?? './tex/sea3123_zombieslayer';
    const loader = new THREE.TextureLoader();
    const want = {
      map: ['skin_valentine_diff.png', THREE.SRGBColorSpace],
      normalMap: ['skin_valentine_norm.png', THREE.NoColorSpace],
      orm: ['skin_valentine_orm.png', THREE.NoColorSpace],
      emissiveMap: ['skin_valentine_emissive.png', THREE.SRGBColorSpace],
    };
    const jobs = Object.entries(want).map(async ([key, [file, space]]) => {
      const tex = await loader.loadAsync(`${base}/${file}`);
      tex.flipY = false;                       // glTF UV convention
      tex.colorSpace = space;
      tex.anisotropy = this.opts.anisotropy ?? 8;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      this.textures[key] = tex;
    });
    await Promise.all(jobs);
    return this;
  }

  /** Build the physical material used for every mesh of the weapon. */
  createMaterial() {
    const o = this.opts;
    const t = this.textures;

    const mat = new THREE.MeshPhysicalMaterial({
      map: t.map ?? null,
      normalMap: t.normalMap ?? null,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: t.orm ?? null,
      metalnessMap: t.orm ?? null,
      aoMap: t.orm ?? null,
      aoMapIntensity: 0.6,
      roughness: 1.0,                 // multiplied by the ORM green channel
      metalness: 1.0,                 // multiplied by the ORM blue channel
      emissiveMap: t.emissiveMap ?? null,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: o.emissiveIntensity,
      iridescence: o.iridescence,
      iridescenceIOR: o.iridescenceIOR,
      iridescenceThicknessRange: [o.iridescenceMin, o.iridescenceMax],
      clearcoat: o.clearcoat,
      clearcoatRoughness: o.clearcoatRoughness,
      sheen: o.sheen,
      sheenColor: new THREE.Color(o.sheenColor),
      sheenRoughness: o.sheenRoughness,
    });

    // Surface glitter: a sparse cell hash in UV space, gated by Fresnel so it
    // only fires at grazing angles — same behaviour as the Blender coat.
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this._uniforms.uTime;
      shader.uniforms.uSparkleStrength = this._uniforms.uSparkleStrength;
      shader.uniforms.uSparkleColor = this._uniforms.uSparkleColor;

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          /* glsl */ `
          #include <common>
          uniform float uTime;
          uniform float uSparkleStrength;
          uniform vec3  uSparkleColor;
          float vdayHash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }
          `
        )
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `
          #include <emissivemap_fragment>
          {
            vec3  V = normalize(vViewPosition);
            float fres = pow(1.0 - saturate(abs(dot(normalize(normal), V))), 2.5);
            #ifdef USE_MAP
              vec2 sparkUv = vMapUv;
            #else
              vec2 sparkUv = vec2(0.0);
            #endif
            float cell = vdayHash(floor(sparkUv * vec2(420.0, 210.0)));
            float glint = pow(cell, 26.0) * (0.55 + 0.45 * sin(uTime * 5.5 + cell * 120.0));
            totalEmissiveRadiance += uSparkleColor * glint * fres * uSparkleStrength * 3.0;
          }
          `
        );
      mat.userData.shader = shader;
    };
    mat.customProgramCacheKey = () => 'valentine-skin';

    this.materials.push(mat);
    return mat;
  }

  /** Assign the material to every mesh under `root` and build the sparkles. */
  apply(root) {
    const mat = this.createMaterial();
    const meshes = [];

    root.traverse((obj) => {
      if (!obj.isMesh) return;
      // keep the original material's side/flags, but swap the shading
      const prev = obj.material;
      obj.material = mat;
      if (prev && prev.side !== undefined) mat.side = prev.side;
      obj.frustumCulled = true;
      meshes.push(obj);
    });

    // sparkle points live in the same space as `root`, so they inherit its
    // rotation/scale instead of being baked in world space
    root.updateWorldMatrix(true, true);
    this.sparkles = makeSparkleField(meshes, {
      count: this.opts.sparkleCount,
      uniforms: this._uniforms,
      space: root,
    });
    this.sparkles.name = 'ValentineSparkles';
    root.add(this.sparkles);
    return root;
  }

  update(elapsed) {
    this._uniforms.uTime.value = elapsed;
  }
}

/* -------------------------------------------------------------------------- */
/*  surface sparkles (additive point sprites, 4-point star)                   */
/* -------------------------------------------------------------------------- */

const SPARKLE_COLORS = [
  0xffe6f0, 0xff9dc4, 0xffd6a8, 0xc9ffe9, 0xcdb8ff, 0xffffff,
];

export function makeSparkleField(meshes, { count = 400, uniforms, space = null } = {}) {
  const positions = [];
  const seeds = [];
  const sizes = [];
  const colors = [];

  const tmp = new THREE.Vector3();
  const nrm = new THREE.Vector3();

  // sample vertices so the sparkles sit exactly on the weapon shell
  let budget = count;
  const perMesh = Math.max(1, Math.floor(count / Math.max(1, meshes.length)));

  for (const mesh of meshes) {
    if (budget <= 0) break;
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    if (!pos) continue;
    const normal = geo.attributes.normal;
    const n = Math.min(perMesh, budget);
    for (let i = 0; i < n; i++) {
      const idx = (Math.random() * pos.count) | 0;
      tmp.fromBufferAttribute(pos, idx);
      if (normal) {
        nrm.fromBufferAttribute(normal, idx).normalize();
        tmp.addScaledVector(nrm, 0.004 + Math.random() * 0.004);
      }
      mesh.localToWorld(tmp);
      if (space) space.worldToLocal(tmp);
      positions.push(tmp.x, tmp.y, tmp.z);
      seeds.push(Math.random());
      sizes.push(0.35 + Math.random() * 0.85);
      const c = new THREE.Color(SPARKLE_COLORS[(Math.random() * SPARKLE_COLORS.length) | 0]);
      colors.push(c.r, c.g, c.b);
    }
    budget -= n;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
  geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
  geo.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: uniforms.uTime,
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uOpacity: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      attribute float aSize;
      attribute vec3  aColor;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3  vColor;
      varying float vTwinkle;

      void main() {
        vColor = aColor;
        float tw = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * 3.1 + aSeed * 43.0), 3.0);
        vTwinkle = tw;

        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * (0.65 + 0.55 * tw) * (26.0 / max(-mv.z, 0.05));
        gl_PointSize = clamp(gl_PointSize, 1.0, 13.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3  vColor;
      varying float vTwinkle;

      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float d = length(p);
        // 4-point star + soft core
        float spikes =
            pow(max(0.0, 1.0 - abs(p.x * 4.0)), 9.0) * pow(max(0.0, 1.0 - abs(p.y)), 2.0)
          + pow(max(0.0, 1.0 - abs(p.y * 4.0)), 9.0) * pow(max(0.0, 1.0 - abs(p.x)), 2.0);
        float core = smoothstep(0.55, 0.0, d);
        float a = clamp(spikes * 1.15 + core, 0.0, 1.0) * vTwinkle * uOpacity;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vColor * (0.55 + core * 0.9), a * 0.9);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, material);
  points.renderOrder = 5;
  return points;
}

/* -------------------------------------------------------------------------- */
/*  studio lighting that matches the Blender rig                              */
/* -------------------------------------------------------------------------- */

export function setupValentineStudio(renderer, scene) {
  scene.background = new THREE.Color(0x08060a);
  scene.environment = null;

  const key = new THREE.DirectionalLight(0xffd2e4, 1.35);
  key.position.set(1.6, 2.2, 1.4);

  const rim = new THREE.DirectionalLight(0x9ff7dc, 1.15);
  rim.position.set(-1.8, 0.9, -1.6);

  const kiss = new THREE.PointLight(0xffc46b, 3.0, 4, 2);
  kiss.position.set(0.2, -0.35, 0.8);

  const fill = new THREE.HemisphereLight(0x5a2740, 0x120509, 0.55);

  scene.add(key, rim, kiss, fill);

  // soft pink/mint reflections so the metal panels have something to mirror
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x140a12);
  const panel = (color, intensity, pos, scale) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    );
    m.material.color.multiplyScalar(intensity);
    m.position.set(...pos);
    m.scale.set(scale[0], scale[1], 1);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  };
  panel(0xffc0d8, 2.2, [3, 2, 2], [5, 3]);
  panel(0x9ff7dc, 1.4, [-3, 1, -2], [4, 3]);
  panel(0xffd9a0, 1.1, [0, -2.5, 1], [5, 2]);

  const env = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = env;
  pmrem.dispose();

  return { key, rim, kiss, fill };
}
