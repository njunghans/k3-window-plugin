# K3 Window Configurator Plugin - Architecture Plan

## 1. Project Overview

A plugin for K3 that enables window sellers to configure custom window designs in 3D. The plugin follows K3's module federation approach and integrates with the existing plugin system.

### Tech Stack
- **Base**: React 19 + TypeScript + Vite
- **3D**: Three.js via react-three/fiber + drei
- **State**: React hooks + context (per-window state), Redux available via K3
- **Build**: Vite + Module Federation
- **UI**: Material-UI components (matching K3 theme)

---

## 2. High-Level Architecture

Based on **k3-sample-plugin** structure - simple and flat:

```
k3-window-plugin/
├── src/
│   ├── Plugin.tsx              # Root plugin export (K3 entry point)
│   ├── Window.tsx              # Main dynamic component (like DynamicRing)
│   │
│   ├── components/             # Feature-based sub-components
│   │   ├── WindowFrame.tsx     # Frame geometry builder
│   │   ├── WindowGlass.tsx     # Glass panes
│   │   ├── WindowHandles.tsx   # Handle placement
│   │   ├── WindowMuntins.tsx   # Muntins/sprossen
│   │   ├── WindowShutters.tsx  # Roller shutters
│   │   ├── WindowInsectScreen.tsx
│   │   ├── WindowTransom.tsx   # Top light
│   │   ├── ConfigPanel.tsx     # Main config container
│   │   ├── MaterialsPanel.tsx  # Material/color controls
│   │   ├── DimensionsPanel.tsx # Window size controls
│   │   ├── WindowTypePanel.tsx # 1/2/3-part selection
│   │   ├── ProfilePanel.tsx    # Frame profile selection
│   │   ├── MuntinsPanel.tsx    # Muntin pattern controls
│   │   ├── HandlePanel.tsx     # Handle selection/positioning
│   │   ├── OpeningPanel.tsx    # Opening type selection
│   │   ├── ShuttersPanel.tsx   # Shutter controls
│   │   └── OpeningVisualization.tsx  # Visual mockups
│   │
│   ├── types.ts                # All TypeScript interfaces
│   ├── constants.ts            # Profile library, enums, magic numbers
│   ├── utils.ts                # Helper functions
│   ├── geometryBuilders.ts     # Pure geometry creation functions
│   ├── useWindowContext.ts     # Context hook
│   ├── useWindowGeometry.ts    # Geometry calculation hook
│   │
│   ├── main.tsx                # (Empty, not used)
│   └── vite-env.d.ts
├── public/
│   └── screenshot.png          # Plugin thumbnail for K3
├── vite.config.ts
├── package.json
├── tsconfig.json
├── eslint.config.js
└── README.md
```

**Key Differences from sample-plugin**:
- Sample: 5 lightweight files for simple product (ring + price)
- Window Plugin: ~15 component files (more features)
- Keep flat `src/` structure, no deep nesting
- Some files like `geometryBuilders.ts` are utility/logic files
- Hooks in `src/` root (like `useWindowContext.ts`)
- All types in single `types.ts` file

---

## 3. Core Data Model

### 3.1 Window Configuration (Main State)

```typescript
interface WindowConfiguration {
  // Basic properties
  id: string;
  name: string;
  
  // Dimensions (in mm)
  width: number;          // Total width
  height: number;         // Total height
  depth: number;          // Frame depth
  
  // Type
  type: WindowType;       // "1-part" | "2-part" | "3-part"
  
  // Materials & Colors
  frame: FrameMaterial;   // Material + colors for frame
  glass: GlassMaterial;   // Type of glass
  
  // Structure
  profile: ProfileConfig;     // Frame profile definition
  muntins: MuntinsConfig;     // Sprossen configuration
  
  // Hardware & Accessories
  handles: HandleConfig[];
  opening: OpeningType;       // "tilt-turn" | "sliding" | "fixed" | etc.
  
  // Optional features
  transom?: TransomConfig;
  falight?: FalightConfig;    // Not sure of English term, means "unterlicht"
  shutters?: ShuttersConfig;
  insectScreen?: InsectScreenConfig;
}

interface FrameMaterial {
  material: string;           // "PVC" | "Alu" | "Wood" | ...
  decorOutside: string;       // Decor/color for outside
  decorInside: string;        // Decor/color for inside
}

interface GlassMaterial {
  type: string;               // "single" | "double" | "triple"
  color?: string;
  energy?: string;            // Energy efficiency class
}

interface ProfileConfig {
  profileKey: string;         // Reference to profile library
  width: number;              // Frame width in mm
  // Geometry is determined by profile shape from library
}

interface MuntinsConfig {
  pattern: MuntinPattern;     // "grid" | "cross" | "none" | ...
  rows: number;
  columns: number;
  width: number;              // Muntin bar width in mm
}

interface HandleConfig {
  id: string;
  position: [number, number, number];  // 3D position in frame
  modelKey?: string;                   // Reference to model in K3
  rotation?: [number, number, number];
}

interface OpeningType {
  type: string;               // "tilt-turn" | "sliding" | "fixed" | ...
  direction?: string;         // "left" | "right" | "both"
}

interface TransomConfig {
  enabled: boolean;
  height: number;             // Height of transom light
  material?: FrameMaterial;
}

interface FalightConfig {
  enabled: boolean;
  height: number;
  material?: FrameMaterial;
}

interface ShuttersConfig {
  enabled: boolean;
  type: string;
  color: string;
  thickness: number;
  // ... other shutter properties
}

interface InsectScreenConfig {
  enabled: boolean;
  type: string;               // "sliding" | "fixed" | ...
  color: string;
}
```

---

## 4. Component Hierarchy

### 4.1 Rendering Flow

```
DynamicWindow (K3 Plugin Entry)
  ├── Window3D (3D Scene)
  │   ├── Frame (ThreeJS Geometry)
  │   │   ├── Profile-based geometry
  │   │   └── Materials applied
  │   ├── Glass (Planes)
  │   ├── Handles (Custom models)
  │   ├── Muntins (Bars/Sprossen)
  │   ├── TransomFalight (Optional sections)
  │   ├── Shutters (Optional)
  │   ├── InsectScreen (Optional)
  │   └── Visualization overlay (if in edit mode)
  └── ConfigPanel (UI beneath 3D)
      ├── MaterialsPanel
      ├── WindowTypePanel
      ├── DimensionsPanel
      ├── ... (all config panels)
      └── visualization elements
```

### 4.2 Props Dialog (K3 Configuration UI)

The propsDialog for K3 will expose:
- **basic**: Standard K3 (position, rotation, scale, materials)
- **dimensions**: Width, height, depth inputs
- **window_type**: Window type selection
- **materials**: Material & color selectors
- **profile**: Profile picker
- **muntins**: Pattern & dimension selectors
- **hardware**: Handle selection/positioning
- **optional_features**: Checkboxes for transom, shutters, insect screen
- **advanced**: Opening type, glass type, etc.

---

## 5. State Management Strategy

### 5.1 Local State (React Context)
- Window configuration (all settings)
- UI state (active panel, selected tab)
- Edit mode vs. preview

**Why local**: Window state is specific to this instance, doesn't need global Redux.

### 5.2 Redux Integration (Optional)
- Only if features need to be shared across multiple windows
- Material library lookups (cached)
- Profile library (cached)
- Order history/saves

**Keep minimal**: Focus on local state first.

### 5.3 Context + useReducer Pattern

```typescript
// WindowContext provides:
// - configuration state
// - dispatch(action) to update state
// - memoized derived values (geometry, materials, etc.)
```

---

## 6. Geometry Building Strategy

### 6.1 Profile System
- **Profile Library**: Pre-defined shapes stored as 2D cross-sections
  - Each profile has: name, baseWidth, baseDepth, shape (THREE.Shape)
  - Profiles define frame appearance (chamfered, rounded, angled, etc.)

### 6.2 Frame Building
1. Load profile shape
2. Scale profile to configured width
3. Apply extrude operation along frame outline
4. Apply materials to faces (inside/outside)

### 6.3 Glass Panes
- Calculated from frame dimensions minus profile width
- Positioned inside frame
- Materials (transparency, color) applied

### 6.4 Muntins (Sprossen)
- Generated based on pattern + row/column count
- 3D bars positioned in glass plane
- Can be in front or within glass (configurable)

### 6.5 Other Components
- **Handles**: Position on frame, use K3 model references
- **Shutters**: Separate geometry positioned on/beside frame
- **Insect Screen**: Fine mesh material, positioned in front
- **Transom/Falight**: Additional window sections above/below main window

---

## 7. Performance Considerations

### 7.1 Memoization Strategy
- Memoize geometry creation (expensive)
- Memoize material creation
- Memoize calculated dimensions
- Use `useMemo` for all derived values

### 7.2 Lazy Loading
- Load handle models on demand (via K3 model references)
- Load profile library progressively if needed

### 7.3 Rendering
- Use instance rendering for muntins (if many)
- LOD (Level of Detail) for complex glass/shutters
- Avoid re-creating geometries on every render

---

## 8. Integration with K3

### 8.1 Plugin Export Structure
```typescript
// Plugin.tsx
export default {
  dynamicModels: [windowModel],
  // No other exports needed initially
} as K3Plugin;
```

### 8.2 DynamicModel Definition
```typescript
const windowModel: DynamicModel = {
  type: "windowPlugin",
  label: "Fenster Konfigulator",
  disabledForAR: false,  // Enable AR support
  component: DynamicWindow,
  propsDialog: { ... },
  defaultProps: { ... },
  materials: ["frameOutside", "frameInside", "glass"],
  screenshot: Image,
};
```

### 8.3 Material Handling
- K3 system provides `props.materials` object
- Map K3 materials to window regions:
  - `materials.frameOutside` → Frame exterior
  - `materials.frameInside` → Frame interior
  - `materials.glass` → Glass panes
  - Additional materials for special features (shutters, etc.)

### 8.4 Props from K3
- `props.position`, `props.rotation`, `props.scale` (standard)
- `props.width`, `props.height`, `props.depth` (dimensions)
- `props.materials` (Material-UI colors/materials object)
- `props.id` (instance ID for tracking)
- Custom props defined in `defaultProps`

---

## 9. Development Phases

### Phase 1: Foundation (MVP)
- [x] Project setup (Vite, module federation, types)
- [ ] Core window state & context
- [ ] Basic Frame geometry builder
- [ ] Glass panes rendering
- [ ] Basic 3D component integration
- [ ] Simple config panels (dimensions, window type)
- [ ] Material application

### Phase 2: Core Features
- [ ] Profile system + library
- [ ] Muntins (sprossen) builder
- [ ] Handles integration
- [ ] Opening type visualization
- [ ] Advanced config panels
- [ ] Optimization (memoization, lazy loading)

### Phase 3: Advanced Features
- [ ] Transom/Falight support
- [ ] Roller shutters
- [ ] Insect screen
- [ ] Advanced materials (decor, glass types)
- [ ] Preset library / saved configurations

### Phase 4: Polish & Optimization
- [ ] Error boundaries & error handling
- [ ] Performance optimization
- [ ] Camera focus/reset buttons
- [ ] Export/save configurations
- [ ] Testing (unit + e2e)

---

## 10. File Organization Principles

### 10.1 Keep It Flat (Like sample-plugin)
- All components in `src/components/` (one level)
- All utilities in `src/` root
- All types in single `types.ts` file
- All constants in single `constants.ts` file
- No nested folder hierarchies

**Not**:
```
❌ src/hooks/useWindowState.ts
❌ src/types/window.interface.ts
❌ src/utils/geometry/builders.ts
```

**Yes**:
```
✅ src/useWindowContext.ts
✅ src/types.ts
✅ src/geometryBuilders.ts
```

### 10.2 File Naming Conventions
- **Components**: `MyComponent.tsx` (e.g., `WindowFrame.tsx`)
- **Hooks**: `useMyHook.ts` (e.g., `useWindowContext.ts`)
- **Utilities**: `myUtility.ts` (e.g., `geometryBuilders.ts`)
- **Types**: Single `types.ts` file
- **Constants**: Single `constants.ts` file

### 10.3 File Size Guidelines
- **Keep files focused**: 100-300 lines is ideal
- **If a component file exceeds 300 lines**: Split into smaller components
- **Shared logic**: Extract to utils early

### 10.4 Export Strategy
Follow sample-plugin pattern:
```typescript
// ✅ Each component exports default for re-export
export const WindowFrame = (props: any) => { ... };

// ✅ Plugin.tsx re-exports all
import { Window } from "./Window";
import { ConfigPanel } from "./components/ConfigPanel";

export default {
  dynamicModels: [windowModel],
} as K3Plugin;
```

---

## 11. Key Implementation Details

### 11.1 Profile-Driven Frame
- Profiles are 2D shapes (cross-sections)
- Frame outline is a 3D path
- Extrude profile along path to create 3D frame
- Multiple materials on different faces

### 11.2 Opening Visualization
- Component that shows opening type (tilt-turn, sliding, etc.)
- Visual representation matching the screenshot
- Used in OpeningPanel and as overlay in 3D

### 11.3 Material Flow
- K3 provides colors via `props.materials`
- Apply K3 colors to frame outside, inside, glass
- Custom colors via config panels (stored in window config)
- Override K3 material with local config if needed

### 11.4 Handle Positioning
- Handles are linked to K3 models via `modelKey`
- Position/rotation stored in handle config
- K3 loads actual model geometry (GLB files)
- Window plugin positions them correctly

---

## 12. Future Extensibility

### 12.1 Plugin Extension Points
- Custom profile library loader
- Custom handle library/models
- Material variations (textures, special effects)
- Additional window types (special shapes, etc.)

### 12.2 Configuration Presets
- Save/load window configurations
- Template library
- Design suggestions based on input

### 12.3 Manufacturing Integration
- Generate cutting lists
- Material calculations
- Export to CAD formats
- Pricing engine integration

---

## 13. Testing Strategy

### 13.1 Unit Tests
- Geometry calculations (dimensions, positions)
- State reducers & hooks
- Material mappings
- Profile utilities

### 13.2 E2E Tests (Playwright)
- Load plugin in K3
- Configure window with various options
- Verify 3D rendering matches expectations
- Test material application
- Test interaction flows

### 13.3 Manual Testing
- Visual inspection of 3D output
- AR preview if supported
- Performance on different devices

---

## 14. Design Patterns

### 14.1 DRY for Config Panels
- Use a base panel component that handles common tasks
- Reusable input components for dimensions, colors, etc.
- Consistent styling via MUI theme

### 14.2 Separation of Concerns
- 3D rendering logic separate from config UI
- Geometry building separate from Three.js integration
- State management separate from components

### 14.3 Type Safety
- Leverage TypeScript strictly
- Type all props and state
- Share types between UI and 3D components

---

## 15. Error Handling & Robustness

### 15.1 Validation
- Validate dimension inputs (min/max)
- Prevent invalid state combinations
- User-friendly error messages

### 15.2 Error Boundaries
- Catch component rendering errors
- Display fallback UI
- Log to console for debugging

### 15.3 Graceful Degradation
- Handle missing handle models gracefully
- Fallback profiles if custom not available
- Disable features if dependencies unavailable

---

## Summary

This architecture provides:
1. ✅ **Clarity**: Clear folder structure and responsibility division
2. ✅ **Scalability**: Easy to add new features without refactoring existing code
3. ✅ **Performance**: Memoization and lazy loading built-in
4. ✅ **Maintainability**: Hooks-based state, separated concerns
5. ✅ **Integration**: Full compatibility with K3 plugin system
6. ✅ **Extensibility**: Open design for future enhancements

**Next Steps**: 
1. Set up project structure
2. Implement core hooks (useWindowState, useWindowGeometry)
3. Build basic Frame and Glass components
4. Create first config panel
5. Iterate through features based on priority

