# Realistic Window Profile System - Refactoring Plan

## Executive Summary

Transform sash frames from simple rectangular extrusions to realistic stepped profiles that fit inside the outer frame, creating an authentic window appearance with proper sealing.

---

## Current State Analysis

### What We Have ✓
1. **Outer Frame**: L-shaped profile (realistic) via `createOuterFrameProfile()`
2. **Path Extrusion System**: Working ExtrudeGeometry pipeline
3. **Nested Group Rotation**: Proper hinge-based mechanics
4. **Z-Coordinate System**: Documented in Z-COORDINATE-ANALYSIS.md

### What's Missing ✗
1. **Sash Profile**: Currently just a simple rectangular extrusion
2. **Profile Fitting**: No overlap/sealing between outer frame and sash
3. **Visual Realism**: Looks like boxes, not real windows

---

## Design Philosophy

### Real Window Anatomy

```
CROSS-SECTION VIEW (Closed Window):

Outside                                    Inside
  |                                          |
  |  Outer Frame (Fixed)                     |
  |  ┌────────────────┐                      |
  |  │                │                      |
  |  │    ┌───────────┴─────┐ ← Rebate       |
  |  │    │  Sash Frame     │                |
  |  │    │  (Movable)      │                |
  |  │    │    ┌─────┐      │                |
  |  │    │    │Glass│      │                |
  |  │    │    └─────┘      │                |
  |  │    └─────────────────┘                |
  |  └────────────────┘                      |
  |                                          |
```

**Key Features:**
- Outer frame has rebate (step) facing inside
- Sash profile fits into this rebate when closed
- Small overlap (8-12mm) creates weathersealing
- Profiles don't penetrate each other

---

## Technical Specification

### Profile Dimensions (European Standard)

#### Outer Frame (Already Implemented)
```typescript
Width: 60-80mm (configurable)
Depth: 70mm (configurable)
Rebate width: 30% of width (18-24mm)
Rebate depth: 70% of depth (49mm)
```

#### Sash Frame (To Be Implemented)
```typescript
Width: 42-56mm (70% of outer frame)
Depth: 70mm (same as outer frame)
Front face width: 35-45mm (visible when closed)
Rebate for glass: 12-15mm each side
Overlap into outer frame: 10-15mm
```

### Profile Cross-Section Design

#### New Sash Profile Shape
```
       Front (Outside)              Back (Inside)
           |                            |
    ┌──────┴──────┐                    │
    │             │                    │
    │   ┌─────┐   │ ← Glass rebates    │
    │   │     │   │                    │
────┴───┴─────┴───┴────────────────────┘
    │                                   │
    └─ Overlap section                  └─ Back edge
       (fits into outer rebate)            (flush with glass)
```

**Measurements:**
- Total width: 42mm (for 60mm outer frame)
- Front visible section: 35mm
- Overlap section: 12mm (extends into outer frame rebate)
- Glass rebate depth: 15mm
- Central spine: 15mm wide

---

## Implementation Strategy

### Phase 1: Profile Cross-Section Creation

**File:** `src/profileSystem.ts`

**New Function:**
```typescript
/**
 * Create realistic sash profile cross-section
 * Stepped design to fit inside outer frame rebate
 * 
 * Profile anatomy:
 * - Front face: Visible section when window is closed
 * - Overlap section: Fits into outer frame rebate
 * - Glass rebates: On both sides for glazing
 * - Back face: Flat edge facing inside
 */
export function createSashProfile(config: ProfileConfig): THREE.Shape {
  const mm = 0.001;
  
  const outerFrameWidth = (config.width || 60) * mm;
  const depth = (config.depth || 70) * mm;
  
  // Sash is 70% width of outer frame
  const sashWidth = outerFrameWidth * 0.7;
  const frontWidth = sashWidth * 0.8; // Visible front section
  const overlapWidth = sashWidth * 0.3; // Section that goes into rebate
  const glassRebateDepth = depth * 0.2; // 14mm for glass
  const glassRebateWidth = sashWidth * 0.25; // Rebate on each side
  
  // Create stepped profile...
}
```

**Tasks:**
- [ ] Design stepped cross-section shape
- [ ] Calculate dimensions based on outer frame config
- [ ] Ensure glass rebates on both sides
- [ ] Add overlap section for sealing
- [ ] Test profile shape in isolation

### Phase 2: Path Extrusion Refactor

**File:** `src/profileSystem.ts`

**Update Function:**
```typescript
/**
 * REFACTORED: Create sash frame using profile extrusion
 * Instead of simple rectangular extrusion, use proper sash profile
 */
export function createSashFrame(
  outerWidth: number,
  outerHeight: number,
  profileConfig: ProfileConfig, // NEW: Pass full config instead of just width/depth
): THREE.BufferGeometry {
  const mm = 0.001;
  const w = outerWidth * mm;
  const h = outerHeight * mm;
  
  // Get sash profile cross-section
  const profile = createSashProfile(profileConfig);
  
  // Create path (rectangle for sash frame)
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-w/2, -h/2, 0),
    new THREE.Vector3(w/2, -h/2, 0),
    new THREE.Vector3(w/2, h/2, 0),
    new THREE.Vector3(-w/2, h/2, 0),
    new THREE.Vector3(-w/2, -h/2, 0),
  ]);
  
  // Extrude profile along path
  const geometry = new THREE.ExtrudeGeometry(profile, {
    extrudePath: path,
    steps: 100, // Smooth corners
    bevelEnabled: false,
  });
  
  // Rotate/translate to correct orientation
  // Profile extrudes perpendicular to path
  
  return geometry;
}
```

**Tasks:**
- [ ] Switch from simple extrusion to path-based extrusion
- [ ] Handle profile orientation along path
- [ ] Calculate correct rotations for corners
- [ ] Test with single sash first
- [ ] Update all callers to pass profileConfig

### Phase 3: Z-Position Coordination

**Current Z-System:**
```
Frame base: depth/2
Frame front: 3*depth/2
Sash offset: +depth*0.1
Sash base: depth*0.6
Sash front: depth*1.6
Lines: depth*1.6 + 0.008
```

**New Z-System (Closed Position):**
```
Frame base: depth/2
Frame rebate: depth*0.7 (70% of depth)
Sash CLOSED position: depth*0.65 (sits in rebate, slight overlap)
Sash OPEN position: current (depth*0.6) or adjusted
Lines: match sash front face
```

**Tasks:**
- [ ] Calculate proper closed position (sash overlaps frame rebate)
- [ ] Maintain open position offset (depth*0.1 still works)
- [ ] Update line Z-calculation if sash front face changes
- [ ] Add small clearance to prevent z-fighting (0.5mm)
- [ ] Test with all opening types

### Phase 4: Glass Positioning

**Current:** Glass positioned generically by `createGlassPane()`

**New:** Glass must sit in profile rebates

**Outer Frame Glass:**
- Z-position: In outer frame rebate (depth*0.7)
- Fixed position (doesn't move)

**Sash Glass:**
- Z-position: In sash profile rebate (varies with sash position)
- Moves/rotates with sash
- Must stay within sash frame always

**Tasks:**
- [ ] Calculate glass Z-offset for outer frame rebate
- [ ] Calculate glass Z-offset for sash rebate
- [ ] Update `createGlassPane()` to accept Z-offset parameter
- [ ] Test glass visibility from both sides

### Phase 5: Backward Compatibility

**Goal:** Existing windows still work during transition

**Approach:**
- [ ] Add feature flag `useRealisticProfiles` (default: true)
- [ ] Keep old `createSashFrame()` as `createSashFrameLegacy()`
- [ ] Add profile version to ProfileConfig
- [ ] Graceful fallback if profile creation fails

### Phase 6: Pfosten Profile Update

**Current:** Simple rectangular extrusion

**Future:** Use mullion profile (already exists!)

**Tasks:**
- [ ] Update `createPfosten()` to use `createMullionProfile()`
- [ ] Ensure proper Z-positioning matches frame
- [ ] Test with multi-pane windows

---

## Risk Mitigation

### Potential Issues

**1. Profile Extrusion Complexity**
- **Risk:** ExtrudeGeometry with custom paths may have orientation issues
- **Mitigation:** Start with simple rectangular path, test profile orientation
- **Fallback:** Use mitered corners approach instead of smooth extrusion

**2. Z-Fighting When Closed**
- **Risk:** Sash overlapping frame causes visual flickering
- **Mitigation:** Maintain 0.5mm clearance between surfaces
- **Fallback:** Use renderOrder to control drawing sequence

**3. Performance Impact**
- **Risk:** Path extrusion more expensive than simple extrusion
- **Mitigation:** Profile geometry is static, computed once
- **Optimization:** Reuse geometries where possible

**4. Rotation Collision**
- **Risk:** Stepped profile may intersect frame during rotation
- **Mitigation:** Ensure sash profile narrower than opening (2-3mm clearance)
- **Testing:** Test extreme rotation angles for all opening types

---

## Testing Strategy

### Phase-by-Phase Validation

**Phase 1 (Profile Shape):**
- [ ] Render profile cross-section in 2D view
- [ ] Verify dimensions match specification
- [ ] Visual inspection: looks like real window profile?

**Phase 2 (Extrusion):**
- [ ] Test with single fixed sash first
- [ ] Verify corners are clean (no gaps/overlaps)
- [ ] Test with 2-pane, 3-pane, 4-pane windows

**Phase 3 (Z-Position):**
- [ ] Check closed position: sash appears to seal frame
- [ ] Check open position: no unexpected gaps
- [ ] Verify lines/buttons still visible

**Phase 4 (Glass):**
- [ ] Glass visible from both sides
- [ ] Glass doesn't protrude from frame
- [ ] Glass stays in rebate during rotation

**Phase 5 (All Opening Types):**
- [ ] Test: Fixed, Kipp, Dreh-Links, Dreh-Rechts
- [ ] Test: Dreh-Kipp-Links, Dreh-Kipp-Rechts
- [ ] Test: Hybrid mode switching (dreh ↔ kipp)

### Success Criteria

✅ Profiles look realistic and proportional  
✅ Sash visually fits into outer frame when closed  
✅ No z-fighting or visual artifacts  
✅ No gaps between sash and frame  
✅ Rotation works smoothly for all opening types  
✅ Lines and buttons positioned correctly  
✅ Glass positioned in rebates  
✅ Performance acceptable (no frame drops)

---

## Future Extensions

### After Core Implementation

1. **Multi-Material Profiles**
   - Different colors for inside vs outside faces
   - Weatherstripping visualization
   - Handle mounting points

2. **Advanced Profile Types**
   - Wood profiles (different cross-section)
   - Aluminum thermal break profiles
   - Historic/traditional profiles

3. **Detail Levels (LOD)**
   - Simplified profiles for distant view
   - Full detail for close-up
   - Performance optimization

4. **Profile Library**
   - Multiple predefined profile sets
   - Brand-specific profiles (VEKA, Reynaers, etc.)
   - Custom profile designer tool

---

## Implementation Order

### Recommended Sequence

1. **Create sash profile cross-section** (Phase 1)
   - Single function, isolated testing
   - Visual verification easy

2. **Test profile extrusion** (Phase 2)
   - Create one sash with new profile
   - Compare side-by-side with old system

3. **Adjust Z-positioning** (Phase 3)
   - Fine-tune closed position
   - Verify open position still works

4. **Update glass positioning** (Phase 4)
   - Place glass in rebates
   - Test visibility

5. **Full integration** (Apply to all sashes)
   - Update createCompleteFrame()
   - Test all window configurations

6. **Polish** (Pfosten, materials, etc.)
   - Apply profile to Pfosten
   - Material refinements

---

## Code Organization

### New File Structure

```
src/profileSystem.ts
├── Profile Cross-Sections
│   ├── createOuterFrameProfile() [existing ✓]
│   ├── createSashProfile() [NEW]
│   ├── createMullionProfile() [existing ✓]
│   └── createSimpleRectProfile() [existing ✓]
│
├── Frame Construction
│   ├── createFrameFromProfile() [existing ✓]
│   ├── createSashFrame() [REFACTOR]
│   ├── createPfosten() [UPDATE]
│   └── createGlassPane() [UPDATE]
│
└── Complete Assembly
    └── createCompleteFrame() [UPDATE callers]
```

### Documentation Requirements

- [ ] Update function JSDoc with new parameters
- [ ] Add visual diagrams to comments
- [ ] Document Z-coordinate system changes
- [ ] Update Z-COORDINATE-ANALYSIS.md

---

## Sign-Off Checklist

Before marking this refactor complete:

- [ ] Side-by-side comparison: old vs new looks clearly better
- [ ] All existing test cases still pass
- [ ] No performance regression
- [ ] Documentation updated
- [ ] Code reviewed for edge cases
- [ ] User can configure profile dimensions via UI
- [ ] Works on all tested browsers

---

## Timeline Estimate

- **Phase 1 (Profile):** 30-45 min
- **Phase 2 (Extrusion):** 45-60 min  
- **Phase 3 (Z-Position):** 20-30 min
- **Phase 4 (Glass):** 30-45 min
- **Phase 5 (Testing):** 30-45 min
- **Phase 6 (Polish):** 30-45 min

**Total:** ~3-4 hours for complete implementation

---

## Next Steps

Ready to begin? Start with:
1. **Phase 1:** Create `createSashProfile()` function
2. **Visual test:** Render profile cross-section to verify shape
3. **Proceed** to Phase 2 once profile looks correct
