# K3 Window Plugin - Quick Reference & Design Decisions

## Key Architectural Decisions

### 1. State Management: Context + useReducer (NOT Redux)
**Decision**: Use React Context + useReducer pattern instead of Redux
**Rationale**:
- Window configuration is instance-specific, not global
- Each plugin instance is independent
- Simpler setup, less boilerplate
- Better performance (localized updates)

**Implementation**:
```typescript
// src/hooks/useWindowContext.ts
export const useWindowContext = () => {
  const context = useContext(WindowContext);
  if (!context) throw new Error('useWindowContext must be used within provider');
  return context;
};
```

---

### 2. Geometry Building: Pure Functions + Memoization
**Decision**: Build geometries with pure, side-effect-free functions
**Rationale**:
- Testable in isolation
- Reusable across components
- Easy to optimize with memoization
- Clear dependency tracking

**Pattern**:
```typescript
// Pure function
function buildFrameGeometry(config: FrameGeometryInput): THREE.BufferGeometry {
  // No side effects, pure computation
}

// Memoized in hook
const frameGeometry = useMemo(
  () => buildFrameGeometry(config),
  [config.width, config.height, config.profile] // explicit dependencies
);
```

---

### 3. Component Organization: By Feature/Domain, Not Type
**Decision**: Group components by what they do, not their type
**Bad**: 
```
components/
  ├── 3D/
  ├── Panels/
  ├── Inputs/
  └── ...
```

**Good**:
```
components/
  ├── Window3D/        # Everything related to 3D window
  │   ├── Frame.tsx
  │   ├── Glass.tsx
  │   └── ...
  ├── ConfigPanel/     # Configuration UI
  │   ├── DimensionsPanel.tsx
  │   └── ...
```

---

### 4. Props Dialog Strategy: Layered Complexity
**K3 propsDialog will expose**:
1. **basic**: Standard positioning (position, rotation, scale, materials)
2. **dimensions**: Window dimensions (width, height, depth)
3. **type**: Window type selection
4. **Other specialized panels**: Profile, muntins, handles, etc.

This allows users to:
- Use basic configuration in K3 UI (what they're familiar with)
- Use advanced configuration in the plugin's own UI (more intuitive)

---

### 5. Material Flow: K3 Materials + Local Config
**Decision**: K3 provides base colors; local config can override/extend
**Pattern**:
```typescript
// K3 provides colors
const k3Colors = props.materials;

// Local config can override
const frameColor = config.frame.colorOutside || k3Colors.frameOutside;

// Apply to Three.js material
const material = new THREE.MeshStandardMaterial({ color: frameColor });
```

**Benefits**:
- Consistent with K3 system
- Local configs for special requirements
- Fallback to defaults if needed

---

### 6. Profile System: Library + Configuration
**Decision**: Store profile definitions in a library; reference from config
**Not**: Store full geometry details in config
**Pattern**:
```typescript
// Profile library (constants)
const PROFILE_LIBRARY = {
  'modern-slim': { ... },
  'traditional-wide': { ... },
};

// Configuration just references
interface ProfileConfig {
  profileKey: string;  // 'modern-slim', etc.
  width: number;       // Frame width (overridable)
}
```

**Benefits**:
- Easy profile updates across instances
- Reusable profiles
- Validation against known profiles
- Future: remote profile loading

---

### 7. Error Handling: Error Boundary + Validation
**Decision**: Multiple layers of error handling
1. Reducer validates state changes (no invalid states)
2. Components validate user input (min/max constraints)
3. Error boundary catches render errors
4. Graceful degradation for missing dependencies

**Pattern**:
```typescript
// Reducer validation
case 'SET_WIDTH': {
  if (payload < MIN_WIDTH || payload > MAX_WIDTH) {
    return state; // Reject invalid change
  }
  return { ...state, width: payload };
}

// Component input validation
<input 
  value={config.width}
  onChange={(e) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return; // Reject invalid input
    dispatch({ type: 'SET_WIDTH', payload: val });
  }}
/>
```

---

### 8. Performance: Memoization First, Not Last
**Decision**: Plan memoization from the start, not as an afterthought
**Components to memoize early**:
- Context value (memoize with useMemo)
- Geometry builders (pure functions)
- Material objects
- Callback handlers (useCallback)

**Benchmarking**:
```typescript
// Use React DevTools Profiler to identify bottlenecks
// Optimize only after measurement, not assumptions
```

---

### 9. Testing Strategy: Unit First, E2E Second
**Priorities**:
1. \*\*Unit tests** (pure functions, reducers)
2. **Component tests** (isolated with context)
3. **E2E tests** (full plugin in K3)

**Why**:
- Unit tests catch logic errors early
- E2E tests ensure K3 integration works
- Fast local feedback loop

---

### 10. K3 Integration: Treat as External System
**Decision**: De-couple plugin logic from K3 specifics
**Pattern**:
```typescript
// ✅ GOOD: Plugin is independent
// Plugin receives K3 props, uses what it needs
// Can test/develop without K3

// ❌ BAD: Plugin tightly coupled to K3
// K3 reducer actions directly in plugin
// Can't test without K3 environment
```

---

## Common Patterns to Follow

### Pattern 1: Configuration Actions
```typescript
// All state changes go through dispatch
// Never mutate state directly
// Dispatch includes type + payload

const handleWidthChange = (newWidth: number) => {
  dispatch({ type: 'SET_WIDTH', payload: newWidth });
};
```

### Pattern 2: Derived Values
```typescript
// Never compute in render
// Always use useMemo
// List all dependencies explicitly

const glassWidth = useMemo(() => {
  return config.width - (config.profile.width * 2);
}, [config.width, config.profile.width]);
```

### Pattern 3: Combining Dependencies
```typescript
// When multiple hooks need same deps, combine them
const [frameGeo, glassGeo, muntinGeo] = useMemo(() => {
  return [
    buildFrameGeometry(config),
    buildGlassGeometry(config),
    buildMuntinsGeometry(config),
  ];
}, [config.width, config.height, config.profile, config.type]);
```

### Pattern 4: UI State Separation
```typescript
// Separate UI state from data state
const [config, dispatchConfig] = useReducer(windowReducer, initialConfig);
const [ui, dispatchUI] = useReducer(uiReducer, initialUI);

// Return both
return (
  <WindowContext.Provider value={{ config, dispatchConfig, ui, dispatchUI }}>
    {children}
  </WindowContext.Provider>
);
```

## Naming Conventions

### Files
- Components: `MyComponent.tsx`
- Hooks: `useMyHook.ts`
- Utilities: `myUtility.ts` or `my-utility.ts`
- Types: `myType.interface.ts`
- Constants: stored in `utils/constants.ts`

### Functions
- Handlers: `handleXxx` (e.g., `handleWidthChange`)
- Builders: `buildXxx` (e.g., `buildFrameGeometry`)
- Getters: `getXxx` (e.g., `getProfileShape`)
- Selectors: `selectXxx` (e.g., `selectFrameConfig`)

### Types
- Interfaces: `MyInterfaceName` (PascalCase)
- Types: `MyTypeName` (PascalCase)
- Unions: `MyType = 'option1' | 'option2'`
- Functions: `(args) => ReturnType`

### Constants
```typescript
const WINDOW_MIN_WIDTH = 400;        // UPPERCASE_SNAKE_CASE
const DEFAULT_PROFILE = 'modern';    // UPPERCASE_SNAKE_CASE
const ASPECT_RATIO = 16 / 9;         // UPPERCASE_SNAKE_CASE
```

## Project Rules to Remember

### TypeScript
- [ ] Strict mode enabled
- [ ] No `any` types (use `unknown` if needed, then cast)
- [ ] Explicit return types on functions
- [ ] No implicit `any`

### React
- [ ] All interactive MUI components must have `data-cy` attributes
- [ ] No inline functions (use useCallback)
- [ ] No inline objects in useEffect dependencies
- [ ] Always list dependencies explicitly

### Code Quality
- [ ] ESLint passes cleanly
- [ ] Prettier auto-formatting
- [ ] No console.log in production code
- [ ] No commented-out code blocks
- [ ] Meaningful variable names

### Performance
- [ ] Memoize geometry builders
- [ ] Memoize context values
- [ ] useCallback for event handlers
- [ ] Avoid creating new objects in render
- [ ] Profile regularly with React DevTools

---

## Debugging Tips

### Issue: 3D scene not updating
**Check**:
1. Did reducer actually update state?
2. Is context provider wrapping components?
3. Are dependencies correct in useMemo?
4. Is Three.js material/geometry reference current?

```typescript
// Debug reducer
console.log('State before:', state);
console.log('Action:', action);
const newState = windowReducer(state, action);
console.log('State after:', newState);
```

### Issue: Component re-rendering too much
**Check**:
1. Is context value properly memoized?
2. Are callbacks wrapped in useCallback?
3. Check React DevTools Profiler
4. Are dependent components too far up tree?

### Issue: Geometry not generated correctly
**Check**:
1. Are input values correct? (console.log inputs)
2. Is profile loaded? (check PROFILE_LIBRARY)
3. Are Three.js utility functions called correctly?
4. Try creating geometry in simple test file first

---

## Quick Commands

```bash
# Development
pnpm install
pnpm dev                # Start dev server

# Building
pnpm build              # Full build
pnpm build --watch     # Watch mode

# Testing
pnpm test               # Unit tests
pnpm test --coverage   # With coverage report

# Linting
pnpm lint              # Run ESLint
pnpm lint:fix          # Auto-fix issues

# Serving
pnpm serve             # Serve built files on port 5002
```

---

## When to Refactor

### Good Times:
- ✅ After implementing a phase, before moving to next
- ✅ When adding same pattern for 3rd time
- ✅ When code gets > 200 lines in single file
- ✅ When tests start feeling fragile

### Not a Good Time:
- ❌ Mid-feature implementation
- ❌ Right before user demo
- ❌ When you don't have tests covering the code
- ❌ When you don't fully understand what the code does

---

## Helpful Resources

### K3 Documentation
- K3 Architecture: `/Users/ninojunghans/Projects/Konfigurator3/ARCHITECTURE.md`
- K3 Plugin API: `node_modules/k3-plugin-api/index.d.ts`
- Redux Patterns: `/readmes/redux.md`
- Rule Engine: `/readmes/rule-engine.md`

### React/Three.js
- React 19 docs: https://react.dev
- Three.js docs: https://threejs.org/docs
- react-three/fiber: https://docs.pmnd.rs/react-three-fiber
- react-three/drei: https://github.com/pmndrs/drei

### External Tools
- TypeScript Playground: https://www.typescriptlang.org/play
- Three.js Playground: https://threejs.org/editor
- Regex tester: https://regex101.com

