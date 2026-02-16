import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { OpeningType } from "../types";

interface OpeningVisualizationProps {
  /** Opening type */
  openingType: OpeningType;
  /** Width of this specific sash (in meters) */
  width: number;
  /** Height of this specific sash (in meters) */
  height: number;
  /** Depth (in meters) */
  depth: number;
  /** Position of this sash in 3D space [x, y, z] */
  sashPosition: [number, number, number];
  /** Current open state */
  isOpen: boolean;
  /** Callback when opening state changes */
  onOpenChange: (isOpen: boolean) => void;
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
  width,
  height,
  depth,
  sashPosition,
  isOpen,
  onOpenChange,
  renderLinesOnly = false,
  renderButtonOnly = false,
}: OpeningVisualizationProps) {
  const w = width;
  const h = height;
  const d = depth;
  const fw = 0.012; // Approximate sash frame width in meters

  // Calculate correct Z position for lines and buttons:
  // - Sash ExtrudeGeometry + translate puts front face at: 3*d/2
  // - Additional sash offset adds: d * 0.1
  const lineZ = (3 * d) / 2 + d * 0.1;

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
      // Kipp: Button at top center, lines pointing down (hinges at bottom)
      buttonX = 0;
      buttonY = h / 2 - fw;

      // Two diagonal lines pointing down from button
      lines = [
        {
          start: new THREE.Vector3(0, buttonY, lineZ),
          end: new THREE.Vector3(-w / 3, -h / 2 + fw * 2, lineZ),
        },
        {
          start: new THREE.Vector3(0, buttonY, lineZ),
          end: new THREE.Vector3(w / 3, -h / 2 + fw * 2, lineZ),
        },
      ];
      break;
    }

    case "dreh-links": {
      // Dreh Links: Button at RIGHT edge, two diagonal lines (left hinge, swings right)
      buttonX = w / 2 - fw;
      buttonY = h / 4;

      // Two diagonal lines showing swing range to opposite corners
      lines = [
        {
          start: new THREE.Vector3(buttonX, buttonY, lineZ),
          end: new THREE.Vector3(-w / 2 + fw * 2, h / 2 - fw * 2, lineZ),
        },
        {
          start: new THREE.Vector3(buttonX, buttonY, lineZ),
          end: new THREE.Vector3(-w / 2 + fw * 2, -h / 2 + fw * 2, lineZ),
        },
      ];
      break;
    }

    case "dreh-rechts": {
      // Dreh Rechts: Button at LEFT edge, two diagonal lines (right hinge, swings left)
      buttonX = -w / 2 + fw;
      buttonY = h / 4;

      // Two diagonal lines showing swing range to opposite corners
      lines = [
        {
          start: new THREE.Vector3(buttonX, buttonY, lineZ),
          end: new THREE.Vector3(w / 2 - fw * 2, h / 2 - fw * 2, lineZ),
        },
        {
          start: new THREE.Vector3(buttonX, buttonY, lineZ),
          end: new THREE.Vector3(w / 2 - fw * 2, -h / 2 + fw * 2, lineZ),
        },
      ];
      break;
    }

    case "dreh-kipp-links": {
      // Dreh-/Kipp Links: Button at RIGHT edge, FOUR lines total (left hinge, tilt-turn)
      buttonX = w / 2 - fw;
      buttonY = h / 4;

      // Four lines: 2 for dreh (swing) + 2 for kipp (tilt) - matching kipp pattern from top
      lines = [
        // Dreh lines: diagonal to opposite corners (showing swing range)
        {
          start: new THREE.Vector3(buttonX, buttonY, lineZ),
          end: new THREE.Vector3(-w / 2 + fw * 2, h / 2 - fw * 2, lineZ),
        },
        {
          start: new THREE.Vector3(buttonX, buttonY, lineZ),
          end: new THREE.Vector3(-w / 2 + fw * 2, -h / 2 + fw * 2, lineZ),
        },
        // Kipp lines: from TOP center pointing down (same as pure kipp)
        {
          start: new THREE.Vector3(0, h / 2 - fw, lineZ),
          end: new THREE.Vector3(-w / 3, -h / 2 + fw * 2, lineZ),
        },
        {
          start: new THREE.Vector3(0, h / 2 - fw, lineZ),
          end: new THREE.Vector3(w / 3, -h / 2 + fw * 2, lineZ),
        },
      ];
      break;
    }

    case "dreh-kipp-rechts": {
      // Dreh-/Kipp Rechts: Button at LEFT edge, FOUR lines total (right hinge, tilt-turn)
      buttonX = -w / 2 + fw;
      buttonY = h / 4;

      // Four lines: 2 for dreh (swing) + 2 for kipp (tilt) - matching kipp pattern from top
      lines = [
        // Dreh lines: diagonal to opposite corners (showing swing range)
        {
          start: new THREE.Vector3(buttonX, buttonY, lineZ),
          end: new THREE.Vector3(w / 2 - fw * 2, h / 2 - fw * 2, lineZ),
        },
        {
          start: new THREE.Vector3(buttonX, buttonY, lineZ),
          end: new THREE.Vector3(w / 2 - fw * 2, -h / 2 + fw * 2, lineZ),
        },
        // Kipp lines: from TOP center pointing down (same as pure kipp)
        {
          start: new THREE.Vector3(0, h / 2 - fw, lineZ),
          end: new THREE.Vector3(-w / 3, -h / 2 + fw * 2, lineZ),
        },
        {
          start: new THREE.Vector3(0, h / 2 - fw, lineZ),
          end: new THREE.Vector3(w / 3, -h / 2 + fw * 2, lineZ),
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
        position={[buttonX, buttonY, d / 2]}
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
