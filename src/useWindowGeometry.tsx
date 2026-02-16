import { useMemo } from "react";
import * as THREE from "three";
import { useWindowContext } from "./useWindowContext";
import {
  buildFrameGeometry,
  buildGlassGeometry,
  buildMuntinsGeometryGrid,
  buildMuntinsGeometryCross,
} from "./geometryBuilders";
import { getGlassPaneCount, calculateInnerWidth, calculateInnerHeight } from "./utils";

export interface ComputedGeometry {
  frameGeometry: THREE.BufferGeometry | null;
  glassGeometries: THREE.BufferGeometry | THREE.BufferGeometry[] | null;
  muntinGeometries: THREE.BufferGeometry[] | null;
  innerWidth: number;
  innerHeight: number;
  paneCount: number;
}

/**
 * Hook that computes and memoizes all window geometries
 * Dependencies are tracked explicitly to prevent unnecessary recalculations
 */
export function useWindowGeometry(): ComputedGeometry {
  const { config } = useWindowContext();

  // Memoize frame geometry
  const frameGeometry = useMemo(() => {
    try {
      return buildFrameGeometry({
        width: config.width,
        height: config.height,
        frameWidth: config.profile.width,
      });
    } catch (error) {
      console.error("Error building frame geometry:", error);
      return null;
    }
  }, [config.width, config.height, config.profile.width]);

  // Memoize glass geometry
  const glassGeometries = useMemo(() => {
    try {
      const paneCount = getGlassPaneCount(config.type);
      return buildGlassGeometry({
        width: config.width,
        height: config.height,
        frameWidth: config.profile.width,
        paneCount,
      });
    } catch (error) {
      console.error("Error building glass geometry:", error);
      return null;
    }
  }, [config.width, config.height, config.profile.width, config.type]);

  // Memoize muntin geometry
  const muntinGeometries = useMemo(() => {
    if (!config.muntins.enabled) {
      return null;
    }

    try {
      const baseInput = {
        width: config.width,
        height: config.height,
        frameWidth: config.profile.width,
        rows: config.muntins.rows,
        columns: config.muntins.columns,
        muntinWidth: config.muntins.width,
      };

      if (config.muntins.pattern === "grid") {
        return buildMuntinsGeometryGrid(baseInput);
      } else if (config.muntins.pattern === "cross") {
        return buildMuntinsGeometryCross(baseInput);
      }

      return null;
    } catch (error) {
      console.error("Error building muntin geometry:", error);
      return null;
    }
  }, [
    config.muntins.enabled,
    config.muntins.pattern,
    config.muntins.rows,
    config.muntins.columns,
    config.muntins.width,
    config.width,
    config.height,
    config.profile.width,
  ]);

  // Memoize derived dimensions
  const innerWidth = useMemo(
    () => calculateInnerWidth(config),
    [config.width, config.profile.width]
  );

  const innerHeight = useMemo(
    () => calculateInnerHeight(config),
    [config.height, config.profile.width]
  );

  const paneCount = useMemo(() => getGlassPaneCount(config.type), [config.type]);

  return {
    frameGeometry,
    glassGeometries,
    muntinGeometries,
    innerWidth,
    innerHeight,
    paneCount,
  };
}
