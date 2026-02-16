import * as THREE from "three";
import type { WindowConfiguration } from "../types";

/**
 * Create glass materials based on configuration
 */
export function createGlassMaterial(config: WindowConfiguration) {
  return new THREE.MeshStandardMaterial({
    color: config.glass.color,
    transparent: true,
    opacity: 0.02,
    metalness: 0.0,
    roughness: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
