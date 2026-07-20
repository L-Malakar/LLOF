/*
 *  scene-setup.js — THREE.js Scene, Camera, Renderer, Lights
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.module.js';
import { Controller }  from '../systems/controller.js';
import { MController } from '../systems/Mcontroller.js';
import { CameraRig, initCameraUI, CameraWheel } from '../systems/camera.js';
import { SKIN_CONFIGS } from '../systems/world.js';
import { state } from './state.js';
import { isMobile } from '../utils/utils.js';

export const activeController = isMobile ? MController : Controller;

export const scene    = new THREE.Scene();
export const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
export const renderer = new THREE.WebGLRenderer({ antialias: !isMobile });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Camera rig — multiple selectable angles (button + 'R' key) ─────
export const cameraRig   = new CameraRig();
export const cameraWheel = new CameraWheel(cameraRig);
initCameraUI(cameraRig, () =>
  (state.gameState === 'PLAYING' || state.gameState === 'CRASHING'),
  cameraWheel
);

// ── Lighting ─────────────────────────────────────────────────────
export const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.5);
scene.add(hemiLight);
export const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);
export const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
rimLight.position.set(-5, 2, -3);
scene.add(rimLight);
export const fillLight = new THREE.DirectionalLight(0xffffff, 0.0);
fillLight.position.set(0, 3, 5);
scene.add(fillLight);

// ── Apply the current map's skin to scene-level properties ─────────
export function applyMapToScene() {
  const cfg = SKIN_CONFIGS[state.currentMap];
  document.body.classList.remove('skin-classic', 'skin-night', 'skin-beach');
  document.body.classList.add('skin-' + state.currentMap);
  scene.background = new THREE.Color(cfg.bg);
  scene.fog = new THREE.Fog(cfg.fogColor, cfg.fogNear, cfg.fogFar);
  rimLight.color.setHex(cfg.rimLight.color);
  rimLight.intensity = cfg.rimLight.intensity;
  hemiLight.color.setHex(cfg.hemiLight.sky);
  hemiLight.groundColor.setHex(cfg.hemiLight.ground);
  hemiLight.intensity = cfg.hemiLight.intensity;
  // Sun light: disabled on beach (no blazing directional sun), on for others
  if (state.currentMap === 'beach') {
    dirLight.intensity  = 0.0;
    fillLight.color.setHex(0xff9060);
    fillLight.intensity = 0.35;
  } else {
    dirLight.intensity  = 0.9;
    fillLight.intensity = 0.0;
  }
}
applyMapToScene();