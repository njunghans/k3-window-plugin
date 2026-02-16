# Z-Coordinate System Analysis

## The Problem
Lines at `3 * (d/2 + 0.005)` only work for specific depth values. This is not a general solution.

## ExtrudeGeometry Behavior

When `ExtrudeGeometry` is created with `depth: pd`, it creates geometry from `Z=0` to `Z=pd`.

### Outer Frame (createFrameFromProfile)
```typescript
const geometry = new THREE.ExtrudeGeometry(shape, {depth: pd});
geometry.translate(0, 0, pd / 2);  // Move all vertices by +pd/2
```

**Result:**
- Original: Z from `0` to `pd`
- After translate by `+pd/2`: Z from `pd/2` to `3*pd/2`
- **Back face: +pd/2**
- **Front face: +3*pd/2**

### Sash Frame (createSashFrame) 
```typescript
const geometry = new THREE.ExtrudeGeometry(shape, {depth: pd});
geometry.translate(0, 0, pd / 2);  // Same as outer frame
```

Then in createCompleteFrame:
```typescript
sash.translate(0, 0, outerProfileDepth * mm * 0.1);  // Additional forward offset
```

**Result:**
- After first translate: Z from `pd/2` to `3*pd/2`
- After second translate by `+depth*0.1`: Z from `pd/2 + depth*0.1` to `3*pd/2 + depth*0.1`
- **Back face: depth/2 + depth*0.1 = depth * 0.6**
- **Front face: 3*depth/2 + depth*0.1 = depth * 1.6**

## Current Working Formula (WRONG)

```typescript
3 * (d/2 + 0.005) = 1.5*d + 0.015
```

For `d = 0.07m` (70mm depth):
- `1.5 * 0.07 + 0.015 = 0.105 + 0.015 = 0.120m`

## Correct Formula

Lines should be at sash front face + small offset:
```typescript
d * 1.6 + offset
// or equivalently:
d * (3/2 + 0.1) + offset
// or:
3*d/2 + d*0.1 + offset
```

For `d = 0.07m`:
- Sash front: `0.07 * 1.6 = 0.112m` (112mm)
- Lines at: `0.112 + 0.008 = 0.120m` (120mm)
- Offset: `8mm`

## Why Current Formula "Works"

For depth = 70mm:
- Correct: `1.6 * 0.07 + 0.008 = 0.120`
- Wrong: `1.5 * 0.070.015 = 0.120`

**They give the same result by coincidence!**

## The Fix

Replace `3 * (d/2 + 0.005)` with `d * (1.5 + 0.1) + 0.008`:
- This accounts for the ExtrudeGeometry structure (3/2 factor)
- Plus the additional sash offset (0.1 factor)  
- Plus a small clearance (0.008m = 8mm)

Alternatively, for clarity:
```typescript
const sashFrontZ = (3 * d) / 2 + d * 0.1;  // 3d/2 from extrude, +d*0.1 from offset
const lineZ = sashFrontZ + 0.008;  // Small clearance in front
```
