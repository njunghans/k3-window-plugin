/**
 * Type definition for 3D position tuples
 */
type Vector3Tuple = [number, number, number];

// ============================================================================
// Window Configuration Types
// ============================================================================

export type WindowType = "1-part" | "2-part" | "3-part";
export type OpeningType =
  | "fixed"
  | "kipp"
  | "dreh-links"
  | "dreh-rechts"
  | "dreh-kipp-links"
  | "dreh-kipp-rechts";
export type OpeningDirection = "left" | "right";
export type MuntinPattern = "none" | "grid" | "cross";

// Frame Material Configuration
export interface FrameMaterial {
  material: string; // "PVC" | "Alu" | "Wood" | etc
  colorOutside: string; // Hex color
  colorInside: string; // Hex color
}

// Glass Configuration
export interface GlassMaterial {
  type: string; // "single" | "double" | "triple"
  color?: string;
}

// Profile Configuration
export interface ProfileConfig {
  profileKey: string; // Reference to profile library
  width: number; // Frame width in mm
  depth?: number; // Frame depth in mm
  glassRebateDepth?: number; // Depth of rebate where glass sits
  sightline?: number; // Visible frame width from inside
}

// Muntins (Sprossen) Configuration
export interface MuntinsConfig {
  enabled: boolean;
  pattern: MuntinPattern;
  rows: number;
  columns: number;
  width: number; // Muntin bar width in mm
}

// Handle Configuration
export interface HandleConfig {
  id: string;
  position: Vector3Tuple;
  rotation?: Vector3Tuple;
  modelKey?: string; // Reference to K3 model
}

// Opening Type Configuration
export interface OpeningConfig {
  type: OpeningType;
}

// Transom (Oberlicht) Configuration
export interface TransomConfig {
  enabled: boolean;
  height: number; // In mm
  material?: FrameMaterial;
}

// Falight (Unterlicht) Configuration
export interface FalightConfig {
  enabled: boolean;
  height: number; // In mm
  material?: FrameMaterial;
}

// Shutters Configuration
export interface ShuttersConfig {
  enabled: boolean;
  type: string;
  color: string;
  thickness: number;
}

// Insect Screen Configuration
export interface InsectScreenConfig {
  enabled: boolean;
  type: string;
  color: string;
}

// ============================================================================
// Main Window Configuration
// ============================================================================

export interface WindowConfiguration {
  // Identification
  id: string;
  name: string;

  // Dimensions (in mm)
  width: number;
  height: number;
  depth: number;

  // Type
  type: WindowType;

  // Materials & Colors
  frame: FrameMaterial;
  glass: GlassMaterial;

  // Structure
  profile: ProfileConfig;
  muntins: MuntinsConfig;

  // Hardware & Features
  handles: HandleConfig[];
  opening: OpeningConfig;

  // Optional Features
  transom?: TransomConfig;
  falight?: FalightConfig;
  shutters?: ShuttersConfig;
  insectScreen?: InsectScreenConfig;
}

// ============================================================================
// State Management Types
// ============================================================================

export type WindowAction =
  // Dimensions
  | {
      type: "SET_DIMENSIONS";
      payload: { width: number; height: number; depth: number };
    }
  | { type: "SET_WIDTH"; payload: number }
  | { type: "SET_HEIGHT"; payload: number }
  | { type: "SET_DEPTH"; payload: number }
  // Window Type
  | { type: "SET_WINDOW_TYPE"; payload: WindowType }
  // Frame Material
  | { type: "SET_FRAME_MATERIAL"; payload: FrameMaterial }
  | { type: "SET_FRAME_OUTSIDE_COLOR"; payload: string }
  | { type: "SET_FRAME_INSIDE_COLOR"; payload: string }
  // Profile
  | { type: "SET_PROFILE"; payload: ProfileConfig }
  // Muntins
  | { type: "SET_MUNTINS"; payload: MuntinsConfig }
  | { type: "DISABLE_MUNTINS"; payload: null }
  // Handles
  | { type: "ADD_HANDLE"; payload: HandleConfig }
  | { type: "REMOVE_HANDLE"; payload: string }
  | {
      type: "UPDATE_HANDLE";
      payload: { id: string; config: Partial<HandleConfig> };
    }
  // Opening
  | { type: "SET_OPENING"; payload: OpeningConfig }
  // Optional Features
  | { type: "ENABLE_TRANSOM"; payload: TransomConfig }
  | { type: "DISABLE_TRANSOM"; payload: null }
  | { type: "ENABLE_FALIGHT"; payload: FalightConfig }
  | { type: "DISABLE_FALIGHT"; payload: null }
  | { type: "ENABLE_SHUTTERS"; payload: ShuttersConfig }
  | { type: "DISABLE_SHUTTERS"; payload: null }
  | { type: "ENABLE_INSECT_SCREEN"; payload: InsectScreenConfig }
  | { type: "DISABLE_INSECT_SCREEN"; payload: null }
  // Batch updates
  | { type: "SET_CONFIG"; payload: WindowConfiguration }
  | { type: "RESET_TO_DEFAULTS"; payload: null };

// ============================================================================
// UI State Types
// ============================================================================

export interface UIState {
  activeTab: string;
  selectedProfile: ProfileConfig | null;
}

// ============================================================================
// Context Value Type
// ============================================================================

export interface WindowContextValue {
  config: WindowConfiguration;
  dispatch: (action: WindowAction) => void;
  ui: UIState;
}
