/**
 * onepieceSkin.js — three.js look-dev for the Zombie Slayer "Straw Hat" skin.
 *
 * Matches the Blender render: chipped red/indigo painted steel, brass trim,
 * rope-wrapped bands, ukiyo-e wave panels and a straw-hat Jolly Roger.
 *
 * Usage (see preview_onepiece.html for a runnable page):
 *
 *   const skin = new OnePieceSkin({ basePath: './tex/sea3123_zombieslayer' });
 *   await skin.load();
 *   const model = await loadGlb('zombie_slayer_onepiece.glb');
 *   skin.apply(model);
 *   scene.add(model);
 */

import * as THREE from 'three';

const DEFAULTS = {
  normalScale: 0.9,
  clearcoat: 0.25,
  clearcoatRoughness: 0.35,
  aoIntensity: 0.7,
  envIntensity: 1.0,
};

export class OnePieceSkin {
  constructor(opts = {}) {
    this.opts = { ...DEFAULTS, ...opts };
    this.textures = {};
    this.materials = [];
  }

  async load() {
    const base = this.opts.basePath ?? './tex/sea3123_zombieslayer';
    const loader = new THREE.TextureLoader();
    const want = {
      map: ['skin_onepiece_diff.png', THREE.SRGBColorSpace],
      normalMap: ['skin_onepiece_norm.png', THREE.NoColorSpace],
      orm: ['skin_onepiece_orm.png', THREE.NoColorSpace],
    };
    await Promise.all(
      Object.entries(want).map(async ([key, [file, space]]) => {
        const tex = await loader.loadAsync(`${base}/${file}`);
        tex.flipY = false;                       // glTF UV convention
        tex.colorSpace = space;
        tex.anisotropy = this.opts.anisotropy ?? 8;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        this.textures[key] = tex;
      })
    );
    return this;
  }

  createMaterial() {
    const o = this.opts;
    const t = this.textures;
    const mat = new THREE.MeshPhysicalMaterial({
      map: t.map ?? null,
      normalMap: t.normalMap ?? null,
      normalScale: new THREE.Vector2(o.normalScale, o.normalScale),
      roughnessMap: t.orm ?? null,
      metalnessMap: t.orm ?? null,
      aoMap: t.orm ?? null,
      aoMapIntensity: o.aoIntensity,
      roughness: 1.0,          // multiplied by the ORM green channel
      metalness: 1.0,          // multiplied by the ORM blue channel
      clearcoat: o.clearcoat,
      clearcoatRoughness: o.clearcoatRoughness,
      envMapIntensity: o.envIntensity,
    });
    this.materials.push(mat);
    return mat;
  }

  apply(root) {
    const mat = this.createMaterial();
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      const prev = obj.material;
      obj.material = mat;
      if (prev && prev.side !== undefined) mat.side = prev.side;
      obj.frustumCulled = true;
    });
    return root;
  }
}

/** Warm ship-deck studio: sun key, sea-cool fill, brass bounce. */
export function setupPirateStudio(renderer, scene) {
  scene.background = new THREE.Color(0x0a0c10);

  const key = new THREE.DirectionalLight(0xffe7c4, 3.0);
  key.position.set(1.6, 2.2, 1.4);

  const fill = new THREE.DirectionalLight(0x9dbcd8, 0.85);
  fill.position.set(-1.7, 0.7, -1.2);

  const rim = new THREE.DirectionalLight(0xffc98a, 1.2);
  rim.position.set(-0.4, 1.2, -1.9);

  const hemi = new THREE.HemisphereLight(0x6d88a8, 0x1a1008, 0.7);
  scene.add(key, fill, rim, hemi);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0b0d12);
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
  panel(0xffd9a0, 2.4, [3, 2, 2], [5, 3]);
  panel(0x8fb6d8, 1.2, [-3, 1, -2], [4, 3]);
  panel(0x2b6f86, 0.9, [0, -2.5, 1], [5, 2]);

  scene.environment = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();

  return { key, fill, rim, hemi };
}
