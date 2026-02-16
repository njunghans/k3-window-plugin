# K3 Window Plugin - Project Planning Summary

## Executive Summary

We're building a **K3 Window Configurator Plugin** - a comprehensive 3D window configuration tool that enables window sellers to design custom windows with full control over:

- **Structural**: Window type (1/2/3-part), dimensions, profiles, muntins
- **Materials**: Frames, glass, colors (inside/outside)
- **Hardware**: Handles, opening types, shutters, screens
- **Accessories**: Transom/falight windows

The plugin is **independent**, **performant**, and **maintainable** through careful architecture decisions.

---

## Architecture Highlights

### ✅ State Management
- **Context + useReducer** (not Redux) for instance-specific configuration
- Single source of truth in `WindowContext`
- Actions dispatched from UI → State updated → 3D re-renders

### ✅ Data Model
- **WindowConfiguration** interface defines all user-configurable properties
- **ProfileConfig** references profile library (not storing geometry)
- **MuntinsConfig, FrameMaterial, HandleConfig**, etc. for each feature

### ✅ 3D Rendering
- **Profile-based frame building** - profiles are 2D shapes, extruded along frame path
- **Memoized geometry builders** - pure functions that compute Three.js geometries
- **Material application** - K3 materials + local config overrides

### ✅ Component Hierarchy
- **DynamicWindow** - K3 plugin entry point
- **Window3D** - Three.js rendering (frame, glass, handles, etc.)
- **ConfigPanel** - User configuration UI (tabbed/accordion)
- **Specialized sub-components** - Frame, Glass, Muntins, Shutters, etc.

### ✅ K3 Integration
- Exposes single **DynamicModel** with propsDialog for K3 UI
- Receives dimensions, materials, positioning from K3
- Renders in K3's Canvas (react-three-fiber)
- Applies K3 materials to window components

---

## File Organization

```
k3-window-plugin/
├── src/
│   ├── Plugin.tsx              # K3 plugin export
│   ├── Window.tsx              # Main 3D component
│   ├── types.ts                # All TypeScript interfaces
│   ├── constants.ts            # Profile library, enums, limits
│   ├── utils.ts                # Helper functions
│   ├── geometryBuilders.ts     # Pure geometry functions
│   ├── useWindowContext.ts     # Context + reducer hook
│   ├── useWindowGeometry.ts    # Geometry calculation hook
│   ├── components/             # Feature components (flat)
│   │   ├── WindowFrame.tsx
│   │   ├── WindowGlass.tsx
│   │   ├── WindowMuntins.tsx
│   │   ├── WindowHandles.tsx
│   │   ├── WindowShutters.tsx
│   │   ├── WindowInsectScreen.tsx
│   │   ├── WindowTransom.tsx
│   │   ├── ConfigPanel.tsx     # Main UI container
│   │   ├── MaterialsPanel.tsx
│   │   ├── DimensionsPanel.tsx
│   │   ├── WindowTypePanel.tsx
│   │   ├── ProfilePanel.tsx
│   │   ├── MuntinsPanel.tsx
│   │   ├── HandlePanel.tsx
│   │   ├── OpeningPanel.tsx
│   │   ├── ShuttersPanel.tsx
│   │   └── OpeningVisualization.tsx
│   └── main.tsx
├── public/
│   └── screenshot.png
└── ... config files
```

**Pattern**: Flat `src/` structure (like k3-sample-plugin), all files at 1-2 levels deep

---

## Development Roadmap

### Phase 1: Foundation ⏱️ ~1-2 weeks
- Project setup (Vite, module federation, types)
- Core context + reducer
- Basic Hook system
- Simple Window3D with Frame + Glass
- DimensionsPanel config

**Deliverable**: Basic window renders with configurable width/height/depth

### Phase 2: Core Features ⏱️ ~2-3 weeks
- Profile system + library
- Window type selection (1/2/3 part)
- Muntins (sprossen) builder
- Advanced panels
- Memoization + optimization

**Deliverable**: Full customizable window with profiles and muntins

### Phase 3: Hardware & Accessories ⏱️ ~2-3 weeks
- Handles integration
- Opening type visualization
- Shutters component
- Insect screen component
- Transom/falight support

**Deliverable**: Feature-complete window with all accessories

### Phase 4: Polish & Integration ⏱️ ~1-2 weeks
- Integration testing with K3
- E2E tests with Playwright
- Performance optimization
- Error handling refinement
- Documentation

**Deliverable**: Production-ready plugin

---

## Key Design Patterns

### 1. Pure Geometry Functions
```typescript
function buildFrameGeometry(config): THREE.BufferGeometry {
  // No state, no side effects
  // Deterministic: same input → same output
  // Easy to test, easy to memoize
}
```

### 2. Context + Reducer
```typescript
const [config, dispatch] = useReducer(windowReducer, initialConfig);
return <WindowContext.Provider value={{ config, dispatch }} />;

// In components
const { config, dispatch } = useWindowContext();
dispatch({ type: 'SET_WIDTH', payload: 1200 });
```

### 3. Dependency-Driven Memoization
```typescript
const geometry = useMemo(
  () => buildGeometry(config),
  [config.width, config.height, config.profile] // explicit deps
);
```

### 4. Feature-Based Organization
```
components/
  ├── Window3D/     ← All 3D binding
  │   ├── Frame.tsx
  │   └── Glass.tsx
  ├── ConfigPanel/  ← All configuration UI
  │   ├── MaterialsPanel.tsx
  │   └── DimensionsPanel.tsx
```

---

## Success Criteria

### MVP Success ✅
- [ ] Window renders correctly in 3D
- [ ] Dimensions are configurable
- [ ] Frame profile changes appearance
- [ ] Materials apply from K3 system
- [ ] Config panels update 3D in real-time
- [ ] Loads successfully in K3 Konfigurator3
- [ ] No console errors
- [ ] 60 FPS on standard hardware

### Full Release Success ✅
- All phases 1-4 complete
- Feature parity with German requirements
- Unit tests >80% coverage
- E2E tests passing
- Documentation complete
- Production deployment ready

---

## Risk Mitigation

### Performance Risk
**Risk**: Geometry computation becomes too slow
**Mitigation**: 
- Memoize all builders from start
- Profile early and often
- LOD for complex features
- Test with large configs

### K3 Integration Risk
**Risk**: Plugin API changes or unexpected behavior
**Mitigation**:
- Test frequently in K3 environment
- Keep plugin decoupled from K3
- Fallback behaviors for missing props

### Scope Creep Risk
**Risk**: Feature requests expand scope
**Mitigation**:
- Stick to plan: 4 phases
- Separate MVP from future enhancements
- Document feature priorities

### Type Safety Risk
**Risk**: TypeScript setup inadequate
**Mitigation**:
- Strict mode enabled from start
- No `any` types
- Comprehensive type definitions

---

## Decision Log

### Why Context + useReducer, Not Redux?
- Window config is instance-specific, not global
- Each plugin instance is independent
- Simpler setup with less boilerplate
- K3 provides Redux if cross-plugin state needed

### Why Profile Library Instead of Raw Geometry?
- Profiles referenced, not copied to every config
- Easy to update profiles across instances
- Validation against known profiles
- Foundation for profile management UI

### Why Material Override Strategy?
- K3 provides base colors
- Local config can customize
- Best of both worlds
- Consistent with K3 architecture

### Why Memoize From Start?
- Geometry computation is expensive
- Performance matters for 3D
- Much easier than adding later
- Dependency tracking is explicit

---

## What's Next?

### Before Starting Implementation:
1. **Review & Confirm**: Does this architecture align with requirements?
2. **Design Approval**: Approve profiles, features, UI layout
3. **Estimate Effort**: Confirm timeline realistic
4. **Team Alignment**: Ensure everyone understands plan

### Starting Implementation:
1. **Clone structure** from k3-sample-plugin
2. **Follow IMPLEMENTATION_CHECKLIST** phase by phase
3. **Reference DESIGN_DECISIONS** for patterns/conventions
4. **Use DATA_FLOW** for state management questions
5. **Update ARCHITECTURE.md** if plan changes

---

## Questions to Answer Before Starting

1. **Profile Library**: Which profiles to include in MVP (modern frame only, or multiple styles)?
2. **Handle Models**: Will K3 provide handle models, or do we need to create them?
3. **Material System**: Should local color config override K3 materials, or always use K3?
4. **Opening Types**: Which opening types for MVP (fixed, tilt-turn, sliding, etc.)?
5. **Rollback Plan**: What if architecture needs adjustment after starting?

---

## Documentation References

Created 4 comprehensive documents:

1. **ARCHITECTURE.md** (80KB)
   - Project overview & tech stack
   - File structure & organization
   - Core data model (types & interfaces)
   - Component hierarchy
   - Geometry building strategy
   - Performance considerations
   - Development phases

2. **IMPLEMENTATION_CHECKLIST.md** (15KB)
   - 12 phases with detailed tasks
   - File creation tracking
   - Component integration points
   - Testing checkpoints
   - Success criteria

3. **DATA_FLOW.md** (25KB)
   - State management patterns
   - Context + reducer setup
   - Props flow through components
   - K3 materials integration
   - Geometry memoization
   - Testing approach

4. **DESIGN_DECISIONS.md** (12KB)
   - 10 key architectural decisions
   - Common patterns to follow
   - Naming conventions
   - Project rules
   - Debugging tips
   - Quick commands

---

## Summary

This plan provides a **clear, actionable roadmap** for building the window configurator plugin. The architecture is:

✅ **Sound**: Proven patterns (Context, pure functions, memoization)
✅ **Scalable**: Easy to add features without refactoring
✅ **Maintainable**: Clear separation of concerns
✅ **Performant**: Optimization built-in from design
✅ **Testable**: Functions are isolated and pure
✅ **Integrated**: Full compatibility with K3 system

**Next Step**: Review this plan, answer the questions above, and move to Phase 1 (Project Setup).

