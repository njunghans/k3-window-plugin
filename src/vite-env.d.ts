/// <reference types="vite/client" />

/* Type declarations for react-three-fiber JSX elements */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
    }
  }
}
