// Development environment for testing window plugin
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import DynamicWindow from "./Window";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
        <color attach="background" args={["#f0f0f0"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-10, 10, -5]} intensity={0.3} />

        {/* Window with opening visualization */}
        <DynamicWindow
          id="test-window"
          width="100"
          height="120"
          depth="8"
          windowType="2"
          profile="2"
          sash1Opening="5" // Dreh-/Kipp Links (default)
          sash2Opening="6" // Dreh-/Kipp Rechts (default)
          sash3Opening="5" // Dreh-/Kipp Links (for 3-pane)
          showOpeningViz="1" // Yes (1=yes, 2=no)
        />

        {/* Ground grid for reference */}
        <Grid
          args={[10, 10]}
          position={[0, -1.2, 0]}
          cellColor="#999"
          sectionColor="#666"
        />

        <OrbitControls makeDefault />
      </Canvas>

      {/* UI Controls */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(255,255,255,0.9)",
          padding: "15px",
          borderRadius: "8px",
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          maxWidth: "300px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>K3 Window Plugin Test</h3>
        <p style={{ margin: "5px 0", color: "#666" }}>
          <strong>Window Type:</strong> 2-Pane
          <br />
          <strong>Sash 1:</strong> Dreh-/Kipp Links
          <br />
          <strong>Sash 2:</strong> Dreh-/Kipp Rechts
          <br />
          <strong>Profile:</strong> Modern Slim (60mm)
          <br />
          <strong style={{ color: "#2196F3" }}>
            Click blue buttons to open/close sashes!
          </strong>
        </p>
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            background: "#e3f2fd",
            borderRadius: "4px",
          }}
        >
          <strong>Interactive Features:</strong>
          <ul
            style={{ margin: "5px 0", paddingLeft: "20px", fontSize: "12px" }}
          >
            <li>
              <span style={{ color: "#2196F3" }}>Blue button</span> = clickable
              hinge point
            </li>
            <li>
              <span style={{ color: "#1976D2" }}>Blue lines</span> = opening
              directions (3D)
            </li>
            <li>Click button to animate sash opening</li>
            <li>Each sash opens independently</li>
            <li>Pfosten auto-added based on opening types</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
