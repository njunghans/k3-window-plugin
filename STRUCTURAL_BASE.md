# K3 Window Plugin - Structural Base (k3-sample-plugin)

## How We're Mirroring k3-sample-plugin

### k3-sample-plugin Structure (Our Base)

```
k3-sample-plugin/
├── src/
│   ├── Plugin.tsx           # Main export ← WE DO THIS
│   ├── DynamicRing.tsx      # Main component (3D model definition)
│   ├── Ring.tsx             # 3D geometry builder ← WE DO THIS
│   ├── Diamond.tsx          # Optional sub-component
│   ├── ColorChooser.tsx     # Variable template (config UI)
│   ├── PriceDisplay.tsx     # Layout component
│   ├── main.tsx             # Empty (not used)
│   └── vite-env.d.ts
├── public/
│   └── Image.png            # Plugin screenshot
├── vite.config.ts           # Module federation config
└── package.json
```

**Total**: ~600 lines of plugin code

### Window Plugin Structure (Extended from Sample)

```
k3-window-plugin/
├── src/
│   ├── Plugin.tsx           # Main export (same pattern as DynamicRing.tsx export)
│   ├── Window.tsx           # Main component (like DynamicRing.tsx)
│   ├── types.ts             # Type definitions
│   ├── constants.ts         # Profile library, enums
│   ├── utils.ts             # Helper functions
│   ├── geometryBuilders.ts  # Geometry functions (like Ring.tsx but more)
│   ├── useWindowContext.ts  # Windows-specific hooks
│   ├── useWindowGeometry.ts # Geometry calculation hooks
│   ├── components/          # (Like ColorChooser.tsx - UI components)
│   │   ├── WindowFrame.tsx  # 3D component
│   │   ├── WindowGlass.tsx  # 3D component
│   │   ├── WindowMuntins.tsx
│   │   ├── ...other features...
│   │   ├── ConfigPanel.tsx  # Main config UI (like ColorChooser pattern)
│   │   ├── MaterialsPanel.tsx
│   │   ├── DimensionsPanel.tsx
│   │   ├── WindowTypePanel.tsx
│   │   └── ...other panels...
│   └── main.tsx             # Empty
├── public/
│   └── screenshot.png       # Plugin screenshot
├── vite.config.ts
└── package.json
```

**Key Differences**:
- **Sample**: 5-6 files, simple product
- **Window**: ~20 files, complex product
- **Both**: Keep everything in `src/` root (flat structure)
- **Both**: Single main component (DynamicRing → Window)

---

## Mapping to Sample-Plugin Patterns

### 1. Plugin Export Pattern

**k3-sample-plugin/src/Plugin.tsx**:
```typescript
import { DynamicModel } from "k3-plugin-api";
import { dynamicRing } from "./DynamicRing";
import { ColorChooser } from "./ColorChooser";
import { PriceDisplay } from "./PriceDisplay";

export default {
  dynamicModels: [dynamicRing],
  variableTemplates: [{ key: "colorChooser", ... }],
  layoutComponents: { PriceDisplay },
} as K3Plugin;
```

**k3-window-plugin/src/Plugin.tsx** (same pattern):
```typescript
import { K3Plugin, DynamicModel } from "k3-plugin-api";
import { windowModel } from "./Window";
import { ConfigPanel } from "./components/ConfigPanel";

export default {
  dynamicModels: [windowModel],
  // layoutComponents: { ConfigPanel }, // OR use as embedded UI
} as K3Plugin;
```

**Lesson**: Single root export that constructs plugin definition

---

### 2. Main Component Pattern

**k3-sample-plugin/src/DynamicRing.tsx**:
```typescript
const WeddingRing = (props: any) => {
  return (
    <group position={props.position} scale={[props.width, ...]}>
      <Ring
        radius={props.radius}
        segmentCount={props.segmentCount}
        vGap={props.vGap}
        materials={props.materials}
      />
    </group>
  );
};

export const dynamicRing: DynamicModel = {
  type: "ringPlugin",
  label: "Ehering",
  component: WeddingRing,
  propsDialog: { ... },
  defaultProps: { ... },
  materials: ["outer", "inner"],
  screenshot: Image,
};
```

**k3-window-plugin/src/Window.tsx** (same pattern):
```typescript
const DynamicWindow = (props: any) => {
  return (
    <WindowContextProvider config={initialConfig}>
      <group position={props.position} scale={[props.width, ...]}>
        <Window3DScene
          width={props.width}
          height={props.height}
          materials={props.materials}
        />
        <ConfigPanel />
      </group>
    </WindowContextProvider>
  );
};

export const windowModel: DynamicModel = {
  type: "windowPlugin",
  label: "Fenster Konfigulator",
  component: DynamicWindow,
  propsDialog: { ... },
  defaultProps: { ... },
  materials: ["frameOutside", "frameInside", "glass"],
  screenshot: Image,
};
```

**Lesson**: Define component separately, wrap in DynamicModel definition

---

### 3. Geometry Builder Pattern

**k3-sample-plugin/src/Ring.tsx**:
```typescript
export const Ring = (props: any) => {
  const shape1 = new THREE.Shape();
  // ... build geometry ...
  
  return (
    <group {...props}>
      <Segment shape={shape1} ... />
      <Segment shape={shape2} ... />
    </group>
  );
};
```

**k3-window-plugin/src/components/WindowFrame.tsx** (same pattern):
```typescript
export const WindowFrame = (props: any) => {
  const geometry = useMemo(
    () => buildFrameGeometry({
      width: props.width,
      profile: props.profile,
      // ...
    }),
    [props.width, props.profile, ...]
  );
  
  return <mesh geometry={geometry} material={props.material} />;
};
```

**Lesson**: Build geometries directly in components (or in utility functions for reuse)

---

### 4. Configuration UI Pattern

**k3-sample-plugin/src/ColorChooser.tsx**:
```typescript
export const ColorChooser = () => (props: any) => {
  return (
    <Stack direction="row" gap={3}>
      <Input
        type="color"
        value={props.selection?.data?.inputText || "#000000"}
        onChange={(e) =>
          props.onChange(props.value.id, { inputText: e.target.value })
        }
      />
      <TextField
        value={props.selection?.data?.inputText}
        label={props.variable.label}
        disabled
        fullWidth
      />
    </Stack>
  );
};
```

**k3-window-plugin/src/components/MaterialsPanel.tsx** (similar pattern):
```typescript
export const MaterialsPanel = () => {
  const { config, dispatch } = useWindowContext();
  
  return (
    <Stack gap={2}>
      <Input
        type="color"
        value={config.frame.colorOutside}
        onChange={(e) => 
          dispatch({
            type: 'SET_FRAME_OUTSIDE_COLOR',
            payload: e.target.value
          })
        }
      />
      <Input
        type="color"
        value={config.frame.colorInside}
        onChange={(e) => 
          dispatch({
            type: 'SET_FRAME_INSIDE_COLOR',
            payload: e.target.value
          })
        }
      />
    </Stack>
  );
};
```

**Lesson**: Simple functional components, use hooks for state, local dispatch

---

### 5. File Count Comparison

| Component | Sample | Window Plugin | Reason |
|-----------|--------|---------------|--------|
| Plugin.tsx | 1 | 1 | Same export pattern |
| Main component | 1 (DynamicRing) | 1 (Window) | Single dynamic model |
| 3D geometry | 2 (Ring, Diamond) | 7+ (Frame, Glass, Muntins, Handles, Shutters, TransomFalight, InsectScreen) | More complex product |
| Config UI | 2 (ColorChooser, PriceDisplay) | 8+ (Materials, Dimensions, WindowType, Profile, Muntins, Handles, Opening, Shutters) | More configuration options |
| Layout/layout | 0 | 1 (ConfigPanel) | Could be optional |
| Utilities | 0 | 3 (types.ts, constants.ts, utils.ts, geometryBuilders.ts) | More math/logic needed |
| Hooks | 0 | 2 (useWindowContext, useWindowGeometry) | State management |
| **TOTAL** | **~6** | **~20** | **3-4x complexity** |

---

## Principles from k3-sample-plugin to Follow

### ✅ Do This
1. **Keep `src/` flat** - No deep folder hierarchies
2. **Simple file names** - ComponentName.tsx, not ComponentName/index.tsx
3. **Single Plugin export** - One Plugin.tsx with all definitions
4. **Props as any** - Use `props: any` initially, type as needed
5. **Use MUI directly** - Import Stack, Input, TextField, etc.
6. **data-cy attributes** - Add for testing (Cypress/Playwright)

### ❌ Don't Do This
1. **Don't create folders for 1-2 files**
2. **Don't create index.ts barrel exports** (simple direct imports)
3. **Don't over-engineer types initially** - Start with `any`, refine later
4. **Don't create utility folders** - Keep utils in single utils.ts

### 📖 Learn From Sample
1. How module federation is configured (`vite.config.ts`)
2. How `K3Plugin` is structured
3. How `DynamicModel` is defined
4. How props flow from K3 to component
5. How shared dependencies are configured

---

## Structure Checklist Before Starting

- [ ] Confirm `src/` structure matches pattern (flat, ~20 files)
- [ ] Confirm single `Plugin.tsx` export
- [ ] Confirm main component (Window.tsx) exports `windowModel`
- [ ] Confirm `vite.config.ts` matches sample structure
- [ ] Confirm types.ts consolidates interfaces
- [ ] Confirm constants.ts has profile library
- [ ] Confirm /components folder has all UI components

---

## Quick File Reference

### Files to Create (Phase 1)

```typescript
// Core plugin
src/Plugin.tsx                    // ← START HERE (copy DynamicRing pattern)
src/Window.tsx                    // ← Main 3D component
src/useWindowContext.ts           // ← State management

// UI
src/components/WindowFrame.tsx    // ← 3D geometry (like Ring.tsx)
src/components/WindowGlass.tsx    // ← 3D geometry
src/components/ConfigPanel.tsx    // ← Main config UI container

// Utilities & Data
src/types.ts                      // ← All type definitions
src/constants.ts                  // ← Profile library + enums
src/geometryBuilders.ts           // ← Pure geometry functions
```

### Files to Adapt from Sample

```
vite.config.ts                    # Copy from sample, change module name
package.json                      # Copy from sample, update name + version
tsconfig.json                     # Use same config
eslint.config.js                  # Use same config
```

