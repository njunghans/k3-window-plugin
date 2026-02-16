# K3 Window Plugin - Data Flow & State Management

## 1. Data Flow Overview

### 1.1 User Action → State → Rendering

```
User Action (e.g., change width)
    ↓
Config Panel Event Handler
    ↓
Context Dispatch (action + payload)
    ↓
State Reducer updates window configuration
    ↓
Context re-renders (due to state change)
    ↓
Component re-renders with new state
    ↓
Geometry builders receive new props from state
    ↓
Geometry computation (memoized, only if inputs changed)
    ↓
Three.js mesh updated with new geometry/material
    ↓
Canvas re-renders with new 3D scene
```

---

## 2. State Architecture

### 2.1 Single Source of Truth: WindowContext

```typescript
// Single context that contains ALL window configuration
// Created in DynamicWindow component
// Consumed by Window3D and all Config Panels

interface WindowContextValue {
  // Current configuration state
  config: WindowConfiguration;
  
  // Dispatch actions to update state
  dispatch: (action: WindowAction) => void;
  
  // Derived/computed values (memoized)
  computedGeometry: {
    frameGeometry: THREE.BufferGeometry | null;
    glassGeometry: THREE.BufferGeometry | null;
    muntinsGeometry: THREE.BufferGeometry | null;
    // ... other geometries
  };
  
  // UI state
  ui: {
    activeTab: string;
    selectedProfile: ProfileConfig | null;
  };
}
```

### 2.2 Why Not Redux?

✅ **Using Context + useReducer instead of Redux:**
- Window configuration is instance-specific (not global)
- No need to share state across multiple windows (each plugin instance is independent)
- Simpler setup, less boilerplate
- Better performance (localized state updates don't affect other components)
- K3 provides Redux for cross-plugin needs (materials, rules, etc.)

✅ **K3 Redux integration (when needed):**
- Read material definitions from Redux (if stored there)
- Read cached profile library (optional optimization)
- Future: save configurations to Redux state

---

## 3. State Actions & Reducer

### 3.1 Window Configuration Actions

```typescript
type WindowAction = 
  // Dimensions
  | { type: 'SET_DIMENSIONS'; payload: { width: number; height: number; depth: number } }
  | { type: 'SET_WIDTH'; payload: number }
  | { type: 'SET_HEIGHT'; payload: number }
  | { type: 'SET_DEPTH'; payload: number }
  
  // Window type
  | { type: 'SET_WINDOW_TYPE'; payload: WindowType }
  
  // Materials & Colors
  | { type: 'SET_FRAME_MATERIAL'; payload: FrameMaterial }
  | { type: 'SET_FRAME_OUTSIDE_COLOR'; payload: string }
  | { type: 'SET_FRAME_INSIDE_COLOR'; payload: string }
  
  // Profile
  | { type: 'SET_PROFILE'; payload: ProfileConfig }
  
  // Muntins
  | { type: 'SET_MUNTINS'; payload: MuntinsConfig }
  | { type: 'DISABLE_MUNTINS'; payload: null }
  
  // Handles
  | { type: 'ADD_HANDLE'; payload: HandleConfig }
  | { type: REMOVE_HANDLE'; payload: string }
  | { type: 'UPDATE_HANDLE'; payload: { id: string; config: Partial<HandleConfig> } }
  
  // Opening
  | { type: 'SET_OPENING'; payload: OpeningType }
  
  // Optional features
  | { type: 'ENABLE_TRANSOM'; payload: TransomConfig }
  | { type: 'DISABLE_TRANSOM'; payload: null }
  | { type: 'ENABLE_FALIGHT'; payload: FalightConfig }
  | { type: 'DISABLE_FALIGHT'; payload: null }
  | { type: 'ENABLE_SHUTTERS'; payload: ShuttersConfig }
  | { type: 'DISABLE_SHUTTERS'; payload: null }
  | { type: 'ENABLE_INSECT_SCREEN'; payload: InsectScreenConfig }
  | { type: 'DISABLE_INSECT_SCREEN'; payload: null }
  
  // Batch updates
  | { type: 'SET_CONFIG'; payload: WindowConfiguration }
  | { type: 'RESET_TO_DEFAULTS'; payload: null }
```

### 3.2 Reducer Implementation Pattern

```typescript
const windowReducer = (state: WindowConfiguration, action: WindowAction) => {
  switch (action.type) {
    case 'SET_WIDTH':
      return {
        ...state,
        width: Math.max(MIN_WINDOW_WIDTH, action.payload),
      };
    case 'SET_FRAME_MATERIAL':
      return {
        ...state,
        frame: action.payload,
      };
    // ... other cases
    default:
      return state;
  }
};
```

---

## 4. Props Flow Through Components

### 4.1 From K3 to DynamicWindow

```
K3 System provides props to DynamicWindow:
  - props.position, props.rotation, props.scale (standard positioning)
  - props.width, props.height, props.depth (dimensions as expressions)
  - props.materials (K3 material object with colors)
  - props.id (instance ID)
  - Custom props from propsDialog (window type, profile, etc.)

DynamicWindow unpacks these and:
  - Creates initial window configuration
  - Passes to context provider
  - Passes K3 materials to 3D component
```

### 4.2 From Context to Window3D

```
WindowContext provides:
  - Full configuration object
  - Dispatch function for updates
  - Computed geometries (memoized)

Window3D receives via useContext:
  - Reads configuration
  - Uses geometries for rendering
  - Applies K3 materials
```

### 4.3 From Context to Config Panels

```
Each Panel (e.g., DimensionsPanel):
  - Reads needed state: useContext > config
  - On user input: dispatch action to update
  - Context updates config
  - Window3D re-renders with new geometry

Example:
  const { config, dispatch } = useWindowContext();
  
  <input 
    value={config.width}
    onChange={(e) => dispatch({ 
      type: 'SET_WIDTH', 
      payload: parseFloat(e.target.value) 
    })}
  />
```

---

## 5. Computed Values & Memoization

### 5.1 What to Memoize

```typescript
// 1. Geometry building (heavy computation)
const frameGeometry = useMemo(() => {
  return buildFrameGeometry(config);
}, [config.width, config.height, config.depth, config.profile]);

// 2. Dimensions calculations
const innerDimensions = useMemo(() => {
  return {
    width: config.width - config.profile.width * 2,
    height: config.height - config.profile.width * 2,
  };
}, [config.width, config.height, config.profile]);

// 3. Material objects
const frameMaterial = useMemo(() => {
  return createMaterial(config.frame, k3Materials);
}, [config.frame, k3Materials]);

// 4. Derived configurations
const glassPaneCount = useMemo(() => {
  return getGlassPaneCount(config.type);
}, [config.type]);
```

### 5.2 Context Value Memoization

```typescript
// In DynamicWindow or context provider
const contextValue = useMemo(() => ({
  config,
  dispatch,
  computedGeometry,
  ui,
}), [config, computedGeometry, ui]);

return (
  <WindowContext.Provider value={contextValue}>
    {children}
  </WindowContext.Provider>
);
```

---

## 6. K3 Materials Integration

### 6.1 Material Flow

```
K3 System (Redux)
  ↓
Provides props.materials = { 
  frameOutside: Color, 
  frameInside: Color, 
  glass: Color 
}
  ↓
DynamicWindow passes to Window3D
  ↓
Window3D uses materials when applying to geometries

// Example:
const frameOutsideMaterial = new THREE.MeshStandardMaterial({
  color: k3Materials.frameOutside,
  roughness: 0.1,
  metalness: 0.2,
});

<mesh geometry={frameGeometry} material={frameOutsideMaterial} />
```

### 6.2 Material Override Strategy

```typescript
// Local config can override K3 materials if needed
const getFrameOutsideColor = (
  k3Color: string,
  localConfig: FrameMaterial
) => {
  // Option 1: Use local color if explicitly set
  if (localConfig.decorOutside && localConfig.decorOutside !== 'default') {
    return localConfig.decorOutside;
  }
  
  // Option 2: Fallback to K3 color
  return k3Color;
};
```

---

## 7. Geometry Building Pattern

### 7.1 Builder Function Structure

```typescript
interface GeometryInput {
  // Dimensions
  width: number;
  height: number;
  depth: number;
  
  // Configuration
  profile: ProfileConfig;
  windowType: WindowType;
  
  // Materials
  materials: {
    outside: Material;
    inside: Material;
  };
}

// Pure function, no state dependencies
function buildFrameGeometry(input: GeometryInput): THREE.BufferGeometry {
  // 1. Create profile shape
  const profileShape = getProfileShape(input.profile);
  
  // 2. Create frame path (based on window type)
  const framePath = createFramePath(input.width, input.height, input.windowType);
  
  // 3. Extrude profile along path
  const geometry = new THREE.ExtrudeGeometry(profileShape, {
    extrudePath: framePath,
  });
  
  // 4. Apply transformations
  geometry.center();
  
  return geometry;
}
```

### 7.2 Memoization in Hooks

```typescript
// useWindowGeometry.ts
export const useWindowGeometry = () => {
  const { config } = useWindowContext();
  
  const frameGeometry = useMemo(() => {
    return buildFrameGeometry({
      width: config.width,
      height: config.height,
      depth: config.depth,
      profile: config.profile,
      windowType: config.type,
      materials: {}, // will be passed separately
    });
  }, [config.width, config.height, config.depth, config.profile, config.type]);
  
  const glassGeometry = useMemo(() => {
    return buildGlassGeometry({
      width: config.width,
      height: config.height,
      profile: config.profile,
      windowType: config.type,
    });
  }, [config.width, config.height, config.profile, config.type]);
  
  return { frameGeometry, glassGeometry };
};
```

---

## 8. Component Re-rendering Strategy

### 8.1 Minimize Re-renders

```typescript
// ❌ BAD: Creates new function on every render
<DimensionsPanel 
  onChange={(width) => dispatch({ type: 'SET_WIDTH', payload: width })}
/>

// ✅ GOOD: Memoize callback
const handleWidthChange = useCallback(
  (width: number) => dispatch({ type: 'SET_WIDTH', payload: width }),
  [dispatch] // dispatch is stable
);
<DimensionsPanel onChange={handleWidthChange} />

// ✅ BETTER: Dispatch actions from panels directly
const { dispatch } = useWindowContext();
// In event handler, just dispatch
dispatch({ type: 'SET_WIDTH', payload: width });
```

### 8.2 Component Splitting for Performance

```typescript
// Split into separate components so only relevant ones re-render
<DynamicWindow>
  <Window3D />              {/* Re-renders only when geometry/materials change */}
  <ConfigPanel>
    <DimensionsPanel />     {/* Re-renders independent of 3D */}
    <MaterialsPanel />      {/* Re-renders independent of 3D */}
    <WindowTypePanel />
  </ConfigPanel>
</DynamicWindow>
```

---

## 9. Handling K3 Props Changes

### 9.1 When Props from K3 Change

```typescript
// In DynamicWindow or useEffect
useEffect(() => {
  // If K3 props (like dimensions) change externally,
  // update our local state
  
  if (k3Width !== currentConfig.width) {
    dispatch({ type: 'SET_WIDTH', payload: k3Width });
  }
}, [k3Width, currentConfig.width]);
```

### 9.2 Bidirectional Sync Strategy

```typescript
// Initialize from K3 props
const getInitialConfig = (k3Props: any): WindowConfiguration => {
  return {
    width: parseFloat(k3Props.width?.expression || '1000'),
    height: parseFloat(k3Props.height?.expression || '1200'),
    depth: parseFloat(k3Props.depth?.expression || '80'),
    // ... other fields from K3 props
    // ... or use defaults
  };
};

// Later, if needed, sync back to K3 via props onChange
const syncToK3 = (config: WindowConfiguration) => {
  // Call K3 prop update functions if needed
  // props.onChange?.('width')({ expression: config.width.toString() });
};
```

---

## 10. Error Handling in State Management

### 10.1 Validation in Reducer

```typescript
const windowReducer = (state: WindowConfiguration, action: WindowAction) => {
  switch (action.type) {
    case 'SET_WIDTH': {
      const width = action.payload;
      
      // Validate
      if (width < MIN_WINDOW_WIDTH || width > MAX_WINDOW_WIDTH) {
        console.warn(`Invalid width: ${width}, keeping ${state.width}`);
        return state; // Don't update invalid state
      }
      
      return { ...state, width };
    }
    // ... other cases
  }
};
```

### 10.2 Error Boundary for Components

```typescript
// Wrap in error boundary at DynamicWindow level
<PluginErrorBoundary>
  <DynamicWindow {...props} />
</PluginErrorBoundary>
```

---

## 11. Future State Evolution

### 11.1 When to Consider Redux

- If multiple window instances need shared state (unlikely)
- If configuration needs to persist across sessions
- If configuration library becomes large

### 11.2 Configuration Persistence

```typescript
// Save to localStorage
useEffect(() => {
  localStorage.setItem('windowConfig', JSON.stringify(config));
}, [config]);

// Load on init
const savedConfig = localStorage.getItem('windowConfig');
const initialConfig = savedConfig 
  ? JSON.parse(savedConfig) 
  : getDefaultConfig();
```

### 11.3 Undo/Redo Support

```typescript
// With useReducer, can implement undo with history array
const [history, setHistory] = useState<WindowConfiguration[]>([initialConfig]);
const [historyIndex, setHistoryIndex] = useState(0);

const dispatch = (action: WindowAction) => {
  const newConfig = windowReducer(history[historyIndex], action);
  
  // Remove any forward history when new action taken
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(newConfig);
  
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
};

const undo = () => setHistoryIndex(Math.max(0, historyIndex - 1));
const redo = () => setHistoryIndex(Math.min(history.length - 1, historyIndex + 1));
```

---

## 12. Testing State Management

### 12.1 Unit Tests for Reducer

```typescript
// ✅ Test reducer in isolation
describe('windowReducer', () => {
  it('sets width correctly', () => {
    const state = getInitialConfig();
    const action = { type: 'SET_WIDTH', payload: 1200 };
    
    const result = windowReducer(state, action);
    
    expect(result.width).toBe(1200);
    expect(result).not.toBe(state); // Immutability
  });
  
  it('rejects invalid width', () => {
    const state = getInitialConfig();
    const action = { type: 'SET_WIDTH', payload: 50 }; // Too small
    
    const result = windowReducer(state, action);
    
    expect(result).toBe(state); // No change
  });
});
```

### 12.2 Component Tests with Context

```typescript
// ✅ Test component with context provider
const renderWithContext = (component: React.ReactElement) => {
  return render(
    <WindowContextProvider>
      {component}
    </WindowContextProvider>
  );
};

test('dimension panel updates width', () => {
  const { getByDisplayValue } = renderWithContext(<DimensionsPanel />);
  
  const input = getByDisplayValue('1000');
  fireEvent.change(input, { target: { value: '1200' } });
  
  // Should update context and trigger geometry recalculation
});
```

