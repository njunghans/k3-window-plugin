import type {
  WindowConfiguration,
  ProfileConfig,
  FrameMaterial,
  GlassMaterial,
} from "./types";

// ============================================================================
// Window Dimension Limits
// ============================================================================

export const WINDOW_MIN_WIDTH = 400; // mm
export const WINDOW_MAX_WIDTH = 3000; // mm
export const WINDOW_MIN_HEIGHT = 400; // mm
export const WINDOW_MAX_HEIGHT = 3000; // mm
export const WINDOW_MIN_DEPTH = 50; // mm
export const WINDOW_MAX_DEPTH = 150; // mm

// ============================================================================
// Profile Library
// ============================================================================

// Enhanced Profile Library with realistic dimensions
// Based on European PVC/Aluminum standards (VEKA, Reynaers, REHAU)
export const PROFILE_LIBRARY: Record<string, ProfileConfig> = {
  minimal: {
    profileKey: "minimal",
    width: 40, // Total frame width in mm
    depth: 50, // Frame depth in mm
    glassRebateDepth: 15, // Depth of rebate for glass
    sightline: 25, // Visible frame width from inside
  },
  "modern-slim": {
    profileKey: "modern-slim",
    width: 60, // Based on 60mm PVC systems
    depth: 70,
    glassRebateDepth: 18,
    sightline: 35,
  },
  "modern-wide": {
    profileKey: "modern-wide",
    width: 80, // Based on 70-82mm PVC systems with thermal break
    depth: 82,
    glassRebateDepth: 22,
    sightline: 45,
  },
  traditional: {
    profileKey: "traditional",
    width: 100, // Traditional wider profiles
    depth: 90,
    glassRebateDepth: 25,
    sightline: 55,
  },
};

// ============================================================================
// Materials Library
// ============================================================================

export const FRAME_MATERIALS: Record<string, FrameMaterial> = {
  pvc_white: {
    material: "PVC",
    colorOutside: "#ffffff",
    colorInside: "#ffffff",
  },
  pvc_gray: {
    material: "PVC",
    colorOutside: "#7f8c8d",
    colorInside: "#ffffff",
  },
  alu_anthracite: {
    material: "Aluminum",
    colorOutside: "#2c3e50",
    colorInside: "#ecf0f1",
  },
  alu_silver: {
    material: "Aluminum",
    colorOutside: "#bdc3c7",
    colorInside: "#ecf0f1",
  },
  wood_oak: {
    material: "Wood",
    colorOutside: "#d4a574",
    colorInside: "#f5deb3",
  },
};

export const GLASS_TYPES: Record<string, GlassMaterial> = {
  single: {
    type: "single",
    color: "#e8f4f8",
  },
  double: {
    type: "double",
    color: "#c8e8f0",
  },
  triple: {
    type: "triple",
    color: "#a8dcf0",
  },
};

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_FRAME_MATERIAL: FrameMaterial = {
  material: "PVC",
  colorOutside: "#ffffff",
  colorInside: "#ffffff",
};

export const DEFAULT_GLASS_MATERIAL: GlassMaterial = {
  type: "double",
  color: "#c8e8f0",
};

export const DEFAULT_PROFILE: ProfileConfig = {
  profileKey: "modern-slim",
  width: 60,
};

export const DEFAULT_WINDOW_CONFIG: WindowConfiguration = {
  id: "window-default",
  name: "Standard Window",
  width: 1000,
  height: 1200,
  depth: 80,
  type: "1-part",
  frame: DEFAULT_FRAME_MATERIAL,
  glass: DEFAULT_GLASS_MATERIAL,
  profile: DEFAULT_PROFILE,
  muntins: {
    enabled: false,
    pattern: "none",
    rows: 0,
    columns: 0,
    width: 20,
  },
  handles: [
    {
      id: "handle-1",
      position: [500, 600, 0],
    },
  ],
  opening: {
    type: "dreh-kipp-links",
  },
};

// ============================================================================
// Opening Types
// ============================================================================

export const OPENING_TYPES = {
  fixed: "Fix (Fixed)",
  kipp: "Kipp (Tilt from Bottom)",
  "dreh-links": "Dreh Links (Turn Left)",
  "dreh-rechts": "Dreh Rechts (Turn Right)",
  "dreh-kipp-links": "Dreh-/Kipp Links (Tilt-Turn Left)",
  "dreh-kipp-rechts": "Dreh-/Kipp Rechts (Tilt-Turn Right)",
};

// ============================================================================
// Muntin Patterns
// ============================================================================

export const MUNTIN_PATTERNS = {
  none: "No Muntins",
  grid: "Grid",
  cross: "Cross",
};
