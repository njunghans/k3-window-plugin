/**
 * Realistic Window Profile System
 *
 * This module creates window frames using path extrusion:
 * - Profile cross-sections (L-shaped for outer frame, T-shaped for mullions)
 * - Path generation based on window structure
 * - ExtrudeGeometry for realistic frame construction
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ProfileConfig } from "./types";

// ============================================================================
// Profile Cross-Section Shapes
// ============================================================================

/**
 * Create L-shaped outer frame profile cross-section
 * Based on standard PVC/Aluminum window profiles
 *
 * Profile structure (side view, depth × width):
 *  ___________  ← totalWidth (60mm)
 * |           |
 * |     ______| ← rebate step
 * |    |
 * |____|       ← totalDepth (70mm)
 *
 * The L-shape creates a rebate where the sash fits
 */
function createLShapeProfileCrossSection(
  totalWidth: number,
  totalDepth: number,
): THREE.Shape {
  const mm = 0.001;
  const w = totalWidth * mm;
  const d = totalDepth * mm;

  // Rebate dimensions (where sash overlaps)
  const rebateWidth = w * 0.3; // Inner ledge is 30% of width (~18mm)
  const rebateDepth = d * 0.3; // Rebate depth is 30% of total depth (~21mm)

  // Create L-shape in 2D (will be extruded along frame segments)
  const shape = new THREE.Shape();

  // Start at bottom-left, trace L-shape clockwise
  shape.moveTo(0, 0); // Bottom-left corner
  shape.lineTo(w, 0); // Bottom edge (full width)
  shape.lineTo(w, d - rebateDepth); // Right edge up to rebate
  shape.lineTo(w - rebateWidth, d - rebateDepth); // Rebate horizontal step
  shape.lineTo(w - rebateWidth, d); // Inner vertical edge
  shape.lineTo(0, d); // Top edge
  shape.lineTo(0, 0); // Left edge back to start

  return shape;
}

/**
 * Create T-shaped mullion profile cross-section
 * Used for vertical dividers between glass panes
 *
 * Profile structure:
 *  ____  ____
 * |    ||    | <- glass rebates on both sides
 * |    ||    |
 * |____||____|
 *      ||      <- central stem
 */
export function createMullionProfile(config: ProfileConfig): THREE.Shape {
  const mm = 0.001;

  const width = (config.width || 60) * mm;
  const depth = (config.depth || 70) * mm;
  const stemWidth = width * 0.3; // Central stem is ~30% of total
  // const rebateWidth = (width - stemWidth) / 2;

  const shape = new THREE.Shape();

  // Create symmetric T-shape centered at origin
  const halfWidth = width / 2;
  const halfStem = stemWidth / 2;

  // Start bottom-left
  shape.moveTo(-halfWidth, 0);
  shape.lineTo(-halfStem, 0); // Bottom left to stem
  shape.lineTo(-halfStem, depth * 0.7); // Stem up
  shape.lineTo(-halfWidth, depth * 0.7); // Left rebate horizontal
  shape.lineTo(-halfWidth, depth); // Left rebate up
  shape.lineTo(halfWidth, depth); // Top across
  shape.lineTo(halfWidth, depth * 0.7); // Right rebate down
  shape.lineTo(halfStem, depth * 0.7); // Right rebate horizontal
  shape.lineTo(halfStem, 0); // Stem down
  shape.lineTo(halfWidth, 0); // Bottom right
  shape.lineTo(-halfWidth, 0); // Bottom back to start

  return shape;
}

/**
 * Create realistic sash profile cross-section
 * Stepped design that fits inside outer frame rebate when closed
 *
 * Profile anatomy (side view):
 *
 *    Front (Outside)              Back (Inside)
 *         |                            |
 *  ┌──────┴────────┐                  │
 *  │               │  ← Front face    │
 *  │  ┌─────────┐  │  ← Glass rebates │
 *  │  │         │  │                  │
 *  └──┴─────────┴──┴──────────────────┘
 *     │                               │
 *     └─ Overlap section              └─ Back edge
 *        (fits into outer rebate)
 *
 * When closed, the overlap section sits inside the outer frame's rebate,
 * creating a realistic seal.
 */
export function createSashProfile(config: ProfileConfig): THREE.Shape {
  const mm = 0.001;

  const outerFrameWidth = (config.width || 60) * mm;
  const depth = (config.depth || 70) * mm;

  // Sash dimensions based on outer frame
  const sashTotalWidth = outerFrameWidth * 0.7; // 70% of outer frame (42mm for 60mm frame)
  const frontFaceWidth = sashTotalWidth * 0.85; // Visible section when closed (35.7mm)
  const overlapDepth = depth * 0.2; // How far it extends into outer rebate (14mm)
  const glassRebateWidth = sashTotalWidth * 0.3; // Glass rebate on each side (12.6mm)
  const glassRebateDepth = depth * 0.25; // Depth of glass rebate (17.5mm)

  const shape = new THREE.Shape();

  // Build profile from bottom-left, going clockwise
  // Bottom edge (back of profile)
  shape.moveTo(0, 0);

  // Right edge - three sections: back, overlap, front
  // 1. Back section (flat, no overlap yet)
  shape.lineTo(sashTotalWidth, 0);

  // 2. Step up to overlap section
  shape.lineTo(sashTotalWidth, depth - overlapDepth);

  // 3. Step in to create front face
  const frontFaceStart = (sashTotalWidth - frontFaceWidth) / 2;
  shape.lineTo(sashTotalWidth - frontFaceStart, depth - overlapDepth);

  // 4. Front face right edge
  shape.lineTo(sashTotalWidth - frontFaceStart, depth);

  // Top edge with glass rebates
  // Right glass rebate
  shape.lineTo(sashTotalWidth - frontFaceStart - glassRebateWidth, depth);
  shape.lineTo(
    sashTotalWidth - frontFaceStart - glassRebateWidth,
    depth - glassRebateDepth,
  );

  // Center section (between rebates)
  shape.lineTo(frontFaceStart + glassRebateWidth, depth - glassRebateDepth);
  shape.lineTo(frontFaceStart + glassRebateWidth, depth);

  // Left glass rebate
  shape.lineTo(frontFaceStart, depth);

  // 5. Front face left edge
  shape.lineTo(frontFaceStart, depth - overlapDepth);

  // 6. Step back out for overlap section
  shape.lineTo(0, depth - overlapDepth);

  // 7. Back to start
  shape.lineTo(0, 0);

  return shape;
}

/**
 * Create stepped sash profile cross-section for extrusion
 * Simpler stepped design with front face narrower than back
 *
 * Profile structure (side view, depth × width):
 *  ________  ← frontFaceWidth (narrower)
 * |        |
 * |________|__ ← step
 * |            | ← backWidth (wider, full sash width)
 * |____________|
 *   totalDepth
 */
function createSteppedSashProfileCrossSection(
  totalWidth: number,
  totalDepth: number,
): THREE.Shape {
  const mm = 0.001;
  const sashWidth = totalWidth * mm * 0.7; // Sash is 70% of outer frame
  const d = totalDepth * mm;

  // Front section is narrower (creates step for visual depth)
  const frontFaceWidth = sashWidth * 0.85; // 85% of sash width
  const backDepth = d * 0.4; // Back section is 40% of depth

  const widthDiff = (sashWidth - frontFaceWidth) / 2;

  // Create stepped profile in 2D
  const shape = new THREE.Shape();

  // Start at bottom-left (back section - wider)
  shape.moveTo(0, 0);
  shape.lineTo(sashWidth, 0); // Bottom edge (full sash width)
  shape.lineTo(sashWidth, backDepth); // Right edge of back section
  shape.lineTo(sashWidth - widthDiff, backDepth); // Step in
  shape.lineTo(sashWidth - widthDiff, d); // Right edge of front section
  shape.lineTo(widthDiff, d); // Top edge (front section)
  shape.lineTo(widthDiff, backDepth); // Left edge of front section
  shape.lineTo(0, backDepth); // Step out
  shape.lineTo(0, 0); // Left edge back to start

  return shape;
}

/**
 * Create simple rectangular profile for testing
 */
export function createSimpleRectProfile(
  width: number,
  depth: number,
): THREE.Shape {
  const mm = 0.001;
  const w = width * mm;
  const d = depth * mm;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(w, 0);
  shape.lineTo(w, d);
  shape.lineTo(0, d);
  shape.lineTo(0, 0);

  return shape;
}

// ============================================================================
// Path Generation
// ============================================================================

/**
 * Create complete outer frame as single continuous path
 * Forms a rectangle with proper corners
 */
export function createOuterFramePath(
  width: number,
  height: number,
): THREE.Shape {
  const mm = 0.001;
  const w = width * mm;
  const h = height * mm;

  const shape = new THREE.Shape();

  // Create rectangular outer path
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(w / 2, h / 2);
  shape.lineTo(-w / 2, h / 2);
  shape.lineTo(-w / 2, -h / 2);

  return shape;
}

/**
 * Generate mullion paths (vertical dividers)
 * For 2-pane window: 1 mullion in center
 * For 3-pane window: 2 mullions at 1/3 and 2/3
 * (Currently unused - simplified to box geometry mullions)
 */
export function generateMullionPaths(
  width: number,
  height: number,
  paneCount: number,
  frameWidth: number,
): THREE.CurvePath<THREE.Vector3>[] {
  if (paneCount <= 1) return [];

  const mm = 0.001;
  const w = width * mm;
  const h = height * mm;
  const fw = frameWidth * mm;

  // Inner dimensions (inside outer frame)
  const innerHeight = h - fw * 2;
  const paths: THREE.CurvePath<THREE.Vector3>[] = [];

  // Calculate mullion positions
  const mullionCount = paneCount - 1;
  const paneWidth = w / paneCount;

  for (let i = 1; i <= mullionCount; i++) {
    const x = -w / 2 + i * paneWidth;

    const path = new THREE.CurvePath<THREE.Vector3>();
    path.add(
      new THREE.LineCurve3(
        new THREE.Vector3(x, -innerHeight / 2, 0),
        new THREE.Vector3(x, innerHeight / 2, 0),
      ),
    );
    paths.push(path);
  }

  return paths;
}

// ============================================================================
// Extrusion & Assembly
// ============================================================================

/**
 * Create outer frame by extruding L-shaped profile along 4 segments
 * Extrudes L-shaped cross-section along top, bottom, left, right edges
 */
export function createFrameFromProfile(
  outerWidth: number,
  outerHeight: number,
  profileWidth: number,
  profileDepth: number,
): THREE.BufferGeometry {
  const mm = 0.001;
  const w = outerWidth * mm;
  const h = outerHeight * mm;

  // Create L-shaped profile cross-section
  const lProfile = createLShapeProfileCrossSection(profileWidth, profileDepth);

  const geometries: THREE.BufferGeometry[] = [];

  // Profile coordinate system:
  // X = profile width (across the frame)
  // Y = profile depth (front to back)
  // Extrusion will be along Z-axis initially, then rotated

  // BOTTOM SEGMENT: Extrude along X-axis (width)
  // Final: extrusion along X, profile width along +Z, profile depth along +Y
  const bottomGeo = new THREE.ExtrudeGeometry(lProfile, {
    depth: w,
    bevelEnabled: false,
  });
  // After extrusion: profile in XY plane, extruded along Z
  // Rotate so extrusion goes along X: rotate around Y by -90°
  bottomGeo.rotateY(-Math.PI / 2);
  // Now: extrusion along X, profile X along -Z, profile Y along Y
  // Rotate around X to fix profile orientation
  bottomGeo.rotateX(Math.PI / 2);
  // Now: extrusion along X, profile width along Y, profile depth along Z
  // Need profile depth along Y, width along Z, so rotate around X again
  bottomGeo.rotateX(-Math.PI / 2);
  bottomGeo.rotateZ(-Math.PI / 2);
  // Position at bottom
  bottomGeo.translate(-w / 2, -h / 2, 0);
  geometries.push(bottomGeo);

  // TOP SEGMENT: Similar to bottom but flipped and at top
  const topGeo = new THREE.ExtrudeGeometry(lProfile, {
    depth: w,
    bevelEnabled: false,
  });
  topGeo.rotateY(-Math.PI / 2);
  topGeo.rotateZ(Math.PI / 2);
  topGeo.translate(-w / 2, h / 2, 0);
  geometries.push(topGeo);

  // LEFT SEGMENT: Extrude along Y-axis (height)
  const leftGeo = new THREE.ExtrudeGeometry(lProfile, {
    depth: h,
    bevelEnabled: false,
  });
  leftGeo.rotateZ(Math.PI);
  leftGeo.rotateX(Math.PI / 2);
  leftGeo.translate(-w / 2, -h / 2, 0);
  geometries.push(leftGeo);

  // RIGHT SEGMENT: Similar to left but mirrored and at right
  const rightGeo = new THREE.ExtrudeGeometry(lProfile, {
    depth: h,
    bevelEnabled: false,
  });
  rightGeo.rotateX(Math.PI / 2);
  rightGeo.translate(w / 2, -h / 2, 0);
  geometries.push(rightGeo);

  // Merge all 4 segments into single geometry
  const mergedGeo = mergeGeometries(geometries);
  if (!mergedGeo) {
    console.warn("Failed to merge frame geometries, using first segment");
    return geometries[0];
  }

  return mergedGeo;
}

/**
 * Create individual sash frame by extruding stepped profile along 4 segments
 * Extrudes stepped cross-section along top, bottom, left, right edges
 *
 * REFACTORED: Now accepts ProfileConfig for realistic profile generation
 */
export function createSashFrame(
  outerWidth: number,
  outerHeight: number,
  profileConfig: ProfileConfig,
): THREE.BufferGeometry {
  const mm = 0.001;
  const w = outerWidth * mm;
  const h = outerHeight * mm;

  // Get sash profile dimensions
  const outerFrameWidth = profileConfig.width || 60;
  const depth = profileConfig.depth || 70;

  // Create clearance so sash fits inside opening
  // Real windows have 2-3mm clearance on each side for operation
  const clearance = 0.003; // 3mm total clearance
  const actualWidth = w - clearance;
  const actualHeight = h - clearance;

  // Create stepped sash profile cross-section
  const steppedProfile = createSteppedSashProfileCrossSection(
    outerFrameWidth,
    depth * 0.9, // Sash depth is 90% of frame depth
  );

  const geometries: THREE.BufferGeometry[] = [];

  // BOTTOM SEGMENT: Extrude stepped profile along width
  const bottomGeo = new THREE.ExtrudeGeometry(steppedProfile, {
    depth: actualWidth,
    bevelEnabled: false,
  });
  bottomGeo.rotateY(-Math.PI / 2);
  bottomGeo.rotateZ(-Math.PI / 2);
  bottomGeo.translate(-actualWidth / 2, -actualHeight / 2, 0);
  geometries.push(bottomGeo);

  // TOP SEGMENT: Extrude stepped profile along width (flipped)
  const topGeo = new THREE.ExtrudeGeometry(steppedProfile, {
    depth: actualWidth,
    bevelEnabled: false,
  });
  topGeo.rotateY(-Math.PI / 2);
  topGeo.rotateZ(Math.PI / 2);
  topGeo.translate(-actualWidth / 2, actualHeight / 2, 0);
  geometries.push(topGeo);

  // LEFT SEGMENT: Extrude stepped profile along height
  const leftGeo = new THREE.ExtrudeGeometry(steppedProfile, {
    depth: actualHeight,
    bevelEnabled: false,
  });
  leftGeo.rotateZ(Math.PI);
  leftGeo.rotateX(Math.PI / 2);
  leftGeo.translate(-actualWidth / 2, -actualHeight / 2, 0);
  geometries.push(leftGeo);

  // RIGHT SEGMENT: Extrude stepped profile along height (flipped)
  const rightGeo = new THREE.ExtrudeGeometry(steppedProfile, {
    depth: actualHeight,
    bevelEnabled: false,
  });
  rightGeo.rotateX(Math.PI / 2);
  rightGeo.translate(actualWidth / 2, -actualHeight / 2, 0);
  geometries.push(rightGeo);

  // Merge all 4 segments into single geometry
  const mergedGeo = mergeGeometries(geometries);
  if (!mergedGeo) {
    console.warn("Failed to merge sash geometries, using first segment");
    return geometries[0];
  }

  return mergedGeo;
}

/**
 * Create Pfosten (vertical mullion) geometry
 * Pfosten provides structural support between sashes
 *
 * @param heightMm - Full window height in mm
 * @param profileConfig - Profile configuration
 * @param xPosition - X position in meters where Pfosten should be placed
 * @returns BufferGeometry for the Pfosten at specified position
 */
export function createPfosten(
  heightMm: number,
  profileConfig: ProfileConfig,
  xPosition: number,
): THREE.BufferGeometry {
  const mm = 0.001;
  const width = (profileConfig.width || 60) * mm;
  const depth = (profileConfig.depth || 70) * mm;
  const height = heightMm * mm;

  // Create Pfosten using ExtrudeGeometry - same approach as the frame
  // Create a rectangular vertical shape
  const shape = new THREE.Shape();

  // Vertical rectangle centered at origin in XY plane
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  shape.moveTo(-halfWidth, -halfHeight);
  shape.lineTo(halfWidth, -halfHeight);
  shape.lineTo(halfWidth, halfHeight);
  shape.lineTo(-halfWidth, halfHeight);
  shape.lineTo(-halfWidth, -halfHeight);

  // Extrude to create 3D Pfosten - same settings as frame
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Apply same transformation as frame: translate by half depth in Z
  // Then position at specified X location
  geometry.translate(xPosition, 0, depth / 2);

  return geometry;
}

/**
 * Create complete frame geometry for a window
 * Returns array of geometries for outer frame and sash frames
 */
export function createCompleteFrame(
  widthMm: number,
  heightMm: number,
  paneCount: number,
  profileConfig: ProfileConfig,
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];

  const outerProfileWidth = profileConfig.width || 60;
  const outerProfileDepth = profileConfig.depth || 70;

  const mm = 0.001;
  const w = widthMm * mm;
  const h = heightMm * mm;
  const fw = outerProfileWidth * mm;

  // Inner dimensions (inside outer frame)
  const innerWidth = w - fw * 2;
  const innerHeight = h - fw * 2;

  // Create outer frame as single piece
  const outerFrame = createFrameFromProfile(
    widthMm,
    heightMm,
    outerProfileWidth,
    outerProfileDepth,
  );
  geometries.push(outerFrame);

  // Create individual sash frames for each glass section
  // Return them centered at origin - positioning handled in Window.tsx for rotation
  if (paneCount === 1) {
    // Single sash covering entire inner area
    const sash = createSashFrame(
      innerWidth / mm,
      innerHeight / mm,
      profileConfig, // Pass full config for realistic profile
    );
    // Position sash to create realistic seal with outer frame
    // Sash depth is 90% of frame, offset to align front faces
    // This creates appearance of sash fitting into frame rebate
    sash.translate(0, 0, outerProfileDepth * mm * 0.6);
    geometries.push(sash);
  } else {
    // Multiple sashes side by side
    const sashWidth = innerWidth / paneCount;

    for (let i = 0; i < paneCount; i++) {
      const sash = createSashFrame(
        sashWidth / mm,
        innerHeight / mm,
        profileConfig, // Pass full config for realistic profile
      );

      // Position sash to align front faces with outer frame
      sash.translate(0, 0, outerProfileDepth * mm * 0.6);
      geometries.push(sash);
    }
  }

  return geometries;
}

// ============================================================================
// Glass Pane Generation
// ============================================================================

/**
 * Create glass panes with proper thickness and positioning
 * Glass sits inside each sash frame
 */
export function createGlassPanes(
  widthMm: number,
  heightMm: number,
  paneCount: number,
  profileConfig: ProfileConfig,
  glassThicknessMm: number = 24, // Double glazing typical 24mm
): THREE.BufferGeometry[] {
  const mm = 0.001;
  const w = widthMm * mm;
  const h = heightMm * mm;
  const outerFw = (profileConfig.width || 60) * mm;
  const thickness = glassThicknessMm * mm;
  const frameDepth = (profileConfig.depth || 70) * mm;

  // Sash profile width
  const sashFw = outerFw * 0.7;

  // Inner dimensions (inside outer frame)
  const innerWidth = w - outerFw * 2;
  const innerHeight = h - outerFw * 2;

  // Position glass in front of sash frames
  const glassZ = frameDepth + frameDepth * 0.1 + thickness / 2;

  const geometries: THREE.BufferGeometry[] = [];

  if (paneCount === 1) {
    // Single pane - inside sash frame
    const glassWidth = innerWidth - sashFw * 2;
    const glassHeight = innerHeight - sashFw * 2;
    const geom = new THREE.BoxGeometry(glassWidth, glassHeight, thickness);
    // Only translate in Z - X/Y positioning handled in Window.tsx
    geom.translate(0, 0, glassZ);
    geometries.push(geom);
  } else {
    // Multiple panes
    const sashWidth = innerWidth / paneCount;
    const glassWidth = sashWidth - sashFw * 2;
    const glassHeight = innerHeight - sashFw * 2;

    for (let i = 0; i < paneCount; i++) {
      const geom = new THREE.BoxGeometry(glassWidth, glassHeight, thickness);
      // Only translate in Z - X positioning handled in Window.tsx
      geom.translate(0, 0, glassZ);
      geometries.push(geom);
    }
  }

  return geometries;
}
