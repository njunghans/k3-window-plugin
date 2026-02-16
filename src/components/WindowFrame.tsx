import * as THREE from "three";
import type { WindowConfiguration } from "../types";

/**
 * Create frame materials based on configuration
 */
export function createFrameMaterials(config: WindowConfiguration) {
  return {
    outside: new THREE.MeshStandardMaterial({
      color: config.frame.colorOutside,
      roughness: 0.1,
      metalness: 0.05,
    }),
    inside: new THREE.MeshStandardMaterial({
      color: config.frame.colorInside,
      roughness: 0.1,
      metalness: 0.05,
    }),
  };
}
