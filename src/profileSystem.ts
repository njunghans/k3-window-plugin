/**
 * Realistic Window Profile System
 *
 * This module creates window frames using path extrusion:
 * - Profile cross-sections (L-shaped for outer frame, T-shaped for mullions)
 * - Path generation based on window structure
 * - ExtrudeGeometry for realistic frame construction
 */

import * as THREE from "three";
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
 * Profile structure (cross-section view):
 *  ___________  ← head of T at full frame depth (for glass rebates on both sides)
 * |           |
 * |_____  ____|  
 *       ||       ← stem of T at inner rebate depth (central support)
 *       ||
 */
export function createMullionProfile(config: ProfileConfig): THREE.Shape {
  const mm = 0.001;

  const width = (config.width || 60) * mm;
  const depth = (config.depth || 70) * mm;
  
  const stemWidth = width * 0.4; // Central stem is 40% of total width
  const stemDepth = depth * 0.3; // Stem depth matches rebate depth (30%)
  const headDepth = depth; // Head extends to full frame depth

  const shape = new THREE.Shape();

  // Create T-shape starting from bottom-left of stem
  const halfWidth = width / 2;
  const halfStem = stemWidth / 2;

  // Bottom of stem (centered, narrower)
  shape.moveTo(-halfStem, 0);
  shape.lineTo(halfStem, 0); // Bottom edge of stem
  shape.lineTo(halfStem, stemDepth); // Right edge of stem going up
  
  // Transition to head (right side) - head is wider and extends to full depth
  shape.lineTo(halfWidth, stemDepth); // Extend right to full head width
  shape.lineTo(halfWidth, headDepth); // Right edge of head going up to full depth
  
  // Top of head at full depth
  shape.lineTo(-halfWidth, headDepth); // Top edge across
  
  // Left side of head
  shape.lineTo(-halfWidth, stemDepth); // Left edge of head going down
  
  // Transition back to stem (left side)
  shape.lineTo(-halfStem, stemDepth); // Come back in to stem width
  shape.lineTo(-halfStem, 0); // Left edge of stem going down
  
  // Shape closes automatically back to start point

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

// Sash clearance: total gap between sash and outer frame opening (split evenly on all sides)
export const SASH_CLEARANCE = 0.003; // 3mm total

// ============================================================================
// Extrusion & Assembly
// ============================================================================

/**
 * Create outer frame by extruding L-shaped profile along 4 segments
 * Returns array of 4 geometries in standard orientation (extruded along Z)
 * Positioning/rotation should be handled at the mesh/group level
 */
export function createFrameFromProfile(
  outerWidth: number,
  outerHeight: number,
  profileWidth: number,
  profileDepth: number,
): THREE.BufferGeometry[] {
  const mm = 0.001;
  const w = outerWidth * mm;
  const h = outerHeight * mm;
  const pw = profileWidth * mm; // profile width in meters

  // Create L-shaped profile cross-section
  const lProfile = createLShapeProfileCrossSection(profileWidth, profileDepth);

  const geometries: THREE.BufferGeometry[] = [];

  // CORNER JOINT STRATEGY:
  // - Vertical segments (left/right) extend FULL HEIGHT
  // - Horizontal segments (top/bottom) FIT BETWEEN verticals: width - 2*profileWidth
  // All segments extruded along +Z axis; positioning/rotation in Window.tsx

  // BOTTOM SEGMENT: length = width - 2*profileWidth (fits between verticals)
  const bottomGeo = new THREE.ExtrudeGeometry(lProfile, {
    depth: w - 2 * pw,
    bevelEnabled: false,
  });
  geometries.push(bottomGeo);

  // TOP SEGMENT: length = width - 2*profileWidth (fits between verticals)
  const topGeo = new THREE.ExtrudeGeometry(lProfile, {
    depth: w - 2 * pw,
    bevelEnabled: false,
  });
  geometries.push(topGeo);

  // LEFT SEGMENT: length = full height
  const leftGeo = new THREE.ExtrudeGeometry(lProfile, {
    depth: h,
    bevelEnabled: false,
  });
  geometries.push(leftGeo);

  // RIGHT SEGMENT: length = full height
  const rightGeo = new THREE.ExtrudeGeometry(lProfile, {
    depth: h,
    bevelEnabled: false,
  });
  geometries.push(rightGeo);

  return geometries;
}

/**
 * Create individual sash frame by extruding stepped profile along 4 segments
 * Returns array of 4 geometries in standard orientation (extruded along Z)
 * Positioning/rotation should be handled at the mesh/group level
 *
 * REFACTORED: Now accepts ProfileConfig for realistic profile generation
 */
export function createSashFrame(
  outerWidth: number,
  outerHeight: number,
  profileConfig: ProfileConfig,
): THREE.BufferGeometry[] {
  const mm = 0.001;
  const w = outerWidth * mm;
  const h = outerHeight * mm;

  // Get sash profile dimensions
  const outerFrameWidth = profileConfig.width || 60;
  const depth = profileConfig.depth || 70;

  // Sash profile width (70% of outer frame profile)
  const sashProfileWidth = outerFrameWidth * mm * 0.7;

  // Create clearance so sash fits inside opening
  // Real windows have 2-3mm clearance on each side for operation
  const clearance = SASH_CLEARANCE; // 3mm total clearance
  const actualWidth = w - clearance;
  const actualHeight = h - clearance;

  // Create stepped sash profile cross-section
  const steppedProfile = createSteppedSashProfileCrossSection(
    outerFrameWidth,
    depth * 0.9, // Sash depth is 90% of frame depth
  );

  const geometries: THREE.BufferGeometry[] = [];

  // CORNER JOINT STRATEGY (same as outer frame):
  // - Vertical stiles (left/right) extend FULL HEIGHT
  // - Horizontal rails (top/bottom) FIT BETWEEN stiles: width - 2*sashProfileWidth
  // All segments extruded along +Z axis; positioning/rotation in Window.tsx

  // BOTTOM SEGMENT: length = actualWidth - 2*sashProfileWidth (fits between stiles)
  const bottomGeo = new THREE.ExtrudeGeometry(steppedProfile, {
    depth: actualWidth - 2 * sashProfileWidth,
    bevelEnabled: false,
  });
  geometries.push(bottomGeo);

  // TOP SEGMENT: length = actualWidth - 2*sashProfileWidth (fits between stiles)
  const topGeo = new THREE.ExtrudeGeometry(steppedProfile, {
    depth: actualWidth - 2 * sashProfileWidth,
    bevelEnabled: false,
  });
  geometries.push(topGeo);

  // LEFT SEGMENT: length = actualHeight (full height)
  const leftGeo = new THREE.ExtrudeGeometry(steppedProfile, {
    depth: actualHeight,
    bevelEnabled: false,
  });
  geometries.push(leftGeo);

  // RIGHT SEGMENT: length = actualHeight (full height)
  const rightGeo = new THREE.ExtrudeGeometry(steppedProfile, {
    depth: actualHeight,
    bevelEnabled: false,
  });
  geometries.push(rightGeo);

  return geometries;
}

/**
 * Create Pfosten (vertical mullion) geometry
 * Returns geometry in standard orientation (extruded along Z-axis)
 * Positioning/rotation should be handled at the mesh/group level
 *
 * @param heightMm - Inner height in mm (excluding top/bottom frame)
 * @param profileConfig - Profile configuration
 * @returns BufferGeometry for the Pfosten, extruded along +Z axis
 */
export function createPfosten(
  heightMm: number,
  profileConfig: ProfileConfig,
): THREE.BufferGeometry {
  const mm = 0.001;
  const height = heightMm * mm;

  // Use T-shaped mullion profile (same as used for structural dividers)
  const mullionProfile = createMullionProfile(profileConfig);

  // Extrude along +Z axis to create vertical mullion
  const extrudeSettings = {
    depth: height,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(mullionProfile, extrudeSettings);

  // Return geometry in standard orientation - caller handles positioning
  return geometry;
}

/**
 * Create complete frame geometry for a window
 * Returns structure with outer frame segments and sash frame segments
 */
export function createCompleteFrame(
  widthMm: number,
  heightMm: number,
  paneCount: number,
  profileConfig: ProfileConfig,
): {
  outerFrameSegments: THREE.BufferGeometry[];
  sashFrameSegments: THREE.BufferGeometry[][];
} {
  const outerProfileWidth = profileConfig.width || 60;
  const outerProfileDepth = profileConfig.depth || 70;

  const mm = 0.001;
  const w = widthMm * mm;
  const h = heightMm * mm;
  const fw = outerProfileWidth * mm;

  // Inner dimensions (inside outer frame)
  const innerWidth = w - fw * 2;
  const innerHeight = h - fw * 2;

  // Create outer frame as 4 separate segments
  const outerFrameSegments = createFrameFromProfile(
    widthMm,
    heightMm,
    outerProfileWidth,
    outerProfileDepth,
  );

  // Create individual sash frames for each glass section
  const sashFrameSegments: THREE.BufferGeometry[][] = [];

  if (paneCount === 1) {
    // Single sash covering entire inner area
    const sashSegments = createSashFrame(
      innerWidth / mm,
      innerHeight / mm,
      profileConfig,
    );
    sashFrameSegments.push(sashSegments);
  } else {
    // Multiple sashes side by side
    const sashWidth = innerWidth / paneCount;

    for (let i = 0; i < paneCount; i++) {
      const sashSegments = createSashFrame(
        sashWidth / mm,
        innerHeight / mm,
        profileConfig,
      );
      sashFrameSegments.push(sashSegments);
    }
  }

  return { outerFrameSegments, sashFrameSegments };
}

// ============================================================================
// Glass Pane Generation
// ============================================================================

/**
 * Calculate the Z-position for glass surface
 * This ensures consistent positioning for glass, visualization lines, and buttons
 * 
 * @param profileConfig - Profile configuration containing depth
 * @param glassThicknessMm - Glass thickness in mm (default 24mm for double glazing)
 * @returns Z-position in meters for the glass center
 */
export function calculateGlassZPosition(
  profileConfig: ProfileConfig,
  glassThicknessMm: number = 24,
): number {
  const mm = 0.001;
  const frameDepth = (profileConfig.depth || 70) * mm;
  const thickness = glassThicknessMm * mm;
  
  // Position glass inside the sash frame depth
  // Sash sits at -15% of frame depth, glass sits in the middle of sash depth
  const sashZOffset = -frameDepth * 0.15;
  const sashDepth = frameDepth * 0.6;
  const glassZ = sashZOffset - sashDepth * 0.5 + thickness / 2;
  
  return glassZ;
}

/**
 * Calculate the Z-position for the front face of the glass
 * This is where visualization lines and buttons should be positioned
 * 
 * @param profileConfig - Profile configuration containing depth
 * @param glassThicknessMm - Glass thickness in mm (default 24mm for double glazing)
 * @returns Z-position in meters for the glass front surface
 */
export function calculateGlassFrontZPosition(
  profileConfig: ProfileConfig,
  glassThicknessMm: number = 24,
): number {
  const mm = 0.001;
  const thickness = glassThicknessMm * mm;
  const glassZ = calculateGlassZPosition(profileConfig, glassThicknessMm);
  
  // Front surface is at glass center + half thickness
  return glassZ + thickness / 2;
}

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
  openingConfigs?: { type: string }[], // Optional opening configs to determine fixed vs operable
): THREE.BufferGeometry[] {
  const mm = 0.001;
  const w = widthMm * mm;
  const h = heightMm * mm;
  const outerFw = (profileConfig.width || 60) * mm;
  const thickness = glassThicknessMm * mm;

  // Sash profile width
  const sashFw = outerFw * 0.7;

  // Inner dimensions (inside outer frame)
  const innerWidth = w - outerFw * 2;
  const innerHeight = h - outerFw * 2;

  // Use shared glass Z-position calculation
  const glassZ = calculateGlassZPosition(profileConfig, glassThicknessMm);

  const geometries: THREE.BufferGeometry[] = [];

  if (paneCount === 1) {
    // Single pane
    const isFixed = openingConfigs?.[0]?.type === "fixed";
    // For fixed: glass fills entire inner area (no sash frame)
    // For operable: glass sits inside sash frame
    const glassWidth = isFixed ? innerWidth : innerWidth - sashFw * 2;
    const glassHeight = isFixed ? innerHeight : innerHeight - sashFw * 2;
    const geom = new THREE.BoxGeometry(glassWidth, glassHeight, thickness);
    // Only translate in Z - X/Y positioning handled in Window.tsx
    geom.translate(0, 0, glassZ);
    geometries.push(geom);
  } else {
    // Multiple panes
    const sashWidth = innerWidth / paneCount;

    for (let i = 0; i < paneCount; i++) {
      const isFixed = openingConfigs?.[i]?.type === "fixed";
      // For fixed: glass fills entire sash area (no sash frame)
      // For operable: glass sits inside sash frame
      const glassWidth = isFixed ? sashWidth : sashWidth - sashFw * 2;
      const glassHeight = isFixed ? innerHeight : innerHeight - sashFw * 2;
      const geom = new THREE.BoxGeometry(glassWidth, glassHeight, thickness);
      // Only translate in Z - X positioning handled in Window.tsx
      geom.translate(0, 0, glassZ);
      geometries.push(geom);
    }
  }

  return geometries;
}
