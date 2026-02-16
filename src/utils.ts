import type { WindowConfiguration } from "./types";
import {
  WINDOW_MIN_WIDTH,
  WINDOW_MAX_WIDTH,
  WINDOW_MIN_HEIGHT,
  WINDOW_MAX_HEIGHT,
  WINDOW_MIN_DEPTH,
  WINDOW_MAX_DEPTH,
} from "./constants";

// ============================================================================
// Validation Functions
// ============================================================================

export function validateWidth(width: number): boolean {
  return width >= WINDOW_MIN_WIDTH && width <= WINDOW_MAX_WIDTH;
}

export function validateHeight(height: number): boolean {
  return height >= WINDOW_MIN_HEIGHT && height <= WINDOW_MAX_HEIGHT;
}

export function validateDepth(depth: number): boolean {
  return depth >= WINDOW_MIN_DEPTH && depth <= WINDOW_MAX_DEPTH;
}

export function clampWidth(width: number): number {
  return Math.max(WINDOW_MIN_WIDTH, Math.min(WINDOW_MAX_WIDTH, width));
}

export function clampHeight(height: number): number {
  return Math.max(WINDOW_MIN_HEIGHT, Math.min(WINDOW_MAX_HEIGHT, height));
}

export function clampDepth(depth: number): number {
  return Math.max(WINDOW_MIN_DEPTH, Math.min(WINDOW_MAX_DEPTH, depth));
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate the inner width of the window (minus frame on both sides)
 */
export function calculateInnerWidth(windowConfig: WindowConfiguration): number {
  const frameThickness = windowConfig.profile.width * 2;
  return Math.max(0, windowConfig.width - frameThickness);
}

/**
 * Calculate the inner height of the window (minus frame top/bottom)
 */
export function calculateInnerHeight(
  windowConfig: WindowConfiguration,
): number {
  const frameThickness = windowConfig.profile.width * 2;
  return Math.max(0, windowConfig.height - frameThickness);
}

/**
 * Calculate the number of glass panes based on window type
 */
export function getGlassPaneCount(windowType: string): number {
  switch (windowType) {
    case "1-part":
      return 1;
    case "2-part":
      return 2;
    case "3-part":
      return 3;
    default:
      return 1;
  }
}

/**
 * Calculate individual pane width for multi-part windows
 */
export function getPaneWidth(windowConfig: WindowConfiguration): number {
  const innerWidth = calculateInnerWidth(windowConfig);
  const paneCount = getGlassPaneCount(windowConfig.type);

  if (paneCount === 1) {
    return innerWidth;
  } else if (paneCount === 2) {
    // For 2-part, typically 50/50 split, with frame gap in middle
    return (innerWidth - windowConfig.profile.width) / 2;
  } else if (paneCount === 3) {
    // For 3-part, typically center pane is slightly wider, outer panes narrower
    return (innerWidth - windowConfig.profile.width * 2) / 3;
  }

  return innerWidth;
}

/**
 * Check if a window configuration is valid
 */
export function isValidWindowConfig(config: WindowConfiguration): boolean {
  return (
    validateWidth(config.width) &&
    validateHeight(config.height) &&
    validateDepth(config.depth)
  );
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Convert hex color to RGB
 */
export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

// ============================================================================
// Copy/Clone Utilities
// ============================================================================

/**
 * Deep clone a window configuration
 */
export function cloneWindowConfig(
  config: WindowConfiguration,
): WindowConfiguration {
  return JSON.parse(JSON.stringify(config));
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
