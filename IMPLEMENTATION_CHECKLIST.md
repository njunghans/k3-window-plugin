# K3 Window Plugin - Implementation Checklist

## Phase 1: Foundation & Project Setup

### Project Configuration
- [ ] Initialize project structure (Vite, TypeScript, ESLint)
- [ ] Configure module federation for K3 plugin
- [ ] Set up build pipeline & deployment
- [ ] Configure shared dependencies (React, Three.js, MUI)
- [ ] Add Development README with setup instructions

### Type Definitions
- [ ] Create `src/types.ts` - All window configuration & related types
- [ ] Export: WindowConfiguration, FrameMaterial, ProfileConfig, MuntinsConfig, HandleConfig, etc.
- [ ] Add WindowAction union type for reducer actions
- [ ] TypeScript validation compiles without errors

### Core Utilities & Constants
- [ ] Create `src/constants.ts` - Profile library, enums, magic numbers
  - PROFILE_LIBRARY with 3-5 basic profiles
  - Window type enums
  - Dimension limits (MIN/MAX widths, heights)
  - Default configuration values
- [ ] Create `src/utils.ts` - Helper functions
  - Validation functions
  - Calculation helpers
  - Data transformation utilities
- [ ] Create `src/geometryBuilders.ts` - Pure geometry functions
  - buildFrameGeometry()
  - buildGlassGeometry()
  - buildMuntinsGeometry()
  - buildHandlePositions()

### Core Hooks
- [ ] Create `src/useWindowContext.ts` - Context hook
  - WindowContext definition
  - windowReducer function
  - useWindowContext custom hook
- [ ] Create `src/useWindowGeometry.ts` - Geometry calculations
  - useWindowGeometry hook
  - Memoized geometry builders
  - Returns computed geometries

### Basic Components
- [ ] Create `src/components/WindowFrame.tsx` - Frame geometry
- [ ] Create `src/components/WindowGlass.tsx` - Glass panes
- [ ] Create `src/components/ConfigPanel.tsx` - Config UI container
- [ ] Create `src/Window.tsx` - Main 3D component (like DynamicRing)
- [ ] Create context provider wrapper
- [ ] Create error boundary for safety

### Plugin Configuration
- [ ] Update `src/Plugin.tsx` - K3 plugin export
  - Import Window and other components
  - Define windowModel DynamicModel
  - Configure propsDialog
  - Set defaultProps
  - Export as K3Plugin

---

## Phase 2: Core 3D Rendering

### Geometry Builders
- [ ] Enhance `src/geometryBuilders.ts` with all builder functions
  - buildFrameGeometry() - Profile-based extrusion
  - buildGlassGeometry() - Pane calculation
  - buildProfileShape() - 2D profile creation
  - Test geometry generation with various inputs

### Frame Rendering Component
- [ ] Enhanced `src/components/WindowFrame.tsx`
  - Implement profile-based frame geometry
  - Apply inside/outside materials
  - Test with different profiles and dimensions
  - Verify material application

### Glass Panes Component
- [ ] Enhanced `src/components/WindowGlass.tsx`
  - Implement glass panel geometry
  - Apply glass material from K3
  - Support transparency color
  - Test with different glass types

### Window Assembly
- [ ] Enhanced `src/Window.tsx` to integrate Frame and Glass
- [ ] Test basic window rendering
- [ ] Verify prop flow from context
- [ ] Test with K3 materials system

---

## Phase 3: Configuration UI (Panels)

### Basic Config Panels
- [ ] Create `src/components/MaterialsPanel.tsx` - Color/material selection
- [ ] Create `src/components/DimensionsPanel.tsx` - Width/Height/Depth inputs
- [ ] Create `src/components/WindowTypePanel.tsx` - 1/2/3-part selection
- [ ] Create `src/components/ProfilePanel.tsx` - Profile selection

### Panel Infrastructure
- [ ] Enhanced `src/components/ConfigPanel.tsx` - Tabbed/accordion UI
  - Integrate all sub-panels
  - Add visual feedback for changes
  - Connect panels to context state updates
  - Test state updates trigger 3D updates

---

## Phase 4: Opening Visualization

### Opening Types
- [ ] Define opening type enums in `src/types.ts`
- [ ] Create visualization component for each type

### Visualization Component
- [ ] Create `src/components/OpeningVisualization.tsx`
- [ ] Implement visual representation of opening types
- [ ] Match design from screenshot mockups
- [ ] Test with different window dimensions

### Opening Panel
- [ ] Create `src/components/OpeningPanel.tsx`
- [ ] Integrate OpeningVisualization
- [ ] Allow opening type selection
- [ ] Store opening configuration in state

---

## Phase 5: Advanced Features - Muntins (Sprossen)

### Muntins Builder
- [ ] Enhance `src/geometryBuilders.ts` with muntin functions
  - buildMuntinsGeometry() for grid patterns
  - buildMuntinsGeometry() for cross patterns
  - Support custom muntin width
  - Test with different grid sizes

### Muntins Component
- [ ] Create `src/components/WindowMuntins.tsx`
- [ ] Render muntins based on configuration
- [ ] Apply material color
- [ ] Performance optimization for many muntins
- [ ] Test rendering performance

### Muntins Panel
- [ ] Create `src/components/MuntinsPanel.tsx`
- [ ] Pattern selection UI (grid, cross, none)
- [ ] Row/column input
- [ ] Muntin width slider
- [ ] Live preview of pattern

---

## Phase 6: Advanced Features - Hardware & Accessories

### Handle System
- [ ] Create `src/components/WindowHandles.tsx`
- [ ] Implement K3 model loading and positioning
- [ ] Support handle arrays (multiple handles)
- [ ] Test with different handle models

### Handle Panel
- [ ] Create `src/components/HandlePanel.tsx`
- [ ] Handle model selection (from K3 library)
- [ ] Position/rotation picker
- [ ] Add/remove handle buttons

### Shutters Component
- [ ] Create `src/components/WindowShutters.tsx`
- [ ] Simple roller shutter geometry
- [ ] Material color application
- [ ] Position relative to frame

### Shutters Panel
- [ ] Create `src/components/ShuttersPanel.tsx`
- [ ] Enable/disable checkbox
- [ ] Type selection
- [ ] Color picker
- [ ] Advanced options (slat width, etc.)

### Insect Screen Component
- [ ] Create `src/components/WindowInsectScreen.tsx`
- [ ] Fine mesh material rendering
- [ ] Position in front of glass

### Insect Screen Panel
- [ ] Create `src/components/InsectScreenPanel.tsx`
- [ ] Enable/disable checkbox
- [ ] Type selection
- [ ] Color option

---

## Phase 7: Optional Features - Transom & Falight

### Transom/Falight Components
- [ ] Create `src/components/WindowTransom.tsx`
- [ ] Support optional top light (transom)
- [ ] Support optional bottom light (falight)
- [ ] Share frame/glass components with main window

### Transom/Falight Panel
- [ ] Create `src/components/TransomFalightPanel.tsx`
- [ ] Enable/disable transom
- [ ] Set transom height
- [ ] Material selection
- [ ] Same for falight

### Integration
- [ ] Integrate with main window geometry
- [ ] Adjust main window height if transom/falight present
- [ ] Test dimension calculations

---

## Phase 8: Performance & Optimization

### Memoization
- [ ] Memoize all geometry builders
- [ ] Memoize context values in provider
- [ ] Use useMemo for expensive calculations
- [ ] Use useCallback for event handlers

### Rendering Optimization
- [ ] Implement LOD for complex components (optional)
- [ ] Use instance rendering for muntins (if many)
- [ ] Lazy load handle models on demand
- [ ] Monitor frame rate during complex configurations

### Testing
- [ ] Performance test with large dimension changes
- [ ] Performance test with many muntins
- [ ] Memory leak detection
- [ ] Profile with React DevTools

---

## Phase 9: Integration & K3 Features

### K3 Integration Testing
- [ ] Test loading plugin in Konfigurator3 dev environment
- [ ] Test material application from K3 system
- [ ] Test props dialog in K3 admin UI
- [ ] Test model positioning/rotation controls
- [ ] Test AR preview (if enabled)
- [ ] Test screenshot generation

### Material System
- [ ] Verify K3 materials apply correctly
- [ ] Test material override with local config
- [ ] Test material switching in real-time
- [ ] Test color consistency

### Props System
- [ ] Test position/rotation/scale from K3
- [ ] Test dimension props from K3
- [ ] Test default props setup
- [ ] Test expression evaluation

---

## Phase 10: Testing & Quality Assurance

### Unit Tests
- [ ] Test geometry builders with various inputs
- [ ] Test dimension calculations
- [ ] Test state reducer functions
- [ ] Test utility functions
- [ ] Aim for >80% code coverage

### E2E Tests (Playwright)
- [ ] Plugin loads successfully
- [ ] Window renders in 3D
- [ ] Dimensions can be changed
- [ ] Window type switching works
- [ ] Profile selection changes frame
- [ ] Materials apply correctly
- [ ] Muntins render correctly
- [ ] Handles display properly
- [ ] Optional features toggle on/off

### Manual Testing
- [ ] Visual inspection of 3D output
- [ ] Test with real K3 application
- [ ] Cross-browser testing
- [ ] Test on different screen sizes
- [ ] Test on mobile (if supported)

---

## Phase 11: Documentation & Deployment

### Documentation
- [ ] Update ARCHITECTURE.md with any changes
- [ ] Create DEVELOPMENT.md with setup & dev workflow
- [ ] Document component API and props
- [ ] Document profile system
- [ ] Create troubleshooting guide
- [ ] Document K3 integration points

### Build & Deployment
- [ ] Verify build process works
- [ ] Test production build
- [ ] Configure artifact repository
- [ ] Set up CI/CD pipeline
- [ ] Test deployment to K3

### Code Quality
- [ ] Run ESLint and fix issues
- [ ] Run TypeScript compiler in strict mode
- [ ] Code review checklist
- [ ] Remove console.log statements
- [ ] Remove dead code

---

## Phase 12: Future Enhancements (Post-MVP)

### Feature Extensions
- [ ] Configuration presets/templates
- [ ] Save/load configurations
- [ ] Configuration history
- [ ] Design gallery/library

### Manufacturing Integration
- [ ] Export configuration data
- [ ] Material quantity calculations
- [ ] Pricing engine integration
- [ ] Production order generation

### Advanced Materials
- [ ] Texture/decor library
- [ ] Energy efficiency ratings
- [ ] Special glass coatings
- [ ] Wood grain varieties

### Additional Window Types
- [ ] Special shapes (arch, octagon, etc.)
- [ ] Historical profiles
- [ ] Commercial window systems
- [ ] Custom profile creation

---

## Success Criteria

✅ **MVP Complete when:**
- Window renders correctly with configurable dimensions
- Frame follows selected profile
- Materials apply correctly from K3 system
- All basic config panels functional
- Plugin loads & works in K3 Konfigurator3
- No console errors
- Reasonable performance (60fps on standard hardware)

✅ **Full Release when:**
- All phases 1-11 complete
- Unit tests passing (>80% coverage)
- E2E tests passing
- Documentation complete
- Code reviewed and approved
- Ready for production deployment

