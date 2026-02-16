import * as THREE from "three";
import type { WindowConfiguration } from "./types";

// ============================================================================
// Profile Shapes (2D)
// ============================================================================

/**
 * Create a 2D profile shape for the frame cross-section
 * This represents the cross-section that will be extruded along the frame path
 */
export function createProfileShape(): THREE.Shape {
  const shape = new THREE.Shape();

  // Simple rectangular profile - can be extended with more complex shapes
  // This is the outer rectangle
  const profileWidth = 15; // mm
  const profileHeight = 15; // mm

  shape.moveTo(0, 0);
  shape.lineTo(profileWidth, 0);
  shape.lineTo(profileWidth, profileHeight);
  shape.lineTo(0, profileHeight);
  shape.lineTo(0, 0);

  // Create a hole for the inner part (hollow frame)
  const holePath = new THREE.Path();
  const holeInset = 3; // mm
  holePath.moveTo(holeInset, holeInset);
  holePath.lineTo(profileWidth - holeInset, holeInset);
  holePath.lineTo(profileWidth - holeInset, profileHeight - holeInset);
  holePath.lineTo(holeInset, profileHeight - holeInset);
  holePath.lineTo(holeInset, holeInset);

  shape.holes.push(holePath);

  return shape;
}

// ============================================================================
// Frame Geometry
// ============================================================================

interface FrameGeometryInput {
  width: number;
  height: number;
  frameWidth: number; // Profile width
}

/**
 * Build frame geometry as a simple box geometry
 * In a production system, this would be more sophisticated with profile extrusion
 */
export function buildFrameGeometry(
  input: FrameGeometryInput,
): THREE.BufferGeometry {
  const { width, height, frameWidth } = input;

  // Create frame as separate edge pieces
  const geometry = new THREE.BoxGeometry(width, height, frameWidth);

  return geometry;
}

// ============================================================================
// Glass Geometry
// ============================================================================

interface GlassGeometryInput {
  width: number;
  height: number;
  frameWidth: number;
  paneCount: number;
  glazingThickness?: number;
}

/**
 * Build glass pane geometry/geometries
 */
export function buildGlassGeometry(
  input: GlassGeometryInput,
): THREE.BufferGeometry | THREE.BufferGeometry[] {
  const { width, height, frameWidth, paneCount, glazingThickness = 6 } = input;

  const innerWidth = width - frameWidth * 2;
  const innerHeight = height - frameWidth * 2;

  if (paneCount === 1) {
    // Single pane centered
    const geometry = new THREE.PlaneGeometry(innerWidth, innerHeight);
    geometry.translate(0, 0, frameWidth / 2 + glazingThickness / 2);
    return geometry;
  }

  // Multiple panes
  const geometries: THREE.BufferGeometry[] = [];
  const paneWidth = (innerWidth - frameWidth * (paneCount - 1)) / paneCount;

  for (let i = 0; i < paneCount; i++) {
    const geometry = new THREE.PlaneGeometry(paneWidth, innerHeight);
    const xOffset =
      innerWidth / 2 -
      frameWidth / 2 -
      i * (paneWidth + frameWidth) -
      paneWidth / 2;
    geometry.translate(xOffset, 0, frameWidth / 2 + glazingThickness / 2);
    geometries.push(geometry);
  }

  return geometries;
}

// ============================================================================
// Muntins (Sprossen) Geometry
// ============================================================================

interface MuntinsGeometryInput {
  width: number;
  height: number;
  frameWidth: number;
  rows: number;
  columns: number;
  muntinWidth: number;
}

/**
 * Build muntins (sprossen) geometry for grid pattern
 */
export function buildMuntinsGeometryGrid(
  input: MuntinsGeometryInput,
): THREE.BufferGeometry[] {
  const { width, height, frameWidth, rows, columns, muntinWidth } = input;

  const innerWidth = width - frameWidth * 2;
  const innerHeight = height - frameWidth * 2;

  const geometries: THREE.BufferGeometry[] = [];

  // Horizontal muntins
  if (rows > 0) {
    const spacingY = innerHeight / (rows + 1);
    for (let i = 1; i <= rows; i++) {
      const geometry = new THREE.PlaneGeometry(innerWidth, muntinWidth);
      const yOffset = innerHeight / 2 - i * spacingY;
      geometry.translate(0, yOffset, frameWidth / 2 + 3);
      geometries.push(geometry);
    }
  }

  // Vertical muntins
  if (columns > 0) {
    const spacingX = innerWidth / (columns + 1);
    for (let i = 1; i <= columns; i++) {
      const geometry = new THREE.PlaneGeometry(muntinWidth, innerHeight);
      const xOffset = -(innerWidth / 2) + i * spacingX;
      geometry.translate(xOffset, 0, frameWidth / 2 + 3);
      geometries.push(geometry);
    }
  }

  return geometries;
}

/**
 * Build muntins for cross pattern
 */
export function buildMuntinsGeometryCross(
  input: MuntinsGeometryInput,
): THREE.BufferGeometry[] {
  const { width, height, frameWidth, muntinWidth } = input;

  const innerWidth = width - frameWidth * 2;
  const innerHeight = height - frameWidth * 2;

  const geometries: THREE.BufferGeometry[] = [];

  // Single horizontal and vertical cross
  const horizontalGeometry = new THREE.PlaneGeometry(innerWidth, muntinWidth);
  horizontalGeometry.translate(0, 0, frameWidth / 2 + 3);
  geometries.push(horizontalGeometry);

  const verticalGeometry = new THREE.PlaneGeometry(muntinWidth, innerHeight);
  verticalGeometry.translate(0, 0, frameWidth / 2 + 3);
  geometries.push(verticalGeometry);

  return geometries;
}

// ============================================================================
// Handle Positioning
// ============================================================================

export function calculateHandlePosition(
  windowConfig: WindowConfiguration,
): [number, number, number] {
  // Position handle at center-right of the window
  const x = windowConfig.width / 2 - 50; // 50mm from right edge
  const y = windowConfig.height / 2; // Center height
  const z = windowConfig.profile.width + 10; // In front of frame

  return [x, y, z];
}

// ============================================================================
// Helper: Create combined geometry from multiple geometries
// ============================================================================

export function mergeGeometries(
  geometries: THREE.BufferGeometry[],
): THREE.BufferGeometry {
  if (geometries.length === 0) {
    return new THREE.BufferGeometry();
  }

  if (geometries.length === 1) {
    return geometries[0];
  }

  // Merge all geometries into one
  const merged = geometries[0].clone();

  for (let i = 1; i < geometries.length; i++) {
    // This is a simplified approach; in production you might use BufferGeometryUtils.mergeGeometries
    // For now, we'll just return the first geometry (array handling done at component level)
  }

  return merged;
}
