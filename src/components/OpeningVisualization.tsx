import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { OpeningType } from "../types";

interface OpeningVisualizationProps {
  /** Opening type */
  openingType: OpeningType;
  /** Width of the glass pane (in meters) */
  glassWidth: number;
  /** Height of the glass pane (in meters) */
  glassHeight: number;
  /** Position of this sash in 3D space [x, y, z] */
  sashPosition: [number, number, number];
  /** Z-position of glass front surface (in meters) */
  glassFrontZ: number;
  /** Current open state */
  isOpen: boolean;
  /** Callback when opening state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** Margin from glass edges (in meters) */
  margin?: number;
  /** Only render 3D lines (for sash group) */
  renderLinesOnly?: boolean;
  /** Only render HTML button (for separate overlay) */
  renderButtonOnly?: boolean;
}

/**
 * Opening visualization with:
 * - 2D HTML clickable button at hinge point (when renderButtonOnly or both)
 * - 3D lines drawn on sash surface showing opening direction (when renderLinesOnly or both)
 *
 * Opening types based on German window standards:
 * - fixed: Cross/plus symbol (no opening)
 * - kipp: Button at top, lines pointing down (tilts from bottom)
 * - dreh-links: Button at left, single diagonal line (left hinge, swings right)
 * - dreh-rechts: Button at right, single diagonal line (right hinge, swings left)
 * - dreh-kipp-links: Button at left, two diagonal lines (left hinge, tilt-turn)
 * - dreh-kipp-rechts: Button at right, two diagonal lines (right hinge, tilt-turn)
 */
export function OpeningVisualization({
  openingType,
  glassWidth,
  glassHeight,
  sashPosition,
  glassFrontZ,
  isOpen,
  onOpenChange,
  margin = 0.005, // Default 5mm margin from glass edges
  renderLinesOnly = false,
  renderButtonOnly = false,
}: OpeningVisualizationProps) {
  // Glass dimensions with margin applied
  const w = glassWidth;
  const h = glassHeight;
  const m = margin;

  // Use the passed glass front Z-position for lines and buttons
  const lineZ = glassFrontZ;

  // Calculate glass corners with margin
  const topLeft = { x: -w / 2 + m, y: h / 2 - m };
  const topRight = { x: w / 2 - m, y: h / 2 - m };
  const bottomLeft = { x: -w / 2 + m, y: -h / 2 + m };
  const bottomRight = { x: w / 2 - m, y: -h / 2 + m };
  const midTop = { x: 0, y: h / 2 - m };
  const midLeft = { x: -w / 2 + m, y: 0 };
  const midRight = { x: w / 2 - m, y: 0 };

  if (openingType === "fixed") {
    // Fixed windows show just a cross/plus symbol
    if (renderButtonOnly) {
      return (
        <group position={sashPosition}>
          <Html
            position={[0, 0, lineZ]}
            center
            style={{
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                color: "#1976D2",
                fontWeight: "bold",
              }}
            >
              ✕
            </div>
          </Html>
        </group>
      );
    }
    return null; // No 3D lines for fixed windows
  }

  // Calculate button position and line endpoints based on opening type
  let buttonX = 0;
  let buttonY = 0;
  let lines: Array<{ start: THREE.Vector3; end: THREE.Vector3 }> = [];

  switch (openingType) {
    case "kipp": {
      // Kipp: Button at top center
      // Lines: bottomLeft → midTop → bottomRight
      buttonX = midTop.x;
      buttonY = midTop.y;

      lines = [
        {
          start: new THREE.Vector3(bottomLeft.x, bottomLeft.y, lineZ),
          end: new THREE.Vector3(midTop.x, midTop.y, lineZ),
        },
        {
          start: new THREE.Vector3(midTop.x, midTop.y, lineZ),
          end: new THREE.Vector3(bottomRight.x, bottomRight.y, lineZ),
        },
      ];
      break;
    }

    case "dreh-links": {
      // Dreh Links (left hinge, swings right): Button at free edge (mid-right)
      // Lines: midRight → topLeft, midRight → bottomLeft (toward hinge)
      buttonX = midRight.x;
      buttonY = midRight.y;

      lines = [
        {
          start: new THREE.Vector3(midRight.x, midRight.y, lineZ),
          end: new THREE.Vector3(topLeft.x, topLeft.y, lineZ),
        },
        {
          start: new THREE.Vector3(midRight.x, midRight.y, lineZ),
          end: new THREE.Vector3(bottomLeft.x, bottomLeft.y, lineZ),
        },
      ];
      break;
    }

    case "dreh-rechts": {
      // Dreh Rechts (right hinge, swings left): Button at free edge (mid-left)
      // Lines: midLeft → topRight, midLeft → bottomRight (toward hinge)
      buttonX = midLeft.x;
      buttonY = midLeft.y;

      lines = [
        {
          start: new THREE.Vector3(midLeft.x, midLeft.y, lineZ),
          end: new THREE.Vector3(topRight.x, topRight.y, lineZ),
        },
        {
          start: new THREE.Vector3(midLeft.x, midLeft.y, lineZ),
          end: new THREE.Vector3(bottomRight.x, bottomRight.y, lineZ),
        },
      ];
      break;
    }

    case "dreh-kipp-links": {
      // Dreh-/Kipp Links: Button at free edge (mid-right), FOUR lines total
      buttonX = midRight.x;
      buttonY = midRight.y;

      lines = [
        // Dreh lines: midRight → topLeft, midRight → bottomLeft (toward hinge)
        {
          start: new THREE.Vector3(midRight.x, midRight.y, lineZ),
          end: new THREE.Vector3(topLeft.x, topLeft.y, lineZ),
        },
        {
          start: new THREE.Vector3(midRight.x, midRight.y, lineZ),
          end: new THREE.Vector3(bottomLeft.x, bottomLeft.y, lineZ),
        },
        // Kipp lines: bottomLeft → midTop → bottomRight
        {
          start: new THREE.Vector3(bottomLeft.x, bottomLeft.y, lineZ),
          end: new THREE.Vector3(midTop.x, midTop.y, lineZ),
        },
        {
          start: new THREE.Vector3(midTop.x, midTop.y, lineZ),
          end: new THREE.Vector3(bottomRight.x, bottomRight.y, lineZ),
        },
      ];
      break;
    }

    case "dreh-kipp-rechts": {
      // Dreh-/Kipp Rechts: Button at free edge (mid-left), FOUR lines total
      buttonX = midLeft.x;
      buttonY = midLeft.y;

      lines = [
        // Dreh lines: midLeft → topRight, midLeft → bottomRight (toward hinge)
        {
          start: new THREE.Vector3(midLeft.x, midLeft.y, lineZ),
          end: new THREE.Vector3(topRight.x, topRight.y, lineZ),
        },
        {
          start: new THREE.Vector3(midLeft.x, midLeft.y, lineZ),
          end: new THREE.Vector3(bottomRight.x, bottomRight.y, lineZ),
        },
        // Kipp lines: bottomLeft → midTop → bottomRight
        {
          start: new THREE.Vector3(bottomLeft.x, bottomLeft.y, lineZ),
          end: new THREE.Vector3(midTop.x, midTop.y, lineZ),
        },
        {
          start: new THREE.Vector3(midTop.x, midTop.y, lineZ),
          end: new THREE.Vector3(bottomRight.x, bottomRight.y, lineZ),
        },
      ];
      break;
    }
  }

  const handleClick = () => {
    const newState = !isOpen;
    onOpenChange(newState);
    console.log(`Sash ${newState ? "opening" : "closing"}:`, openingType);
  };

  // Render only 3D lines (for sash group that rotates)
  if (renderLinesOnly) {
    return (
      <>
        {lines.map((line, i) => {
          const points = [line.start, line.end];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);

          return (
            <primitive
              key={`line-${i}`}
              object={
                new THREE.Line(
                  geometry,
                  new THREE.LineBasicMaterial({ color: "#1976D2" }),
                )
              }
            />
          );
        })}
      </>
    );
  }

  // Render only HTML button (stays fixed, doesn't rotate)
  if (renderButtonOnly) {
    return (
      <group position={sashPosition}>
        <Html
          position={[buttonX, buttonY, lineZ]}
          center
          style={{
            pointerEvents: "auto",
            userSelect: "none",
          }}
        >
          <div style={{ position: "relative" }}>
            <button
              onClick={handleClick}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: isOpen ? "#1976D2" : "#2196F3",
                border: "2px solid #1565C0",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                transition: "all 0.2s ease",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(33, 150, 243, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
              }}
              title={`${openingType} - Click to ${isOpen ? "close" : "open"}`}
            />

            {isOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "-35px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(0,0,0,0.8)",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Offen
              </div>
            )}
          </div>
        </Html>
      </group>
    );
  }

  // Render both (default, backward compatible)
  return (
    <group position={sashPosition}>
      {/* 3D Lines drawn on sash surface */}
      {lines.map((line, i) => {
        const points = [line.start, line.end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <primitive
            key={`line-${i}`}
            object={
              new THREE.Line(
                geometry,
                new THREE.LineBasicMaterial({ color: "#1976D2" }),
              )
            }
          />
        );
      })}

      {/* 2D HTML Clickable Button */}
      <Html
        position={[buttonX, buttonY, lineZ]}
        center
        style={{
          pointerEvents: "auto",
          userSelect: "none",
        }}
      >
        <div style={{ position: "relative" }}>
          <button
            onClick={handleClick}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: isOpen ? "#1976D2" : "#2196F3",
              border: "2px solid #1565C0",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              transition: "all 0.2s ease",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(33, 150, 243, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
            }}
            title={`${openingType} - Click to ${isOpen ? "close" : "open"}`}
          />

          {isOpen && (
            <div
              style={{
                position: "absolute",
                top: "-35px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.8)",
                color: "white",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "11px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Offen
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

export default OpeningVisualization;
