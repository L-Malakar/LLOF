/**
 * ═══════════════════════════════════════════════════════════════
 *  world.js — WorldManager
 *  Manages terrain chunks, obstacles, progressive difficulty, map skins.
 * ═══════════════════════════════════════════════════════════════
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.module.js';

// ── Obstacle catalogue ────────────────────────────────────────
const OBSTACLE_DEFS = [
  { tier: 0, make: () => new THREE.BoxGeometry(1.2, 10, 1.2)             },
  { tier: 0, make: () => new THREE.SphereGeometry(1.1, 8, 8)             },
  { tier: 0, make: () => new THREE.ConeGeometry(1.3, 4, 8)               },
  { tier: 0, make: () => new THREE.CylinderGeometry(0.5, 0.5, 6, 8)     },
  { tier: 1, make: () => new THREE.BoxGeometry(5, 0.6, 0.6)              },
  { tier: 1, make: () => new THREE.TorusGeometry(1.4, 0.35, 8, 16)      },
  { tier: 1, make: () => new THREE.OctahedronGeometry(1.2, 0)            },
  { tier: 2, make: () => new THREE.TorusKnotGeometry(0.9, 0.28, 80, 12) },
  { tier: 2, make: () => new THREE.BoxGeometry(0.6, 8, 4)               },
  { tier: 2, make: () => new THREE.IcosahedronGeometry(1.1, 0)          },
  { tier: 3, make: () => new THREE.DodecahedronGeometry(1.2, 0)         },
  { tier: 3, make: () => new THREE.BoxGeometry(3, 3, 0.5)               },
  { tier: 3, make: () => new THREE.CylinderGeometry(2, 0.3, 5, 6)      },
];

// ── Map skin configurations ────────────────────────────────────
export const SKIN_CONFIGS = {
  classic: {
    label: 'CLASSIC',
    desc:  'Original neon void',
    price: 0,
    img: 'https://yt3.ggpht.com/kG4oRn-w3vaKb5JPH4ocCTRIBszKJL1Axis4tiNNTqXkLLvObjEf6a_UH1bsCPZnyRcCjco04OXHtLQ=s640-c-fcrop64=1,38130000c7ecffff-rw-nd-v1',
    bg:        0x030508,
    fogColor:  0x030508,
    fogNear:   6,
    fogFar:    60,
    gridColor1: 0x00ff88,
    gridColor2: 0x0a0f0a,
    gridDiv:   20,
    colors: [0xff2255, 0xff00cc, 0xff8800, 0x00ccff, 0xffff00, 0xcc00ff, 0x00ffcc],
    emissiveIntensity: 0.6,
    spinMult:     1.0,
    hasGround:    false,
    hasStars:     false,
    baseDensity:  { mobile: 6, desktop: 12 },
    rimLight:   { color: 0x00ccff, intensity: 0.4 },
    hemiLight:  { sky: 0xc8e6ff, ground: 0x1a2a1a, intensity: 0.5 },
  },
  night: {
    label: 'NIGHT',
    desc:  'Deep space traverse',
    price: 800,
    img: 'https://yt3.ggpht.com/zAn-HG7qTNlHdvXCONin8aXkuoTlgtE_APljrNLP1yTiw4RDxBqOxKrCjwCPmbfK-kKGPEAjN_w=s640-c-fcrop64=1,38130000c7ecffff-rw-nd-v1',
    bg:        0x06090f,
    fogColor:  0x06090f,
    fogNear:   8,
    fogFar:    60,
    gridColor1: 0x0a2a3a,
    gridColor2: 0x080e16,
    gridDiv:   16,
    colors: [0x00e5ff, 0x00bcd4, 0x0097a7, 0x7c4dff, 0x651fff, 0xff1744],
    emissiveIntensity: 0.25,
    spinMult:     0.4,
    hasGround:    true,
    hasStars:     true,
    hasClouds:    true,
    baseDensity:  { mobile: 5, desktop: 9 },
    rimLight:   { color: 0x7c4dff, intensity: 0.35 },
    hemiLight:  { sky: 0x8eb8e0, ground: 0x0a1020, intensity: 0.45 },
  },
  beach: {
    label: 'BEACH SUNSET',
    desc:  'Golden shores at dusk',
    price: 1000,
    img: 'https://yt3.ggpht.com/VOJhGJOSZgjoAohXl08qRkRIthbu1_2qy8vJwJbypP9uHPQnHGVgpDRQkr2YN5_j_-iSadrN6qFwqRA=s640-c-fcrop64=1,3bb20000cb8bffff-rw-nd-v1',
    bg:        0xff4500,
    fogColor:  0xff4500,
    fogNear:   8,
    fogFar:    60,
    gridColor1: 0xd4845a,
    gridColor2: 0x1a0e08,
    gridDiv:   18,
    colors: [0xff6b35, 0xe9c46a, 0x2a9d8f, 0x48cae4, 0xffd166, 0xef233c, 0x06d6a0],
    emissiveIntensity: 0.55,
    spinMult:     0.6,
    hasGround:    false,
    hasSand:      true,
    hasStars:     false,
    hasClouds:    false,
    baseDensity:  { mobile: 5, desktop: 9 },
    rimLight:   { color: 0xff9f68, intensity: 0.5 },
    hemiLight:  { sky: 0xff7f50, ground: 0x1a0a00, intensity: 0.55 },
  },
};

export class WorldManager {
  constructor(scene, isMobile = false, skinId = 'night') {
    this.scene     = scene;
    this.chunks    = [];
    this.obstacles = [];
    this.chunkSize = 40;
    this.isMobile  = isMobile;
    this.distance  = 0;
    this.skin      = SKIN_CONFIGS[skinId] || SKIN_CONFIGS.night;

    // ── Ground plane ───────────────────────────────────────────
    if (this.skin.hasGround) {
      const groundGeo = new THREE.PlaneGeometry(400, 400);
      let groundMat;
      if (this.skin.hasSand) {
        // Beach: gradient from sand near camera to ocean blue far away
        groundMat = new THREE.MeshStandardMaterial({
          color: 0xb5724a, roughness: 0.85, metalness: 0.0,
          emissive: 0x3d1a00, emissiveIntensity: 0.15,
        });
      } else {
        groundMat = new THREE.MeshStandardMaterial({
          color: 0x060a10, roughness: 0.95, metalness: 0.05,
        });
      }
      this.ground = new THREE.Mesh(groundGeo, groundMat);
      this.ground.rotation.x = -Math.PI / 2;
      this.ground.position.y = -0.05;
      this.scene.add(this.ground);

      // Ocean plane (beach only) — sits just below sand, offset forward
      if (this.skin.hasSand) {
        const seaGeo = new THREE.PlaneGeometry(400, 200);
        const seaMat = new THREE.MeshStandardMaterial({
          color: 0x8b2500, roughness: 0.05, metalness: 0.6,
          transparent: true, opacity: 0.88,
          emissive: 0x4a1000, emissiveIntensity: 0.3,
        });
        this.sea = new THREE.Mesh(seaGeo, seaMat);
        this.sea.rotation.x = -Math.PI / 2;
        this.sea.position.set(0, -0.04, -100);
        this.scene.add(this.sea);
      } else {
        this.sea = null;
      }
    } else {
      this.ground = null;
      this.sea    = null;
    }

    // ── Star field ─────────────────────────────────────────────
    if (this.skin.hasStars) {
      const starCount = this.isMobile ? 500 : 1500;
      const starPos   = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPos[i]   = (Math.random() - 0.5) * 160;
        starPos[i+1] = Math.random() * 50 + 5;
        starPos[i+2] = (Math.random() - 0.5) * 300 - 60;
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0xc8d8e8, size: 0.12, sizeAttenuation: true,
        transparent: true, opacity: 0.55,
      });
      this.stars = new THREE.Points(starGeo, starMat);
      this.scene.add(this.stars);
    } else {
      this.stars = null;
    }

    // ── Cloud layer (one InstancedMesh = one draw call) ─────────
    if (this.skin.hasClouds) {
      const puffsPerCloud = 4; // fixed, so total instance count is predictable
      const cloudCount    = this.isMobile ? 12 : 24;
      const totalCopies   = 5; // tile offsets: -2,-1,0,1,2 (matches cloudTile below)
      const instanceCount = cloudCount * puffsPerCloud * totalCopies;

      const puffGeo = new THREE.SphereGeometry(1, 7, 5); // unit sphere, scaled per-instance
      const puffMat = new THREE.MeshStandardMaterial({
        color: 0xfff5e4, transparent: true, opacity: 0.6,
        roughness: 1, metalness: 0,
      });

      this.cloudMesh = new THREE.InstancedMesh(puffGeo, puffMat, instanceCount);
      this.cloudMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // Per-cloud (not per-puff) data needed for animation each frame.
      this.cloudData = [];
      const dummy = new THREE.Object3D();
      const cloudTileWidth = 80;
      let instanceIdx = 0;

      for (let i = 0; i < cloudCount; i++) {
        const baseX  = (Math.random() - 0.5) * cloudTileWidth;
        const y      = 18 + Math.random() * 10;
        const z      = -20 - Math.random() * 120;
        const speed  = 0.008 + Math.random() * 0.012;

        // Puff layout relative to this cloud's own center (generated once,
        // reused identically across all 5 tile copies of this cloud).
        const puffLayout = [];
        for (let p = 0; p < puffsPerCloud; p++) {
          const r = 0.8 + Math.random() * 1.2;
          puffLayout.push({
            r,
            ox: (Math.random() - 0.5) * r * 2.5,
            oy: (Math.random() - 0.5) * r * 0.5,
            oz: (Math.random() - 0.5) * r,
          });
        }

        const copyInstanceIndices = [];
        [-2, -1, 0, 1, 2].forEach(xIdx => {
          const copyBaseX = baseX + xIdx * cloudTileWidth;
          puffLayout.forEach(puff => {
            dummy.position.set(copyBaseX + puff.ox, y + puff.oy, z + puff.oz);
            dummy.scale.setScalar(puff.r);
            dummy.updateMatrix();
            this.cloudMesh.setMatrixAt(instanceIdx, dummy.matrix);
            copyInstanceIndices.push(instanceIdx);
            instanceIdx++;
          });
        });

        this.cloudData.push({
          baseX, y, z, speed, puffLayout,
          instanceIndices: copyInstanceIndices, // 5 copies × puffsPerCloud entries
        });
      }

      this.cloudMesh.instanceMatrix.needsUpdate = true;
      this.scene.add(this.cloudMesh);
    } else {
      this.cloudMesh = null;
      this.cloudData = null;
    }

    // Seed initial chunks ahead of the camera
    for (let i = 0; i < 8; i++) {
      this.chunks.push(this._createChunk(-i * this.chunkSize));
    }

    // ── Sun (Beach only) ──────────────────────────────────────
    if (skinId === 'beach') {
      this._buildSun();
    } else {
      this.sunGroup = null;
    }
  }

  // ── Build 3D sun + rays ───────────────────────────────────────
  _buildSun() {
    this.sunGroup = new THREE.Group();
    // Position: far ahead, high up, slightly right — stays fixed in world space
    this.sunGroup.position.set(18, 22, -60);
    this.scene.add(this.sunGroup);

    // Sun core — bright white-yellow disc
    const coreGeo = new THREE.SphereGeometry(2.2, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfffbe6 });
    this.sunCore  = new THREE.Mesh(coreGeo, coreMat);
    this.sunGroup.add(this.sunCore);

    // Inner glow halo
    const halo1Geo = new THREE.SphereGeometry(3.8, 16, 16);
    const halo1Mat = new THREE.MeshBasicMaterial({
      color: 0xffcc44, transparent: true, opacity: 0.18,
    });
    this.sunGroup.add(new THREE.Mesh(halo1Geo, halo1Mat));

    // Outer glow halo
    const halo2Geo = new THREE.SphereGeometry(6.5, 16, 16);
    const halo2Mat = new THREE.MeshBasicMaterial({
      color: 0xff7700, transparent: true, opacity: 0.07,
    });
    this.sunGroup.add(new THREE.Mesh(halo2Geo, halo2Mat));

    // Sun rays — thin flat boxes radiating outward
    this._sunRayMeshes = [];
    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
      const angle  = (i / rayCount) * Math.PI * 2;
      const length = 14 + Math.random() * 16;
      const rayGeo = new THREE.PlaneGeometry(0.9 + Math.random() * 0.6, length);
      const rayMat = new THREE.MeshBasicMaterial({
        color: 0xffdd66, transparent: true,
        opacity: 0.18 + Math.random() * 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ray = new THREE.Mesh(rayGeo, rayMat);
      // Offset ray outward from sun centre so it starts at the edge
      ray.position.set(
        Math.cos(angle) * (4 + length / 2),
        Math.sin(angle) * (4 + length / 2),
        0
      );
      ray.rotation.z = angle + Math.PI / 2;
      this._sunRayMeshes.push(ray);
      this.sunGroup.add(ray);
    }

    // Point light emanating from sun position
    this.sunLight = new THREE.PointLight(0xff9933, 3.5, 300);
    this.sunLight.position.copy(this.sunGroup.position);
    this.scene.add(this.sunLight);
  }

  // ── Clean teardown ───────────────────────────────────────────
  dispose() {
    this.chunks.forEach(chunk => {
      chunk.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      this.scene.remove(chunk);
    });
    this.chunks = [];
    this.obstacles = [];

    if (this.ground) {
      this.ground.geometry.dispose();
      this.ground.material.dispose();
      this.scene.remove(this.ground);
      this.ground = null;
    }
    if (this.stars) {
      this.stars.geometry.dispose();
      this.stars.material.dispose();
      this.scene.remove(this.stars);
      this.stars = null;
    }
    if (this.sea) {
      this.sea.geometry.dispose();
      this.sea.material.dispose();
      this.scene.remove(this.sea);
      this.sea = null;
    }
    if (this.sunGroup) {
      this.sunGroup.children.forEach(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      this.scene.remove(this.sunGroup);
      this.sunGroup = null;
    }
    if (this.sunLight) {
      this.scene.remove(this.sunLight);
      this.sunLight = null;
    }

    if (this.cloudMesh) {
      this.cloudMesh.geometry.dispose();
      this.cloudMesh.material.dispose();
      this.scene.remove(this.cloudMesh);
      this.cloudMesh = null;
      this.cloudData = null;
    }
  }

  // ── Tier gating ───────────────────────────────────────────────
  _maxTier() {
    if (this.distance >= 1000) return 3;
    if (this.distance >= 500)  return 2;
    if (this.distance >= 200)  return 1;
    return 0;
  }

  // ── Chunk creation ─────────────────────────────────────────────
  _createChunk(zOffset) {
    const group      = new THREE.Group();
    const maxTier    = this._maxTier();
    const placements = this._generatePlacements(maxTier);

    for (let xIdx = -3; xIdx <= 3; xIdx++) {
      const grid = new THREE.GridHelper(
        this.chunkSize, this.skin.gridDiv,
        this.skin.gridColor1, this.skin.gridColor2
      );
      grid.position.x = xIdx * this.chunkSize;
      group.add(grid);

      placements.forEach(p => {
        const mesh = this._makeMesh(p, xIdx);
        if (mesh) { group.add(mesh); this.obstacles.push(mesh); }
      });
    }

    group.position.z = zOffset;
    this.scene.add(group);
    return group;
  }

  // ── Obstacle placement generator ──────────────────────────────
  _generatePlacements(maxTier) {
    const available   = OBSTACLE_DEFS.filter(d => d.tier <= maxTier);
    const densityMult = 1 + maxTier * 0.2;
    const count       = Math.floor(
      (this.isMobile ? this.skin.baseDensity.mobile : this.skin.baseDensity.desktop) * densityMult
    );
    const placements  = [];

    for (let i = 0; i < count; i++) {
      const def      = available[Math.floor(Math.random() * available.length)];
      const color    = this.skin.colors[Math.floor(Math.random() * this.skin.colors.length)];
      const catRoll  = Math.random();
      let   category = 'static';

      if      (catRoll > 0.96 && maxTier >= 2) category = 'impossible';
      else if (catRoll > 0.85 && maxTier >= 2) category = 'sweeping';
      else if (catRoll > 0.72 && maxTier >= 1) category = 'bobbing';
      else if (catRoll > 0.55 && maxTier >= 1) category = 'moving';
      else if (catRoll > 0.40) category = 'spinning';

      const yRel = Math.random() < 0.7
        ? 1.5 + Math.random() * 3.0
        : 0.5 + Math.random() * 4.5;

      placements.push({
        def, category, color,
        xRel:  Math.random() * this.chunkSize - this.chunkSize / 2,
        zRel:  Math.random() * this.chunkSize - this.chunkSize / 2,
        yRel:  yRel,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.4,
      });
    }
    return placements;
  }

  // ── Mesh factory ──────────────────────────────────────────────
  _makeMesh(p, xIdx) {
    const geo       = p.def.make();
    const styleRoll = Math.random();
    const ei        = this.skin.emissiveIntensity;
    let mat;

    if (styleRoll > 0.88) {
      mat = new THREE.MeshStandardMaterial({
        color: p.color, emissive: p.color, emissiveIntensity: ei + 0.1,
        wireframe: true, transparent: true, opacity: 0.55,
      });
    } else if (styleRoll > 0.76) {
      mat = new THREE.MeshStandardMaterial({
        color: p.color, emissive: p.color, emissiveIntensity: ei * 0.6,
        transparent: true, opacity: 0.28, flatShading: true,
      });
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: p.color, emissive: p.color, emissiveIntensity: ei,
        flatShading: true,
      });
    }

    const mesh  = new THREE.Mesh(geo, mat);
    const baseX = (xIdx * this.chunkSize) + p.xRel;

    mesh.userData = { category: p.category, phase: p.phase, speed: p.speed, baseY: p.yRel, baseX };
    mesh.position.set(baseX, p.yRel, p.zRel);
    return mesh;
  }

  // ── Per-frame update ──────────────────────────────────────────
  update(speed, worldShiftX, elapsed) {
    const sm = this.skin.spinMult;

    if (this.ground) {
      this.ground.position.z += speed;
      this.ground.position.x  = worldShiftX;
    }
    if (this.sea) {
      this.sea.position.z += speed;
      this.sea.position.x  = worldShiftX;
      // Gentle wave shimmer
      this.sea.material.opacity = 0.78 + Math.sin(elapsed * 1.4) * 0.06;
    }
    if (this.stars) {
      this.stars.position.z += speed * 0.12;
      this.stars.position.x  = worldShiftX * 0.3;
    }
    if (this.sunGroup) {
      const s = elapsed * 0.08;
      this._sunRayMeshes.forEach((ray, i) => {
        ray.material.opacity = 0.06 + Math.abs(Math.sin(s + i * 0.55)) * 0.09;
      });
      const pulse = 1 + Math.sin(elapsed * 1.2) * 0.04;
      this.sunCore.scale.setScalar(pulse);
    }

    if (this.cloudMesh) {
      const cloudTile = 80;
      const dummy = new THREE.Object3D();
      this.cloudData.forEach(cloud => {
        cloud.baseX -= cloud.speed * sm;
        if (cloud.baseX < -cloudTile * 3) cloud.baseX += cloudTile * 5;
        if (cloud.baseX >  cloudTile * 3) cloud.baseX -= cloudTile * 5;

        const shiftedX = cloud.baseX + worldShiftX * 0.4;
        const bobY     = cloud.y + Math.sin(elapsed * 0.4 + cloud.speed * 100) * 0.3;

        let i = 0;
        [-2, -1, 0, 1, 2].forEach(xIdx => {
          cloud.puffLayout.forEach(puff => {
            dummy.position.set(
              shiftedX + xIdx * cloudTile + puff.ox,
              bobY + puff.oy,
              cloud.z + puff.oz
            );
            dummy.scale.setScalar(puff.r);
            dummy.updateMatrix();
            this.cloudMesh.setMatrixAt(cloud.instanceIndices[i], dummy.matrix);
            i++;
          });
        });
      });
      this.cloudMesh.instanceMatrix.needsUpdate = true;
    }

    this.chunks.forEach(chunk => {
      chunk.position.z += speed;
      chunk.position.x  = worldShiftX;

      chunk.children.forEach(child => {
        if (child.type !== 'Mesh' || !child.userData.category) return;
        const ud = child.userData;

        child.rotation.y += 0.007 * sm;

        switch (ud.category) {
          case 'spinning':
            child.rotation.x += 0.015 * ud.speed * sm;
            child.rotation.z += 0.008 * sm;
            break;
          case 'moving':
            child.position.x = ud.baseX + Math.sin(elapsed * ud.speed + ud.phase) * 5;
            break;
          case 'bobbing':
            child.position.y = ud.baseY + Math.cos(elapsed * ud.speed + ud.phase) * 2;
            break;
          case 'sweeping':
            child.position.x = ud.baseX + Math.sin(elapsed * ud.speed + ud.phase) * 6;
            child.position.y = ud.baseY + Math.sin(elapsed * ud.speed * 2 + ud.phase) * 2;
            break;
          case 'impossible':
            child.rotation.x += 0.025 * sm;
            child.rotation.z += 0.018 * sm;
            child.position.x  = ud.baseX + Math.sin(elapsed * 3 + ud.phase) * 3;
            child.position.y  = ud.baseY + Math.cos(elapsed * 2.5 + ud.phase) * 1.5;
            break;
          default: break;
        }
      });

      // Recycle chunk
      if (chunk.position.z > this.chunkSize) {
        chunk.position.z -= this.chunkSize * this.chunks.length;

        const maxTier    = this._maxTier();
        const placements = this._generatePlacements(maxTier);

        const toRemove = chunk.children.filter(c => c.userData.category);
        toRemove.forEach(child => {
          const idx = this.obstacles.indexOf(child);
          if (idx !== -1) this.obstacles.splice(idx, 1);
          child.geometry.dispose();
          child.material.dispose();
          chunk.remove(child);
        });

        for (let xIdx = -3; xIdx <= 3; xIdx++) {
          placements.forEach(p => {
            const mesh = this._makeMesh(p, xIdx);
            if (mesh) { chunk.add(mesh); this.obstacles.push(mesh); }
          });
        }
      }
    });
  }
}
