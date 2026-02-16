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
} from "./profileSystem";
import { createGlassMaterial } from "./components/WindowGlass";
import { OpeningVisualization } from "./components/OpeningVisualization";
import type { OpeningConfig } from "./types";

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
  const frameGeometries = useMemo(
    () =>
      createCompleteFrame(
        widthCm * 10,
        heightCm * 10,
        windowType,
        profileConfig,
      ),
    [widthCm, heightCm, windowType, profileConfig],
  );

  // Generate glass panes with realistic thickness
  const glassGeometries = useMemo(
    () =>
      createGlassPanes(
        widthCm * 10,
        heightCm * 10,
        windowType,
        profileConfig,
        24, // 24mm double glazing
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

  // Calculate Pfosten requirements based on opening types
  const pfostenNeeds = useMemo(() => {
    const needs: boolean[] = [];

    for (let i = 0; i < windowType - 1; i++) {
      const leftSash = openingConfigs[i];
      const rightSash = openingConfigs[i + 1];

      // Check if left sash needs Pfosten on its right side
      const leftNeedsRight =
        leftSash.type === "kipp" || // Kipp needs both sides
        leftSash.type === "dreh-rechts" || // Anchors right
        leftSash.type === "dreh-kipp-rechts"; // Anchors right

      // Check if right sash needs Pfosten on its left side
      const rightNeedsLeft =
        rightSash.type === "kipp" || // Kipp needs both sides
        rightSash.type === "dreh-links" || // Anchors left
        rightSash.type === "dreh-kipp-links"; // Anchors left

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

  // Create Pfosten geometries based on requirements
  const pfostenGeometries = useMemo(() => {
    if (windowType === 1) return []; // Single pane, no Pfosten

    const mm = 0.001;
    const innerWidth = widthCm * 10 * mm - profileConfig.width * mm * 2;
    const sashWidth = innerWidth / windowType;

    // Pfosten height should match inner height (exclude top/bottom frame)
    const innerHeightMm = heightCm * 10 - profileConfig.width * 2;

    return pfostenNeeds
      .map((needed, i) => {
        if (!needed) return null;

        // Calculate X position for this Pfosten
        // Position at boundary between sashes
        const xPos = -innerWidth / 2 + sashWidth * (i + 1);

        return createPfosten(innerHeightMm, profileConfig, xPos);
      })
      .filter(Boolean) as THREE.BufferGeometry[];
  }, [pfostenNeeds, widthCm, heightCm, windowType, profileConfig]);

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
          return Math.PI / 6; // 30 degrees tilt from bottom (positive = tilt inward)
        case "dreh-links":
          return -Math.PI / 3; // 60 degrees, left hinge swings right (negative Y rotation)
        case "dreh-rechts":
          return Math.PI / 3; // 60 degrees, right hinge swings left (positive Y rotation)
        case "dreh-kipp-links":
          // Hybrid: check mode
          if (mode === "kipp") {
            return Math.PI / 6; // 30 degrees tilt from bottom (kipp mode - inward)
          } else {
            return -Math.PI / 3; // 60 degrees swing from left (dreh mode)
          }
        case "dreh-kipp-rechts":
          // Hybrid: check mode
          if (mode === "kipp") {
            return Math.PI / 6; // 30 degrees tilt from bottom (kipp mode - inward)
          } else {
            return Math.PI / 3; // 60 degrees swing from right (dreh mode)
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
      // Switch mode: close current and open in new mode
      setSashOpenStates((prev) => {
        const newStates = [...prev];
        newStates[index] = true; // Stay open but switch mode
        return newStates;
      });
      setSashModes((prev) => {
        const newModes = [...prev];
        newModes[index] = mode;
        return newModes;
      });
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
      {/* Outer frame (static) */}
      <mesh
        geometry={frameGeometries[0]}
        material={frameOutsideMaterial}
        castShadow
        receiveShadow
      />

      {/* Sash groups - each contains frame + glass + opening lines */}
      {frameGeometries.slice(1).map((sashGeometry, index) => {
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
                {/* Sash frame */}
                <mesh
                  geometry={sashGeometry}
                  material={frameInsideMaterial}
                  castShadow
                  receiveShadow
                />
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
                      width={sashWidth}
                      height={innerHeight}
                      depth={profileConfig.depth * mm}
                      sashPosition={[0, 0, 0]} // Already in sash local space
                      isOpen={sashOpenStates[index] || false}
                      onOpenChange={(isOpen) =>
                        handleSashOpenChange(index, isOpen)
                      }
                      renderLinesOnly={true} // Only render 3D lines in rotating group
                    />
                  )}
                {/* HTML buttons (rotate with sash) */}
                {showOpeningViz &&
                  openingConfigs[index] &&
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
                          width={sashWidth}
                          height={innerHeight}
                          depth={profileConfig.depth * mm}
                          sashPosition={[0, 0, 0]} // Already in sash local space
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
                            width={sashWidth}
                            height={innerHeight}
                            depth={profileConfig.depth * mm}
                            sashPosition={[0, 0, 0]} // Already in sash local space
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
      {pfostenGeometries.map((geometry, index) => (
        <mesh
          key={`pfosten-${index}`}
          geometry={geometry}
          material={frameOutsideMaterial} // Use outside material for Pfosten
          castShadow
          receiveShadow
        />
      ))}
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
