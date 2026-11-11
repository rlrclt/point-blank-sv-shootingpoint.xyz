/**
 * pirateSkin.js — three.js look-dev for the Zombie Slayer "Pirate" skin.
 *
 * Uses a full hand-painted atlas as the diffuse; normal + ORM come from the
 * same paint (ORM: brass = metal, everything else = painted).
 *
 * Usage (see preview_pirate.html):
 *
 *   const skin = new PirateSkin({ basePath: './tex/sea3123_zombieslayer' });
 *   await skin.load();
 *   const model = await loadGlb('zombie_slayer_pirate.glb');
 *   skin.apply(model);
 */

import * as THREE from 'three';

const DEFAULTS = {
  normalScale: 0.85,
  clearcoat: 0.22,
  clearcoatRoughness: 0.42,
  aoIntensity: 0.65,
  envIntensity: 1.0,
};

export class PirateSkin {
  constructor(opts = {}) {
    this.opts = { ...DEFAULTS, ...opts };
    this.textures = {};
    this.materials = [];
  }

  async load() {
    const base = this.opts.basePath ?? './tex/sea3123_zombieslayer';
    const loader = new THREE.TextureLoader();
    const want = {
      map: ['skin_pirate_diff.png', THREE.SRGBColorSpace],
      normalMap: ['skin_pirate_norm.png', THREE.NoColorSpace],
      orm: ['skin_pirate_orm.png', THREE.NoColorSpace],
    };
    await Promise.all(
      Object.entries(want).map(async ([key, [file, space]]) => {
        const tex = await loader.loadAsync(`${base}/${file}`);
        tex.flipY = false;
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
      roughness: 1.0,
      metalness: 1.0,
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
      // the cloth hilt wrap, the mounted ship and the katana keep their own materials from the glb
      if (obj.name === 'HandleWrap' || obj.name === 'ShipRaw' ||
          obj.name.startsWith('ZoroKatana') || obj.name.startsWith('KatanaGrip') ||
          (obj.material && (obj.material.name === 'wrap_cloth' || /^Material\.\d+$/.test(obj.material.name) || /^material[._]/.test(obj.material.name)))) return;
      const prev = obj.material;
      obj.material = mat;
      if (prev && prev.side !== undefined) mat.side = prev.side;
      obj.frustumCulled = true;
    });
    return root;
  }
}

/** Warm deck studio: sun key, sea fill, brass bounce. */
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
