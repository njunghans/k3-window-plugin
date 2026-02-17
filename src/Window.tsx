// @ts-nocheck
import type { DynamicModel } from "k3-plugin-api";
import { useMemo, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PROFILE_LIBRARY, OPENING_TYPES } from "./constants";
import {
  createCompleteFrame,
  createGlassPanes,
  createPfosten,
  SASH_CLEARANCE,
  calculateGlassFrontZPosition,
} from "./profileSystem";
import { createGlassMaterial } from "./components/WindowGlass";
import { OpeningVisualization } from "./components/OpeningVisualization";
import type { OpeningConfig } from "./types";

/**
 * Calculate transform for a Pfosten (vertical mullion)
 * Returns group position, mesh rotation, and mesh local position
 *
 * PFOSTEN NOTES:
 * - Uses T-shaped mullion profile extruded along +Z axis for full inner height
 * - Positioned vertically at boundaries between sashes
 * - Extends from bottom to top of inner area (excluding outer frame)
 * - Centered at origin in XY, needs rotation to stand vertical and positioning to correct X location
 */
function getPfostenTransform(
  xPosition: number,
  innerHeight: number,
  depth: number,
) {
  const h = innerHeight;
  const d = depth;

  // Pfosten is extruded along +Z, needs 90° rotation around X to stand vertical
  // Then position at specified X coordinate, centered vertically
  return {
    groupPosition: [xPosition, 0, 0] as [number, number, number],
    meshRotation: [-Math.PI / 2, 0, 0] as [number, number, number],
    meshPosition: [0, -h / 2, d / 2] as [number, number, number],
  };
}

/**
 * Calculate transform for a frame segment
 * Returns group position, mesh rotation, and mesh local position
 *
 * GEOMETRY NOTES:
 * - ExtrudeGeometry extrudes 2D cross-section (XY plane) along +Z axis from 0 to length
 * - Geometry is NOT centered - starts at origin (0,0,0) and extends to (0,0,length)
 * - We use nested groups: outer group sets world position, inner mesh handles rotation
 *
 * CORNER JOINT STRATEGY:
 * - Vertical segments (left/right jambs) extend FULL HEIGHT from bottom to top
 * - Horizontal segments (top/bottom) FIT BETWEEN verticals, shortened by 2*profileWidth
 * - This creates clean butt joints at corners
 *
 * ROTATION EXPLANATION:
 * - Bottom/Top: Rotate -90° around Y to align extrusion horizontally, then 180° around Z to flip orientation
 * - Left/Right: Rotate 90° around X to align extrusion vertically, then 180° around Z to face inward
 */
function getFrameSegmentTransform(
  segment: "bottom" | "top" | "left" | "right",
  width: number,
  height: number,
  depth: number,
  profileWidth: number,
) {
  const w = width;
  const h = height;
  const d = depth;
  const pw = profileWidth;

  switch (segment) {
    case "bottom":
      // Horizontal bar at bottom, fits between left and right verticals
      // Geometry pre-shortened to (width - 2*profileWidth) in profileSystem.ts
      // Profile extends DOWNWARD after rotation → shift group UP by depth to compensate
      return {
        groupPosition: [-w / 2 + pw, -h / 2, -d] as [number, number, number],
        meshRotation: [-Math.PI / 2, Math.PI / 2, Math.PI] as [
          number,
          number,
          number,
        ],
        meshPosition: [0, 0, d / 2] as [number, number, number],
      };
    case "top":
      // Horizontal bar at top, fits between left and right verticals
      // Profile extends DOWNWARD after rotation → correct for top (faces inward)
      return {
        groupPosition: [-w / 2 + pw, h / 2, -d] as [number, number, number],
        meshRotation: [-Math.PI / 2, -Math.PI / 2, Math.PI] as [
          number,
          number,
          number,
        ],
        meshPosition: [w - 2 * pw, 0, d / 2] as [number, number, number],
      };
    case "left":
      // Vertical bar on left, extends FULL HEIGHT
      // Profile extends LEFTWARD after rotation → shift group RIGHT by pw to compensate
      return {
        groupPosition: [-w / 2, -h / 2, -d] as [number, number, number],
        meshRotation: [Math.PI / 2, 0, 0] as [number, number, number],
        meshPosition: [0, h, d / 2] as [number, number, number],
        meshScale: [1, 1, 1] as [number, number, number],
      };
    case "right":
      // Vertical bar on right, extends FULL HEIGHT
      // Profile extends LEFTWARD after rotation → correct for right (faces inward toward center)
      return {
        groupPosition: [w / 2, -h / 2 - h, -d] as [number, number, number],
        meshRotation: [-Math.PI / 2, 0, Math.PI] as [number, number, number],
        meshPosition: [0, h, d / 2] as [number, number, number],
        meshScale: [1, 1, 1] as [number, number, number],
      };
  }
}

/**
 * Calculate transform for a sash frame segment
 * Similar to frame segment but with Z-offset for depth positioning
 *
 * SASH FRAME NOTES:
 * - Same corner joint strategy as outer frame:
 *   Vertical stiles = FULL HEIGHT, Horizontal rails = FIT BETWEEN stiles
 * - Geometry lengths are pre-shortened in profileSystem.ts
 * - sashProfileWidth = profileWidth * 0.7 (sash is 70% of outer frame)
 * - Different Z-rotation (Math.PI/2) to match sash profile orientation
 */
function getSashSegmentTransform(
  segment: "bottom" | "top" | "left" | "right",
  width: number,
  height: number,
  depth: number,
  zOffset: number,
  sashProfileWidth: number, // sash profile width for corner joint inset
) {
  // IMPORTANT: Geometry in profileSystem.ts subtracts SASH_CLEARANCE from both
  // width and height so the sash fits inside the outer frame opening.
  // Transforms must use the ACTUAL sash dimensions to match, otherwise gaps
  // appear at corners where geometry is shorter than expected.
  const aw = width - SASH_CLEARANCE; // actual sash width (matches geometry)
  const ah = height - SASH_CLEARANCE; // actual sash height (matches geometry)
  const d = depth;
  const spw = sashProfileWidth;

  switch (segment) {
    case "bottom":
      // Horizontal rail at bottom, fits between vertical stiles
      // Profile extends UPWARD after rotation → correct for bottom (faces inward)
      return {
        groupPosition: [-aw / 2 + spw, -ah / 2, zOffset] as [
          number,
          number,
          number,
        ],
        meshRotation: [0, -Math.PI / 2, Math.PI / 2] as [
          number,
          number,
          number,
        ],
        meshPosition: [aw - 2 * spw, 0, d / 2] as [number, number, number],
      };
    case "top":
      // Horizontal rail at top, fits between vertical stiles
      // Profile extends UPWARD after rotation → shift group DOWN by spw to compensate
      return {
        groupPosition: [-aw / 2 + spw, ah / 2 - spw, zOffset] as [
          number,
          number,
          number,
        ],
        meshRotation: [0, -Math.PI / 2, Math.PI / 2] as [
          number,
          number,
          number,
        ],
        meshPosition: [aw - 2 * spw, 0, d / 2] as [number, number, number],
      };
    case "left":
      // Vertical stile on left, extends FULL HEIGHT
      // Profile extends LEFTWARD after rotation → shift group RIGHT by spw to compensate
      return {
        groupPosition: [-aw / 2 + spw, -ah / 2, zOffset] as [
          number,
          number,
          number,
        ],
        meshRotation: [Math.PI / 2, 0, Math.PI] as [number, number, number],
        meshPosition: [0, ah, d / 2] as [number, number, number],
      };
    case "right":
      // Vertical stile on right, extends FULL HEIGHT
      // Profile extends LEFTWARD after rotation → correct for right (faces inward toward center)
      return {
        groupPosition: [aw / 2, -ah / 2, zOffset] as [number, number, number],
        meshRotation: [Math.PI / 2, 0, Math.PI] as [number, number, number],
        meshPosition: [0, ah, d / 2] as [number, number, number],
      };
  }
}

// Main dynamic window component
// Renders a window with dimensions in cm
const DynamicWindow = (props: any) => {
  // Position and rotation from K3
  const position = props.position || [0, 0, 0];
  const rotation = props.rotation || [0, 0, 0];
  const scale = props.scale || [1, 1, 1];

  // Track opening state for each sash
  const [sashOpenStates, setSashOpenStates] = useState<boolean[]>([]);
  const [sashRotations, setSashRotations] = useState<number[]>([]);
  // Track which mode is active for hybrid windows: 'dreh' or 'kipp'
  const [sashModes, setSashModes] = useState<("dreh" | "kipp")[]>([]);

  // Dimensions in cm (from K3's basic width, height, depth)
  // K3 provides these as scale multipliers, but we treat them as cm values
  const widthCm = props.width ? parseFloat(props.width) : 100;
  const heightCm = props.height ? parseFloat(props.height) : 120;
  const depthCm = props.depth ? parseFloat(props.depth) : 8;

  // Window configuration (custom props)
  const windowType = props.windowType ? parseInt(props.windowType) : 1;
  const profileChoice = props.profile ? parseInt(props.profile) : 2;
  const showOpeningVizChoice = props.showOpeningViz
    ? parseInt(props.showOpeningViz)
    : 1; // 1=yes, 2=no

  // Individual sash opening configurations
  const sash1OpeningChoice = props.sash1Opening
    ? parseInt(props.sash1Opening)
    : 5; // Default: dreh-kipp-links
  const sash2OpeningChoice = props.sash2Opening
    ? parseInt(props.sash2Opening)
    : 6; // Default: dreh-kipp-rechts
  const sash3OpeningChoice = props.sash3Opening
    ? parseInt(props.sash3Opening)
    : 5; // Default: dreh-kipp-links

  // Optional manual Pfosten control (0=auto, 1=no, 2=yes)
  const pfosten1Choice = props.pfosten1 ? parseInt(props.pfosten1) : 0;
  const pfosten2Choice = props.pfosten2 ? parseInt(props.pfosten2) : 0;

  // Map profile choice to profile library
  const profileKeys = ["minimal", "modern-slim", "modern-wide", "traditional"];
  const profileKey = profileKeys[profileChoice - 1] || "modern-slim";
  const profileConfig = PROFILE_LIBRARY[profileKey];

  // Map opening type choices to opening types
  const openingTypes = useMemo<OpeningType[]>(
    () => [
      "fixed",
      "kipp",
      "dreh-links",
      "dreh-rechts",
      "dreh-kipp-links",
      "dreh-kipp-rechts",
    ],
    [],
  );
  const showOpeningViz = showOpeningVizChoice === 1;

  // Materials - use K3 materials when available, fallback to defaults
  const frameOutsideMaterial = useMemo(
    () =>
      props.materials?.frameOutside ||
      new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.4,
        metalness: 0.1,
      }),
    [props.materials?.frameOutside],
  );

  const frameInsideMaterial = useMemo(
    () =>
      props.materials?.frameInside ||
      new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 0.3,
        metalness: 0.1,
      }),
    [props.materials?.frameInside],
  );

  const glassMaterial = useMemo(
    () =>
      props.materials?.glass ||
      createGlassMaterial({
        glass: {
          color: 0x88ddff,
        },
      }),
    [props.materials?.glass],
  );

  // Generate frame geometries using path extrusion
  const frameData = useMemo(
    () =>
      createCompleteFrame(
        widthCm * 10,
        heightCm * 10,
        windowType,
        profileConfig,
      ),
    [widthCm, heightCm, windowType, profileConfig],
  );

  // Configure opening for each sash based on individual settings
  const openingConfigs: OpeningConfig[] = useMemo(() => {
    const sashChoices = [
      sash1OpeningChoice,
      sash2OpeningChoice,
      sash3OpeningChoice,
    ];
    return Array.from({ length: windowType }, (_, i) => ({
      type: openingTypes[sashChoices[i] - 1] || "fixed",
    }));
  }, [
    windowType,
    sash1OpeningChoice,
    sash2OpeningChoice,
    sash3OpeningChoice,
    openingTypes,
  ]);

  // Generate glass panes with realistic thickness
  const glassGeometries = useMemo(
    () =>
      createGlassPanes(
        widthCm * 10,
        heightCm * 10,
        windowType,
        profileConfig,
        24, // 24mm double glazing
        openingConfigs, // Pass opening configs to determine fixed vs operable
      ),
    [widthCm, heightCm, windowType, profileConfig, openingConfigs],
  );

  // Calculate Pfosten requirements based on opening types
  const pfostenNeeds = useMemo(() => {
    const needs: boolean[] = [];

    for (let i = 0; i < windowType - 1; i++) {
      const leftSash = openingConfigs[i];
      const rightSash = openingConfigs[i + 1];

      // Check if left sash needs Pfosten on its right side
      const leftNeedsRight =
        leftSash.type === "fixed" || // Fixed needs support on all sides
        leftSash.type === "kipp" || // Kipp needs both sides
        leftSash.type === "dreh-rechts" || // Anchors right
        leftSash.type === "dreh-kipp-links" || // Hybrid needs both sides (can be Kipp mode)
        leftSash.type === "dreh-kipp-rechts"; // Hybrid needs both sides (can be Kipp mode)

      // Check if right sash needs Pfosten on its left side
      const rightNeedsLeft =
        rightSash.type === "fixed" || // Fixed needs support on all sides
        rightSash.type === "kipp" || // Kipp needs both sides
        rightSash.type === "dreh-links" || // Anchors left
        rightSash.type === "dreh-kipp-links" || // Hybrid needs both sides (can be Kipp mode)
        rightSash.type === "dreh-kipp-rechts"; // Hybrid needs both sides (can be Kipp mode)

      // Pfosten needed if either sash requires it
      let required = leftNeedsRight || rightNeedsLeft;

      // Apply manual override if provided (0=auto, 1=no, 2=yes)
      const manualSetting = i === 0 ? pfosten1Choice : pfosten2Choice;
      if (manualSetting === 1) {
        // User explicitly disabled
        required = false;
      } else if (manualSetting === 2) {
        // User explicitly enabled
        required = true;
      }
      // manualSetting === 0 means auto, keep calculated value

      needs[i] = required;
    }

    return needs;
  }, [openingConfigs, windowType, pfosten1Choice, pfosten2Choice]);

  // Create Pfosten geometry (single geometry reused for all positions)
  const pfostenGeometry = useMemo(() => {
    if (windowType === 1) return null; // Single pane, no Pfosten

    // Pfosten height should match inner height (exclude top/bottom frame)
    const innerHeightMm = heightCm * 10 - profileConfig.width * 2;
    return createPfosten(innerHeightMm, profileConfig);
  }, [windowType, heightCm, profileConfig]);

  // Calculate Pfosten positions based on requirements
  const pfostenPositions = useMemo(() => {
    if (windowType === 1) return []; // Single pane, no Pfosten

    const mm = 0.001;
    const innerWidth = widthCm * 10 * mm - profileConfig.width * mm * 2;
    const sashWidth = innerWidth / windowType;

    return pfostenNeeds
      .map((needed, i) => {
        if (!needed) return null;

        // Calculate X position for this Pfosten
        // Position at boundary between sashes
        const xPos = -innerWidth / 2 + sashWidth * (i + 1);
        return xPos;
      })
      .filter((pos): pos is number => pos !== null);
  }, [pfostenNeeds, widthCm, windowType, profileConfig]);

  // Animate opening/closing of sashes
  useFrame((state, delta) => {
    if (sashRotations.length === 0) return;

    const targetRotations = sashOpenStates.map((isOpen, index) => {
      if (!isOpen) return 0;

      const config = openingConfigs[index];
      if (!config) return 0;

      const mode = sashModes[index] || "dreh"; // Default to dreh mode

      // Different opening angles based on type and mode for hybrids
      // Dreh: Negative rotation for left hinge, positive for right hinge
      // Kipp: Tilts from bottom (positive rotation around X-axis to tilt inward)
      switch (config.type) {
        case "fixed":
          return 0;
        case "kipp":
          return Math.PI / 16; // 30 degrees tilt from bottom (positive = tilt inward)
        case "dreh-links":
          return -Math.PI * 0.6; // 60 degrees, left hinge swings right (negative Y rotation)
        case "dreh-rechts":
          return Math.PI * 0.6; // 60 degrees, right hinge swings left (positive Y rotation)
        case "dreh-kipp-links":
          // Hybrid: check mode
          if (mode === "kipp") {
            return Math.PI / 16; // 30 degrees tilt from bottom (kipp mode - inward)
          } else {
            return -Math.PI * 0.6; // 60 degrees swing from left (dreh mode)
          }
        case "dreh-kipp-rechts":
          // Hybrid: check mode
          if (mode === "kipp") {
            return Math.PI / 16; // 30 degrees tilt from bottom (kipp mode - inward)
          } else {
            return Math.PI * 0.6; // 60 degrees swing from right (dreh mode)
          }
        default:
          return 0;
      }
    });

    // Smooth animation
    setSashRotations((prev) =>
      prev.map((current, i) => {
        const target = targetRotations[i] || 0;
        const diff = target - current;
        if (Math.abs(diff) < 0.01) return target;
        return current + diff * delta * 3; // Speed of animation
      }),
    );
  });

  const handleSashOpenChange = (
    index: number,
    isOpen: boolean,
    mode: "dreh" | "kipp" = "dreh",
  ) => {
    const currentMode = sashModes[index] || "dreh";
    const currentOpen = sashOpenStates[index] || false;

    // If switching modes while open, close first then open in new mode
    if (currentOpen && currentMode !== mode) {
      // First, reset rotation to closed state immediately
      setSashRotations((prev) => {
        const newRotations = [...prev];
        newRotations[index] = 0;
        return newRotations;
      });

      // Switch mode and close
      setSashModes((prev) => {
        const newModes = [...prev];
        newModes[index] = mode;
        return newModes;
      });

      setSashOpenStates((prev) => {
        const newStates = [...prev];
        newStates[index] = false;
        return newStates;
      });

      // After a brief delay, open in the new mode
      setTimeout(() => {
        setSashOpenStates((prev) => {
          const newStates = [...prev];
          newStates[index] = true;
          return newStates;
        });
      }, 50);
    } else {
      // Same mode or not open: toggle normally
      setSashOpenStates((prev) => {
        const newStates = [...prev];
        newStates[index] = isOpen;
        return newStates;
      });

      // Set the mode
      setSashModes((prev) => {
        const newModes = [...prev];
        newModes[index] = mode;
        return newModes;
      });
    }
  };

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      userData={{ modelId: props.id }}
    >
      {/* Outer frame - 4 segments with nested groups for clean positioning */}
      <group name="outer-frame">
        {(["bottom", "top", "left", "right"] as const).map((segment, idx) => {
          const transform = getFrameSegmentTransform(
            segment,
            widthCm * 10 * 0.001,
            heightCm * 10 * 0.001,
            profileConfig.depth * 0.001,
            profileConfig.width * 0.001,
          );
          return (
            <group key={segment} position={transform.groupPosition}>
              <mesh
                geometry={frameData.outerFrameSegments[idx]}
                material={frameOutsideMaterial}
                rotation={transform.meshRotation}
                position={transform.meshPosition}
                scale={transform.meshScale || [1, 1, 1]}
                castShadow
                receiveShadow
              />
            </group>
          );
        })}
      </group>

      {/* Sash groups - each contains frame + glass + opening lines */}
      {frameData.sashFrameSegments.map((sashSegments, index) => {
        const mm = 0.001;
        const innerWidth = widthCm * 10 * mm - profileConfig.width * mm * 2;
        const innerHeight = heightCm * 10 * mm - profileConfig.width * mm * 2;
        const sashWidth =
          windowType === 1 ? innerWidth : innerWidth / windowType;

        // Initialize rotation state if needed
        if (sashRotations.length <= index) {
          setSashRotations((prev) => [...prev, 0]);
          setSashOpenStates((prev) => [...prev, false]);
          setSashModes((prev) => [...prev, "dreh"]); // Default to dreh mode
        }

        const currentRotation = sashRotations[index] || 0;
        const openingType = openingConfigs[index]?.type || "fixed";
        const currentMode = sashModes[index] || "dreh";
        const isFixed = openingType === "fixed";

        // Calculate glass dimensions
        // For fixed windows: glass fills entire inner area (no sash frame)
        // For operable windows: glass sits inside sash frame
        const sashProfileWidth = profileConfig.width * mm * 0.7;
        const glassWidth = isFixed
          ? sashWidth
          : sashWidth - sashProfileWidth * 2;
        const glassHeight = isFixed
          ? innerHeight
          : innerHeight - sashProfileWidth * 2;

        // Calculate glass front surface Z-position for visualization alignment
        const glassFrontZ = calculateGlassFrontZPosition(profileConfig, 24);

        // Calculate hinge position and sash offset based on opening type and mode
        let hingeX = 0; // Hinge position in world space (X)
        let hingeY = 0; // Hinge position in world space (Y)
        let sashOffsetX = 0; // Offset to position sash away from hinge
        let sashOffsetY = 0; // Offset to position sash away from hinge
        let rotationAxis: [number, number, number] = [0, 0, 0];

        // Calculate base X position for this sash
        const baseSashX =
          windowType === 1
            ? 0
            : -innerWidth / 2 + sashWidth / 2 + index * sashWidth;

        // Z offset for sash frame to align with outer frame
        // Sash sits slightly inward from the front of the frame (at the rebate position)
        const sashZOffset = profileConfig.depth * mm * 0.15;

        switch (openingType) {
          case "kipp":
            // Hinges at bottom center, tilts upward
            hingeX = baseSashX;
            hingeY = -innerHeight / 2;
            sashOffsetX = 0;
            sashOffsetY = innerHeight / 2; // Offset sash upward so hinge is at group origin
            rotationAxis = [currentRotation, 0, 0]; // X-axis rotation
            break;

          case "dreh-links":
            // Hinges at left edge, swings right
            hingeX = baseSashX - sashWidth / 2; // Left edge of sash area
            hingeY = 0;
            sashOffsetX = sashWidth / 2; // Offset sash right so hinge is at group origin
            sashOffsetY = 0;
            rotationAxis = [0, currentRotation, 0]; // Y-axis rotation
            break;

          case "dreh-rechts":
            // Hinges at right edge, swings left
            hingeX = baseSashX + sashWidth / 2; // Right edge of sash area
            hingeY = 0;
            sashOffsetX = -sashWidth / 2; // Offset sash left so hinge is at group origin
            sashOffsetY = 0;
            rotationAxis = [0, currentRotation, 0]; // Y-axis rotation
            break;

          case "dreh-kipp-links":
            // Hybrid: check mode
            if (currentMode === "kipp") {
              // Kipp mode: hinges at bottom center
              hingeX = baseSashX;
              hingeY = -innerHeight / 2;
              sashOffsetX = 0;
              sashOffsetY = innerHeight / 2;
              rotationAxis = [currentRotation, 0, 0]; // X-axis rotation
            } else {
              // Dreh mode: hinges at left edge
              hingeX = baseSashX - sashWidth / 2;
              hingeY = 0;
              sashOffsetX = sashWidth / 2;
              sashOffsetY = 0;
              rotationAxis = [0, currentRotation, 0]; // Y-axis rotation
            }
            break;

          case "dreh-kipp-rechts":
            // Hybrid: check mode
            if (currentMode === "kipp") {
              // Kipp mode: hinges at bottom center
              hingeX = baseSashX;
              hingeY = -innerHeight / 2;
              sashOffsetX = 0;
              sashOffsetY = innerHeight / 2;
              rotationAxis = [currentRotation, 0, 0]; // X-axis rotation
            } else {
              // Dreh mode: hinges at right edge
              hingeX = baseSashX + sashWidth / 2;
              hingeY = 0;
              sashOffsetX = -sashWidth / 2;
              sashOffsetY = 0;
              rotationAxis = [0, currentRotation, 0]; // Y-axis rotation
            }
            break;

          case "fixed":
          default:
            // No rotation, centered position
            hingeX = baseSashX;
            hingeY = 0;
            sashOffsetX = 0;
            sashOffsetY = 0;
            rotationAxis = [0, 0, 0];
            break;
        }

        return (
          <group
            key={`sash-hinge-${index}`}
            position={[hingeX, hingeY, 0]} // Hinge position in world space
          >
            <group rotation={rotationAxis}>
              {" "}
              {/* Rotation around hinge */}
              <group position={[sashOffsetX, sashOffsetY, 0]}>
                {" "}
                {/* Offset to position sash */}
                {/* Sash frame - 4 segments with nested groups (skip for fixed windows) */}
                {!isFixed && (
                  <group name={`sash-${index}-frame`}>
                    {(["bottom", "top", "left", "right"] as const).map(
                      (segment, segIdx) => {
                        // sashProfileWidth = 70% of outer frame profile width
                        const sashProfileWidth = profileConfig.width * mm * 0.7;
                        const transform = getSashSegmentTransform(
                          segment,
                          sashWidth,
                          innerHeight,
                          profileConfig.depth * mm * 0.9,
                          sashZOffset,
                          sashProfileWidth,
                        );
                        return (
                          <group
                            key={segment}
                            position={transform.groupPosition}
                          >
                            <mesh
                              geometry={sashSegments[segIdx]}
                              material={frameInsideMaterial}
                              rotation={transform.meshRotation}
                              position={transform.meshPosition}
                              castShadow
                              receiveShadow
                            />
                          </group>
                        );
                      },
                    )}
                  </group>
                )}
                {/* Glass + Visualization Group - grouped for consistent positioning */}
                <group name={`sash-${index}-glass-viz`}>
                  {/* Glass pane */}
                  <mesh
                    geometry={glassGeometries[index]}
                    material={glassMaterial}
                    castShadow
                    receiveShadow
                  />
                  {/* 3D opening indicator lines (rotate with sash) */}
                  {showOpeningViz &&
                    openingConfigs[index] &&
                    openingConfigs[index].type !== "fixed" && (
                      <OpeningVisualization
                        openingType={openingConfigs[index].type}
                        glassWidth={glassWidth}
                        glassHeight={glassHeight}
                        sashPosition={[0, 0, 0]} // Already in sash local space
                        glassFrontZ={glassFrontZ}
                        isOpen={sashOpenStates[index] || false}
                        onOpenChange={(isOpen) =>
                          handleSashOpenChange(index, isOpen)
                        }
                        renderLinesOnly={true} // Only render 3D lines in rotating group
                      />
                    )}
                </group>
                {/* HTML buttons (rotate with sash) */}
                {showOpeningViz &&
                  openingConfigs[index] &&
                  openingConfigs[index].type !== "fixed" &&
                  (() => {
                    const isHybrid =
                      openingType === "dreh-kipp-links" ||
                      openingType === "dreh-kipp-rechts";
                    const isOpen = sashOpenStates[index] || false;

                    return (
                      <>
                        {/* Main button (dreh for hybrids, or the only button for non-hybrids) */}
                        <OpeningVisualization
                          openingType={openingConfigs[index].type}
                          glassWidth={glassWidth}
                          glassHeight={glassHeight}
                          sashPosition={[0, 0, 0]} // Already in sash local space
                          glassFrontZ={glassFrontZ}
                          isOpen={
                            isOpen && (!isHybrid || currentMode === "dreh")
                          }
                          onOpenChange={(isOpen) =>
                            handleSashOpenChange(index, isOpen, "dreh")
                          }
                          renderButtonOnly={true}
                        />

                        {/* Additional kipp button for hybrid modes */}
                        {isHybrid && (
                          <OpeningVisualization
                            openingType="kipp"
                            glassWidth={glassWidth}
                            glassHeight={glassHeight}
                            sashPosition={[0, 0, 0]} // Already in sash local space
                            glassFrontZ={glassFrontZ}
                            isOpen={isOpen && currentMode === "kipp"}
                            onOpenChange={(isOpen) =>
                              handleSashOpenChange(index, isOpen, "kipp")
                            }
                            renderButtonOnly={true}
                          />
                        )}
                      </>
                    );
                  })()}
              </group>
            </group>
          </group>
        );
      })}

      {/* Pfosten (vertical mullions) - structural dividers between sashes */}
      {pfostenGeometry &&
        pfostenPositions.map((xPos, index) => {
          const mm = 0.001;
          const innerHeight = heightCm * 10 * mm - profileConfig.width * mm * 2;
          const transform = getPfostenTransform(
            xPos,
            innerHeight,
            profileConfig.depth * mm,
          );

          return (
            <group key={`pfosten-${index}`} position={transform.groupPosition}>
              <mesh
                geometry={pfostenGeometry}
                material={frameOutsideMaterial}
                rotation={transform.meshRotation}
                position={transform.meshPosition}
                castShadow
                receiveShadow
              />
            </group>
          );
        })}
    </group>
  );
};

// Export DynamicModel definition for K3
export const windowModel: DynamicModel = {
  type: "windowPlugin",
  label: "Window Configurator",
  disabledForAR: false,
  component: DynamicWindow,
  propsDialog: {
    basic: { type: "basic" },
    windowType: {
      label: "Window Type",
      options: [
        { value: "1", label: "Single Pane" },
        { value: "2", label: "Two Panes" },
        { value: "3", label: "Three Panes" },
      ],
    },
    profile: {
      label: "Profile",
      options: [
        { value: "1", label: "Minimal (40mm)" },
        { value: "2", label: "Modern Slim (60mm)" },
        { value: "3", label: "Modern Wide (80mm)" },
        { value: "4", label: "Traditional (100mm)" },
      ],
    },
    sash1Opening: {
      label: "Sash 1 Opening",
      options: [
        { value: "1", label: "Fix (Fixed)" },
        { value: "2", label: "Kipp (Tilt)" },
        { value: "3", label: "Dreh Links" },
        { value: "4", label: "Dreh Rechts" },
        { value: "5", label: "Dreh-/Kipp Links" },
        { value: "6", label: "Dreh-/Kipp Rechts" },
      ],
    },
    sash2Opening: {
      label: "Sash 2 Opening",
      options: [
        { value: "1", label: "Fix (Fixed)" },
        { value: "2", label: "Kipp (Tilt)" },
        { value: "3", label: "Dreh Links" },
        { value: "4", label: "Dreh Rechts" },
        { value: "5", label: "Dreh-/Kipp Links" },
        { value: "6", label: "Dreh-/Kipp Rechts" },
      ],
    },
    sash3Opening: {
      label: "Sash 3 Opening",
      options: [
        { value: "1", label: "Fix (Fixed)" },
        { value: "2", label: "Kipp (Tilt)" },
        { value: "3", label: "Dreh Links" },
        { value: "4", label: "Dreh Rechts" },
        { value: "5", label: "Dreh-/Kipp Links" },
        { value: "6", label: "Dreh-/Kipp Rechts" },
      ],
    },
    pfosten1: {
      label: "Pfosten 1 (Between Sash 1-2)",
      options: [
        { value: "0", label: "Auto" },
        { value: "1", label: "No" },
        { value: "2", label: "Yes" },
      ],
    },
    pfosten2: {
      label: "Pfosten 2 (Between Sash 2-3)",
      options: [
        { value: "0", label: "Auto" },
        { value: "1", label: "No" },
        { value: "2", label: "Yes" },
      ],
    },
    showOpeningViz: {
      label: "Show Opening Indicators",
      options: [
        { value: "1", label: "Yes" },
        { value: "2", label: "No" },
      ],
    },
  },
  defaultProps: {
    width: { expression: "100" },
    height: { expression: "120" },
    depth: { expression: "8" },
    windowType: { expression: "1" },
    profile: { expression: "2" },
    sash1Opening: { expression: "5" }, // Default: Dreh-/Kipp Links
    sash2Opening: { expression: "6" }, // Default: Dreh-/Kipp Rechts
    sash3Opening: { expression: "5" }, // Default: Dreh-/Kipp Links
    pfosten1: { expression: "0" }, // Default: Auto
    pfosten2: { expression: "0" }, // Default: Auto
    showOpeningViz: { expression: "1" },
  },
  materials: ["frameOutside", "frameInside", "glass"],
};

export default DynamicWindow;
