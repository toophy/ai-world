# Building Preview System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a building preview and placement system with mouse-follow preview, color-coded placement validation, 90° rotation, and construction/demolition progress visualization.

**Architecture:** Single-tile building placement replacing multi-tile selection. New BuildingPreview component manages 3D preview mesh with rotation support. PlacementValidator handles validation (bounds, terrain, overlap, building-specific rules). Visual state managed through Building class with progressive transparency for construction/demolition.

**Tech Stack:** JavaScript ES6 modules, Three.js for 3D rendering, existing game state management

---

## Task 1: Extend BUILDING_TYPES Configuration

**Files:**
- Modify: `web/js/config.js:42-89`

**Step 1: Update bed dimensions to 1x2**

In `BUILDING_TYPES.bed`, change `height: 1` to `height: 2`.

**Step 2: Add placementRules to all buildings**

Add `placementRules` object to each building type:

```javascript
placementRules: {
  allowedTerrain: ['grass', 'soil', 'sand', 'rock'], // adjust per building
  requiresRoof: false,  // only for bed
  minNeighbors: 0,      // only for bed (set to 1)
}
```

**Step 3: Update bed with specific rules**

Bed should have: `allowedTerrain: ['grass', 'soil']`, `requiresRoof: true`, `minNeighbors: 1`.

**Step 4: Test configuration loads**

Open browser console and verify `BUILDING_TYPES.bed.placementRules` exists.

Run: Open http://localhost:8000, check Console
Expected: No errors, BUILDING_TYPES object has placementRules

**Step 5: Commit**

```bash
git add web/js/config.js
git commit -m "feat: add placementRules to BUILDING_TYPES config

- Add bed dimensions 1x2
- Add placementRules with allowedTerrain, requiresRoof, minNeighbors
- Bed requires indoor placement (near walls)"
```

---

## Task 2: Add orientation and state to Building class

**Files:**
- Modify: `web/js/entities/Building.js:4-27`

**Step 1: Add orientation property**

After line 8 (`this.z = z;`), add:
```javascript
this.orientation = 0; // 0-3 for 0°, 90°, 180°, 270°
```

**Step 2: Add state property**

After orientation line, add:
```javascript
this.state = 'constructing'; // 'planning' | 'constructing' | 'complete' | 'demolishing'
```

**Step 3: Update constructor to accept orientation parameter**

Change constructor signature from `(type, x, z)` to `(type, x, z, orientation = 0)`.

Update line 6: `this.orientation = orientation;`

**Step 4: Write test for getOccupiedTiles method**

Create test file first (TDD):

```javascript
// Test: Building.getOccupiedTiles returns correct tiles for each orientation
const bed = new Building('bed', 5, 5, 0);
bed.width = 1;
bed.height = 2;

// Orientation 0: 1x2 (no swap)
let tiles = bed.getOccupiedTiles();
console.assert(tiles.length === 2, 'Should have 2 tiles');
console.assert(tiles[0].x === 5 && tiles[0].z === 5, 'First tile at origin');
console.assert(tiles[1].x === 5 && tiles[1].z === 6, 'Second tile at z+1');

// Orientation 1: 2x1 (swapped)
bed.orientation = 1;
tiles = bed.getOccupiedTiles();
console.assert(tiles.length === 2, 'Should have 2 tiles');
console.assert(tiles[0].x === 5 && tiles[0].z === 5, 'First tile at origin');
console.assert(tiles[1].x === 6 && tiles[1].z === 5, 'Second tile at x+1');
```

**Step 5: Run test to verify it fails**

Run: Paste test in browser console after loading game
Expected: Error "bed.getOccupiedTiles is not a function"

**Step 6: Implement getOccupiedTiles method**

Add to Building class after `toggleDoor()` method:

```javascript
getOccupiedTiles() {
  // Swap width/height for odd orientations (90° or 270°)
  const w = this.orientation % 2 === 0 ? this.width : this.height;
  const h = this.orientation % 2 === 0 ? this.height : this.width;

  const tiles = [];
  for (let dz = 0; dz < h; dz++) {
    for (let dx = 0; dx < w; dx++) {
      tiles.push({ x: this.x + dx, z: this.z + dz });
    }
  }
  return tiles;
}
```

**Step 7: Run test to verify it passes**

Run: Paste test in browser console
Expected: All assertions pass, no errors

**Step 8: Commit**

```bash
git add web/js/entities/Building.js
git commit -m "feat: add orientation and state to Building class

- Add orientation property (0-3 for 90° rotations)
- Add state property (constructing/complete/demolishing)
- Add getOccupiedTiles() method with rotation support
- Update constructor to accept orientation parameter"
```

---

## Task 3: Create PlacementValidator class

**Files:**
- Create: `web/js/systems/PlacementValidator.js`

**Step 1: Write failing test for validate method**

Create test file conceptually (we'll implement without framework):

```javascript
// Test: PlacementValidator.validate rejects out of bounds
const result = PlacementValidator.validate({x: -1, z: 5}, 'wall', 0, mockState);
console.assert(result.valid === false, 'Should reject negative coordinates');
console.assert(result.reason === 'out_of_bounds', 'Should have correct reason');
```

**Step 2: Create PlacementValidator.js file skeleton**

```javascript
import { BUILDING_TYPES, MAP_SIZE } from '../config.js';

export class PlacementValidator {
  static validate(gridPos, buildingType, orientation, state) {
    // TODO: implement
    return { valid: true };
  }
}
```

**Step 3: Implement getOccupiedTiles static method**

```javascript
static getOccupiedTiles(gridPos, config, orientation) {
  const w = orientation % 2 === 0 ? config.width : config.height;
  const h = orientation % 2 === 0 ? config.height : config.width;

  const tiles = [];
  for (let dz = 0; dz < h; dz++) {
    for (let dx = 0; dx < w; dx++) {
      tiles.push({ x: gridPos.x + dx, z: gridPos.z + dz });
    }
  }
  return tiles;
}
```

**Step 4: Implement checkBounds static method**

```javascript
static checkBounds(tiles) {
  return tiles.every(t => t.x >= 0 && t.x < MAP_SIZE && t.z >= 0 && t.z < MAP_SIZE);
}
```

**Step 5: Implement checkTerrain static method**

```javascript
static checkTerrain(tiles, config, state) {
  const allowed = config.placementRules?.allowedTerrain ||
    ['grass', 'soil', 'sand', 'rock'];

  for (const tile of tiles) {
    const terrain = state.map[tile.z]?.[tile.x]?.type;
    if (!terrain || !allowed.includes(terrain)) {
      return { valid: false, reason: 'invalid_terrain', tile };
    }
  }
  return { valid: true };
}
```

**Step 6: Implement checkOverlap static method**

```javascript
static checkOverlap(tiles, buildings) {
  return buildings.some(b => {
    if (!b.getOccupiedTiles) return false;
    const bTiles = b.getOccupiedTiles();
    return bTiles.some(bt => tiles.some(t => t.x === bt.x && t.z === bt.z));
  });
}
```

**Step 7: Implement validate method putting it together**

```javascript
static validate(gridPos, buildingType, orientation, state) {
  const config = BUILDING_TYPES[buildingType];
  if (!config) {
    return { valid: false, reason: 'unknown_building_type' };
  }

  const occupiedTiles = this.getOccupiedTiles(gridPos, config, orientation);

  // 1. Boundary check
  if (!this.checkBounds(occupiedTiles)) {
    return { valid: false, reason: 'out_of_bounds' };
  }

  // 2. Terrain check
  const terrainResult = this.checkTerrain(occupiedTiles, config, state);
  if (!terrainResult.valid) {
    return terrainResult;
  }

  // 3. Building overlap check
  if (this.checkOverlap(occupiedTiles, state.buildings || [])) {
    return { valid: false, reason: 'building_overlap' };
  }

  // 4. Task overlap check (simplified - check taskSystem if exists)
  if (state.taskSystem) {
    const hasTaskAt = (x, z) => state.taskSystem.tasks?.some(t => t.x === x && t.z === z &&
      (t.status === 'queued' || t.status === 'assigned' || t.status === 'in_progress'));
    if (occupiedTiles.some(t => hasTaskAt(t.x, t.z))) {
      return { valid: false, reason: 'task_overlap' };
    }
  }

  // 5. Building-specific rules
  const rules = config.placementRules || {};
  if (rules.requiresRoof) {
    // Check for adjacent walls
    const hasWall = this.hasAdjacentStructure(occupiedTiles, state.buildings || [], ['wall']);
    if (!hasWall) {
      return { valid: false, reason: 'requires_indoors' };
    }
  }

  if (rules.minNeighbors) {
    const neighbors = this.countAdjacentBuildings(occupiedTiles, state.buildings || []);
    if (neighbors < rules.minNeighbors) {
      return { valid: false, reason: 'needs_neighbors', required: rules.minNeighbors };
    }
  }

  return { valid: true };
}

static hasAdjacentStructure(tiles, buildings, types) {
  return tiles.some(tile => {
    const adjacents = [
      { x: tile.x - 1, z: tile.z },
      { x: tile.x + 1, z: tile.z },
      { x: tile.x, z: tile.z - 1 },
      { x: tile.x, z: tile.z + 1 },
    ];
    return adjacents.some(adj =>
      buildings.some(b =>
        types.includes(b.type) && b.getOccupiedTiles().some(bt => bt.x === adj.x && bt.z === adj.z)
      )
    );
  });
}

static countAdjacentBuildings(tiles, buildings) {
  let count = 0;
  const checked = new Set();

  for (const tile of tiles) {
    const adjacents = [
      { x: tile.x - 1, z: tile.z },
      { x: tile.x + 1, z: tile.z },
      { x: tile.x, z: tile.z - 1 },
      { x: tile.x, z: tile.z + 1 },
    ];

    for (const adj of adjacents) {
      const key = `${adj.x},${adj.z}`;
      if (!checked.has(key)) {
        checked.add(key);
        if (buildings.some(b => b.getOccupiedTiles().some(bt => bt.x === adj.x && bt.z === adj.z))) {
          count++;
        }
      }
    }
  }

  return count;
}
```

**Step 8: Test manually in browser**

Open game, in console:
```javascript
import { PlacementValidator } from './js/systems/PlacementValidator.js';

const mockState = {
  map: Array(24).fill().map(() => Array(24).fill().map(() => ({ type: 'grass' }))),
  buildings: []
};

// Test valid placement
let result = PlacementValidator.validate({x: 10, z: 10}, 'wall', 0, mockState);
console.log('Valid wall placement:', result);

// Test out of bounds
result = PlacementValidator.validate({x: -1, z: 10}, 'wall', 0, mockState);
console.log('Out of bounds:', result);
```

Expected: First result has `valid: true`, second has `valid: false, reason: 'out_of_bounds'`

**Step 9: Commit**

```bash
git add web/js/systems/PlacementValidator.js
git commit -m "feat: add PlacementValidator class

- Add validate() method with bounds, terrain, overlap checks
- Add support for building-specific placement rules
- Add hasAdjacentStructure for indoor requirements
- Add countAdjacentBuildings for minNeighbors rules"
```

---

## Task 4: Create BuildingPreview class - basic structure

**Files:**
- Create: `web/js/systems/BuildingPreview.js`

**Step 1: Create BuildingPreview class skeleton**

```javascript
import * as THREE from "three";
import { BUILDING_TYPES } from '../config.js';
import { gridToWorld, TILE_SIZE } from '../utils/geometry.js';

export class BuildingPreview {
  constructor(scene, buildingType, orientation = 0) {
    this.scene = scene;
    this.buildingType = buildingType;
    this.orientation = orientation;
    this.config = BUILDING_TYPES[buildingType];

    this.previewMesh = null;
    this.outlineMesh = null;
    this.currentPosition = null;
    this.isValid = false;

    this.createMeshes();
  }

  createMeshes() {
    // TODO: implement
  }

  updatePosition(gridPos, isValid) {
    // TODO: implement
  }

  rotate() {
    // TODO: implement
  }

  destroy() {
    // TODO: implement
  }
}
```

**Step 2: Test class can be instantiated**

In browser console:
```javascript
import { BuildingPreview } from './js/systems/BuildingPreview.js';
const preview = new BuildingPreview(scene, 'wall', 0);
console.log('Preview created:', preview);
```

Expected: No errors, BuildingPreview object created

**Step 3: Commit skeleton**

```bash
git add web/js/systems/BuildingPreview.js
git commit -m "feat: add BuildingPreview class skeleton

- Add basic class structure with constructor
- Add placeholder methods for createMeshes, updatePosition, rotate, destroy"
```

---

## Task 5: Implement BuildingPreview.createMeshes

**Files:**
- Modify: `web/js/systems/BuildingPreview.js:24-26`

**Step 1: Write test for mesh creation**

In browser console:
```javascript
import { BuildingPreview } from './js/systems/BuildingPreview.js';
const preview = new BuildingPreview(scene, 'wall', 0);
preview.createMeshes();
console.log('Preview mesh:', preview.previewMesh);
console.log('Outline mesh:', preview.outlineMesh);
```

Expected: Error "createMeshes does nothing" or meshes are null

**Step 2: Implement createMeshes method**

Replace the entire `createMeshes()` method with:

```javascript
createMeshes() {
  const w = this.orientation % 2 === 0 ? this.config.width : this.config.height;
  const h = this.orientation % 2 === 0 ? this.config.height : this.config.width;

  // Create semi-transparent preview mesh
  const geometry = new THREE.BoxGeometry(w * TILE_SIZE, 1, h * TILE_SIZE);
  const material = new THREE.MeshBasicMaterial({
    color: this.config.color,
    transparent: true,
    opacity: 0.5,
    depthTest: false,
    depthWrite: false,
  });

  this.previewMesh = new THREE.Mesh(geometry, material);
  this.previewMesh.renderOrder = 100; // Render on top
  this.scene.add(this.previewMesh);

  // Create outline using edges
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff00, // Green by default
    transparent: true,
    opacity: 0.8,
    depthTest: false,
  });

  this.outlineMesh = new THREE.LineSegments(edges, lineMaterial);
  this.outlineMesh.renderOrder = 101;
  this.scene.add(this.outlineMesh);

  // Set initial position below ground (hidden)
  this.previewMesh.position.set(0, -10, 0);
  this.outlineMesh.position.set(0, -10, 0);
}
```

**Step 3: Test mesh creation**

In browser console (refresh game first):
```javascript
import { BuildingPreview } from './js/systems/BuildingPreview.js';
const preview = new BuildingPreview(scene, 'wall', 0);
console.log('Preview mesh created:', !!preview.previewMesh);
console.log('Outline mesh created:', !!preview.outlineMesh);
```

Expected: Both true

**Step 4: Commit**

```bash
git add web/js/systems/BuildingPreview.js
git commit -m "feat: implement BuildingPreview.createMeshes

- Create semi-transparent preview mesh
- Create outline mesh using EdgesGeometry
- Set renderOrder to display on top of other objects
- Hide meshes below ground initially"
```

---

## Task 6: Implement BuildingPreview.updatePosition

**Files:**
- Modify: `web/js/systems/BuildingPreview.js:28-30`

**Step 1: Implement updatePosition method**

Replace `updatePosition()` method with:

```javascript
updatePosition(gridPos, isValid) {
  if (!gridPos) {
    // Hide preview if no position
    this.previewMesh.position.set(0, -10, 0);
    this.outlineMesh.position.set(0, -10, 0);
    return;
  }

  this.currentPosition = gridPos;
  this.isValid = isValid;

  // Calculate world position (center of building)
  const w = this.orientation % 2 === 0 ? this.config.width : this.config.height;
  const h = this.orientation % 2 === 0 ? this.config.height : this.config.width;

  const worldPos = gridToWorld(gridPos.x, gridPos.z);

  // Adjust for building size (offset to center)
  worldPos.x += (w - 1) * TILE_SIZE / 2;
  worldPos.z += (h - 1) * TILE_SIZE / 2;

  this.previewMesh.position.set(worldPos.x, 0.5, worldPos.z);
  this.outlineMesh.position.set(worldPos.x, 0.5, worldPos.z);

  // Update outline color based on validity
  const color = isValid ? 0x00ff00 : 0xff0000;
  this.outlineMesh.material.color.setHex(color);

  // Apply rotation
  this.applyRotation();
}
```

**Step 2: Add applyRotation helper method**

Add after `updatePosition()` method:

```javascript
applyRotation() {
  const angle = this.orientation * Math.PI / 2;
  this.previewMesh.rotation.y = angle;
  this.outlineMesh.rotation.y = angle;
}
```

**Step 3: Test updatePosition**

In browser console:
```javascript
import { BuildingPreview } from './js/systems/BuildingPreview.js';
const preview = new BuildingPreview(scene, 'wall', 0);
preview.updatePosition({x: 10, z: 10}, true);
console.log('Position updated, check scene for green box');
```

Expected: Green box appears on map at grid position 10,10

**Step 4: Commit**

```bash
git add web/js/systems/BuildingPreview.js
git commit -m "feat: implement BuildingPreview.updatePosition

- Update preview mesh position based on grid coordinates
- Center preview on building footprint
- Update outline color (green=valid, red=invalid)
- Add applyRotation helper method"
```

---

## Task 7: Implement BuildingPreview.rotate

**Files:**
- Modify: `web/js/systems/BuildingPreview.js:32-34`

**Step 1: Test rotate functionality**

In browser console:
```javascript
const preview = new BuildingPreview(scene, 'bed', 0);
preview.updatePosition({x: 10, z: 10}, true);
console.log('Current orientation:', preview.orientation);
preview.rotate();
console.log('After rotate:', preview.orientation);
```

Expected: Error "rotate is not a function" or orientation doesn't change

**Step 2: Implement rotate method**

Replace `rotate()` method with:

```javascript
rotate() {
  this.orientation = (this.orientation + 1) % 4;
  this.applyRotation();

  // Recreate meshes with new orientation (dimensions swap)
  this.scene.remove(this.previewMesh);
  this.scene.remove(this.outlineMesh);
  this.previewMesh.geometry.dispose();
  this.outlineMesh.geometry.dispose();
  this.createMeshes();

  // Restore position if exists
  if (this.currentPosition) {
    this.updatePosition(this.currentPosition, this.isValid);
  }
}
```

**Step 3: Test rotate changes orientation**

In browser console:
```javascript
const preview = new BuildingPreview(scene, 'bed', 0);
preview.updatePosition({x: 10, z: 10}, true);
console.log('Before:', preview.orientation, 'width:', preview.config.width, 'height:', preview.config.height);
preview.rotate();
console.log('After:', preview.orientation);
```

Expected: Orientation changes from 0 to 1, preview rotates visually

**Step 4: Commit**

```bash
git add web/js/systems/BuildingPreview.js
git commit -m "feat: implement BuildingPreview.rotate

- Cycle through 4 orientations (0-3)
- Recreate meshes to handle dimension swapping
- Maintain current position and validity after rotation"
```

---

## Task 8: Implement BuildingPreview.destroy

**Files:**
- Modify: `web/js/systems/BuildingPreview.js:36-38`

**Step 1: Implement destroy method**

Replace `destroy()` method with:

```javascript
destroy() {
  if (this.previewMesh) {
    this.scene.remove(this.previewMesh);
    this.previewMesh.geometry.dispose();
    this.previewMesh.material.dispose();
    this.previewMesh = null;
  }

  if (this.outlineMesh) {
    this.scene.remove(this.outlineMesh);
    this.outlineMesh.geometry.dispose();
    this.outlineMesh.material.dispose();
    this.outlineMesh = null;
  }
}
```

**Step 2: Test destroy cleans up**

In browser console:
```javascript
const preview = new BuildingPreview(scene, 'wall', 0);
preview.updatePosition({x: 10, z: 10}, true);
console.log('Meshes in scene:', scene.children.length);
preview.destroy();
console.log('After destroy:', scene.children.length);
```

Expected: Scene children count decreases by 2

**Step 3: Commit**

```bash
git add web/js/systems/BuildingPreview.js
git commit -m "feat: implement BuildingPreview.destroy

- Remove meshes from scene
- Dispose geometries and materials
- Clean up all references"
```

---

## Task 9: Connect BuildingPreview to InputManager - setup

**Files:**
- Modify: `web/js/input/InputManager.js`

**Step 1: Add buildingPreview property to constructor**

Find the constructor in InputManager and add after line 16 (`this.uiManager = uiManager;`):
```javascript
this.buildingPreview = null;
```

**Step 2: Test property exists**

In browser console after game loads:
```javascript
console.log('buildingPreview property:', inputManager.buildingPreview);
```

Expected: `null`

**Step 3: Commit**

```bash
git add web/js/input/InputManager.js
git commit -m "feat: add buildingPreview property to InputManager

- Initialize buildingPreview as null in constructor
- Prepare for BuildingPreview integration"
```

---

## Task 10: Add mouse move handler for building preview

**Files:**
- Modify: `web/js/input/InputManager.js` (find `_handlePointerMove` method)

**Step 1: Locate _handlePointerMove method**

Search for the method that handles `mousemove` or `pointermove` events. Note: The current implementation may have this inline or in a different location. Look for raycasting logic.

**Step 2: Add building preview update logic**

After the raycasting finds the ground position, add:

```javascript
// Update building preview if in build mode
if (this.modeHandler.currentMode === 'build' && this.buildingPreview) {
  const gridPos = worldToGrid(intersect.point.x, intersect.point.z);
  const isValid = this.validatePlacement(gridPos);
  this.buildingPreview.updatePosition(gridPos, isValid);
}
```

**Step 3: Add helper method to validate placement**

Add to InputManager class:

```javascript
validatePlacement(gridPos) {
  if (!this.modeHandler.selectedBuildingType) return false;

  // Import dynamically to avoid circular dependency
  import('../systems/PlacementValidator.js').then(module => {
    const PlacementValidator = module.PlacementValidator;
    return PlacementValidator.validate(
      gridPos,
      this.modeHandler.selectedBuildingType,
      this.buildingPreview?.orientation || 0,
      this.state
    ).valid;
  });
}
```

Actually, for synchronous operation, add at top of file:
```javascript
import { PlacementValidator } from '../systems/PlacementValidator.js';
```

And make validatePlacement:
```javascript
validatePlacement(gridPos) {
  if (!this.modeHandler.selectedBuildingType) return false;

  return PlacementValidator.validate(
    gridPos,
    this.modeHandler.selectedBuildingType,
    this.buildingPreview?.orientation || 0,
    this.state
  ).valid;
}
```

**Step 4: Test preview follows mouse**

1. Start game
2. Click a building button (need to wire this up first, or test manually)

Manual test in console:
```javascript
import { BuildingPreview } from './js/systems/BuildingPreview.js';
inputManager.buildingPreview = new BuildingPreview(scene, 'wall', 0);
// Move mouse over canvas - preview should follow
```

**Step 5: Commit**

```bash
git add web/js/input/InputManager.js
git commit -m "feat: add building preview to mouse move handler

- Update BuildingPreview position on mouse move
- Validate placement and update preview color (green/red)
- Add validatePlacement helper using PlacementValidator"
```

---

## Task 11: Wire up building button clicks to create preview

**Files:**
- Modify: `web/js/input/InputManager.js` or `web/js/input/ModeHandler.js`

**Step 1: Find where building buttons are clicked**

This is likely in an event listener or HTML onclick. Search for references to building buttons like '🧱 墙壁'.

**Step 2: Add createBuildingPreview method to InputManager**

```javascript
createBuildingPreview(buildingType) {
  // Destroy existing preview if any
  if (this.buildingPreview) {
    this.buildingPreview.destroy();
  }

  // Create new preview
  this.buildingPreview = new BuildingPreview(this.scene || window.scene, buildingType, 0);

  // Set build mode
  this.modeHandler.setMode('build', buildingType);
}
```

**Step 3: Connect building button clicks**

In the HTML or wherever building buttons are handled, call:
```javascript
inputManager.createBuildingPreview('wall');
inputManager.createBuildingPreview('door');
// etc.
```

Or find existing button handler and modify it to call `createBuildingPreview`.

**Step 4: Test preview appears when clicking building button**

1. Start game
2. Click "墙壁" button
3. Expected: Preview mesh appears and follows mouse

**Step 5: Commit**

```bash
git add web/js/input/InputManager.js
git/js/input/ModeHandler.js
git commit -m "feat: wire up building buttons to create preview

- Add createBuildingPreview method to InputManager
- Destroy existing preview before creating new one
- Connect building button clicks to preview creation"
```

---

## Task 12: Implement click-to-place building

**Files:**
- Modify: `web/js/input/InputManager.js` (find click/pointerdown handler)

**Step 1: Add placeBuilding method**

```javascript
placeBuilding(gridPos) {
  if (!this.buildingPreview || !this.buildingPreview.isValid) {
    console.warn('Cannot place: invalid position or no preview');
    return;
  }

  const buildingType = this.modeHandler.selectedBuildingType;
  const config = BUILDING_TYPES[buildingType];

  // Check resources
  for (const [resource, amount] of Object.entries(config.resources)) {
    if ((this.state.resources[resource] || 0) < amount) {
      console.warn('Insufficient resources:', resource);
      // TODO: Show UI notification
      return;
    }
  }

  // Deduct resources
  for (const [resource, amount] of Object.entries(config.resources)) {
    this.state.resources[resource] -= amount;
  }

  // Create building
  const building = new Building(
    buildingType,
    gridPos.x,
    gridPos.z,
    this.buildingPreview.orientation
  );

  // Add to state
  if (!this.state.buildings) this.state.buildings = [];
  this.state.buildings.push(building);

  // Create building mesh
  const w = building.orientation % 2 === 0 ? config.width : config.height;
  const h = building.orientation % 2 === 0 ? config.height : config.width;

  const geometry = new THREE.BoxGeometry(w * TILE_SIZE, 1, h * TILE_SIZE);
  const material = new THREE.MeshStandardMaterial({
    color: config.color,
    transparent: true,
    opacity: 0.3, // Start semi-transparent for construction
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(this.buildingPreview.previewMesh.position);
  mesh.rotation.y = this.buildingPreview.previewMesh.rotation.y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  building.mesh = mesh;
  mesh.userData = { kind: "building", entity: building };

  const world = this.scene || window.world;
  world.add(mesh);

  // Create construction task
  const task = new Task(`build_${buildingType}`, gridPos.x, gridPos.z, {
    priority: 5,
    buildingId: building.id,
    buildingType: buildingType,
  });

  if (this.state.taskSystem) {
    this.state.taskSystem.addTask(task);
  }

  // Clear preview
  this.buildingPreview.destroy();
  this.buildingPreview = null;

  // Exit build mode
  this.modeHandler.setMode('inspect');

  console.log(`Placed ${buildingType} at`, gridPos);
}
```

**Step 2: Add to click handler**

In the pointerdown/click handler, add after raycasting:

```javascript
if (this.modeHandler.currentMode === 'build' && event.button === 0) {
  const gridPos = worldToGrid(intersect.point.x, intersect.point.z);
  this.placeBuilding(gridPos);
  return; // Don't process other interactions
}
```

**Step 3: Test placing a building**

1. Start game
2. Click "墙壁" button
3. Move to valid position (green preview)
4. Click to place
5. Expected: Building appears, resources deducted, preview disappears

**Step 4: Commit**

```bash
git add web/js/input/InputManager.js
git commit -m "feat: implement click-to-place building

- Add placeBuilding method with resource checking
- Create Building instance with orientation
- Create 3D mesh with initial 30% opacity
- Create construction task
- Clear preview and exit build mode after placement"
```

---

## Task 13: Add R key and right-click rotation

**Files:**
- Modify: `web/js/input/InputManager.js` (handleKeyDown or keydown handler)

**Step 1: Find keydown handler**

Look for where keyboard events are handled (`handleKeyDown` or similar).

**Step 2: Add R key handler for rotation**

```javascript
if (event.key === 'r' || event.key === 'R') {
  if (this.modeHandler.currentMode === 'build' && this.buildingPreview) {
    this.buildingPreview.rotate();
    // Re-validate at new position
    if (this.buildingPreview.currentPosition) {
      const isValid = this.validatePlacement(this.buildingPreview.currentPosition);
      this.buildingPreview.updatePosition(this.buildingPreview.currentPosition, isValid);
    }
    event.preventDefault();
  }
}
```

**Step 3: Add right-click rotation in pointerdown handler**

Add after the left-click building placement:

```javascript
if (this.modeHandler.currentMode === 'build' && event.button === 2) {
  if (this.buildingPreview) {
    this.buildingPreview.rotate();
    // Re-validate
    if (this.buildingPreview.currentPosition) {
      const isValid = this.validatePlacement(this.buildingPreview.currentPosition);
      this.buildingPreview.updatePosition(this.buildingPreview.currentPosition, isValid);
    }
  }
  event.preventDefault();
  return;
}
```

**Step 4: Test rotation**

1. Start game
2. Click "床铺" button (1x2 building)
3. Press R key or right-click
4. Expected: Preview rotates 90°

**Step 5: Commit**

```bash
git add web/js/input/InputManager.js
git commit -m "feat: add building rotation controls

- Add R key handler to rotate preview
- Add right-click handler to rotate preview
- Re-validate position after rotation
- Prevent default browser behavior for right-click"
```

---

## Task 14: Add ESC to cancel build mode

**Files:**
- Modify: `web/js/input/InputManager.js` (handleKeyDown or keydown handler)

**Step 1: Add ESC key handler**

```javascript
if (event.key === 'Escape') {
  if (this.buildingPreview) {
    this.buildingPreview.destroy();
    this.buildingPreview = null;
  }
  if (this.modeHandler.currentMode !== 'inspect') {
    this.modeHandler.setMode('inspect');
  }
}
```

**Step 2: Test ESC cancels build mode**

1. Start game
2. Click building button
3. Press ESC
4. Expected: Preview disappears, mode returns to inspect

**Step 3: Commit**

```bash
git add web/js/input/InputManager.js
git commit -m "feat: add ESC to cancel build mode

- Destroy building preview on ESC
- Return to inspect mode
- Clean up preview resources"
```

---

## Task 15: Implement construction progress visualization

**Files:**
- Modify: `web/js/entities/Building.js`
- Modify: `web/game.js` (find where pawns work on tasks)

**Step 1: Add getVisualConfig method to Building**

```javascript
getVisualConfig() {
  switch(this.state) {
    case 'constructing':
      return {
        opacity: 0.3 + (this.progress / 100) * 0.7, // 30% to 100%
        outlineColor: 0x00ff00,
        showOutline: true
      };
    case 'complete':
      return {
        opacity: 1.0,
        outlineColor: null,
        showOutline: false
      };
    case 'demolishing':
      return {
        opacity: 1.0 - (Math.abs(this.progress) / 100) * 0.7, // 100% to 30%
        outlineColor: 0xff0000,
        showOutline: true,
        showIcon: true
      };
    default:
      return { opacity: 0.5 };
  }
}
```

**Step 2: Add updateVisual method**

```javascript
updateVisual() {
  if (!this.mesh) return;

  const config = this.getVisualConfig();

  // Update opacity
  this.mesh.material.opacity = config.opacity;

  // Handle outline (create or destroy as needed)
  if (config.showOutline) {
    if (!this.outlineMesh && this.mesh) {
      const edges = new THREE.EdgesGeometry(this.mesh.geometry);
      const material = new THREE.LineBasicMaterial({
        color: config.outlineColor,
        transparent: true,
        opacity: 0.8,
        depthTest: false,
      });
      this.outlineMesh = new THREE.LineSegments(edges, material);
      this.outlineMesh.position.copy(this.mesh.position);
      this.outlineMesh.rotation.copy(this.mesh.rotation);
      this.outlineMesh.renderOrder = 101;

      const world = window.world; // or get from scene
      world.add(this.outlineMesh);
    } else if (this.outlineMesh) {
      this.outlineMesh.material.color.setHex(config.outlineColor);
    }
  } else {
    if (this.outlineMesh) {
      const world = window.world;
      world.remove(this.outlineMesh);
      this.outlineMesh.geometry.dispose();
      this.outlineMesh.material.dispose();
      this.outlineMesh = null;
    }
  }
}
```

**Step 3: Update updateProgress to call updateVisual**

Modify `updateProgress` method:

```javascript
updateProgress(amount) {
  this.progress = Math.min(100, Math.max(-100, this.progress + amount));

  // Update state based on progress
  if (this.progress >= 100 && !this.isComplete) {
    this.isComplete = true;
    this.state = 'complete';
    this.onComplete();
  } else if (this.progress < 0 && this.state !== 'demolishing') {
    // Switched to demolition
    this.state = 'demolishing';
  }

  // Update visual
  this.updateVisual();
}
```

**Step 4: Connect building progress in game loop**

In `game.js`, find where construction tasks update progress (in `updatePawn` or similar). After updating building progress, add:

```javascript
if (building && typeof building.updateVisual === 'function') {
  building.updateVisual();
}
```

**Step 5: Test construction progress**

1. Place a building
2. Wait for pawn to construct it
3. Expected: Opacity increases from 30% to 100%, green outline visible

**Step 6: Commit**

```bash
git add web/js/entities/Building.js web/game.js
git commit -m "feat: add construction progress visualization

- Add getVisualConfig method for each building state
- Implement progressive opacity during construction (30%-100%)
- Add green outline for constructing buildings
- Remove outline when complete
- Call updateVisual when progress changes"
```

---

## Task 16: Add demolish functionality

**Files:**
- Modify: `web/js/input/ModeHandler.js`
- Create: new mode or add to existing

**Step 1: Add demolish mode to MODE_TIPS if needed**

In `config.js`, add if not present:
```javascript
demolish: "拆除模式：点击建筑下达拆除任务。",
```

**Step 2: Add demolish mode handler**

In ModeHandler or InputManager, add method:

```javascript
createDemolishTask(building) {
  if (!building) return;

  const task = new Task('demolish', building.x, building.z, {
    priority: 5,
    targetBuildingId: building.id,
  });

  this.taskSystem.addTask(task);

  // Set building to demolishing state
  building.state = 'demolishing';
  building.progress = 0;
  building.updateVisual();

  console.log(`Demolish task created for ${building.label}`);
}
```

**Step 3: Add demolish mode to pointerdown handler**

```javascript
if (this.modeHandler.currentMode === 'demolish' && event.button === 0) {
  const entity = intersect.object.userData.entity;
  if (entity && entity.kind === 'building') {
    this.modeHandler.createDemolishTask(entity);
  }
  return;
}
```

**Step 4: Update updatePawn for demolish tasks**

In game.js updatePawn function:

```javascript
if (currentTask?.type === 'demolish') {
  const building = state.buildings?.find(b => b.id === currentTask.targetBuildingId);

  if (building) {
    building.updateProgress(-pawn.workSpeed * dt);

    if (building.progress <= -100) {
      // Fully demolished
      if (building.mesh) world.remove(building.mesh);
      if (building.outlineMesh) {
        world.remove(building.outlineMesh);
        building.outlineMesh.geometry.dispose();
        building.outlineMesh.material.dispose();
      }
      state.buildings = state.buildings.filter(b => b.id !== building.id);
      currentTask.status = 'completed';
      logEvent(`${pawn.name} 拆除了 ${building.label}`);
    } else {
      building.updateVisual();
    }
  }
}
```

**Step 5: Test demolish**

1. Build a building and wait for completion
2. Enter demolish mode (add button/UI)
3. Click building
4. Wait for pawn to demolish
5. Expected: Red outline appears, building disappears when complete

**Step 6: Commit**

```bash
git add web/js/input/ModeHandler.js web/js/input/InputManager.js web/game.js
git commit -m "feat: add building demolish functionality

- Add demolish mode and task type
- Create demolish tasks on building click
- Update building state to 'demolishing'
- Implement reverse progress (negative values)
- Remove building when progress reaches -100%
- Add red outline for demolishing buildings"
```

---

## Task 17: Clean up ModeHandler multi-tile selection

**Files:**
- Modify: `web/js/input/ModeHandler.js:46-81`

**Step 1: Simplify createBuildTasks to single tile**

Replace the entire `createBuildTasks` method with:

```javascript
createBuildTask(tile) {
  if (!this.selectedBuildingType) {
    console.warn("No building type selected");
    return;
  }

  const config = BUILDING_TYPES[this.selectedBuildingType];
  if (!config) {
    console.warn(`Unknown building type: ${this.selectedBuildingType}`);
    return;
  }

  // Check resources
  if (!this.checkResources(config.resources, 1)) {
    this.showResourceWarning(config.resources);
    return;
  }

  // Validation is now handled by BuildingPreview, just create the task
  // The actual placement happens in InputManager
  console.log(`Building task ready: ${this.selectedBuildingType} at`, tile);
}
```

Actually, since we moved placement to InputManager, we can simplify further or remove this method from being called directly.

**Step 2: Update handleInteraction**

Simplify to just trigger the preview creation:

```javascript
handleInteraction(selectedTiles, clickedEntity = null) {
  switch (this.currentMode) {
    case "inspect":
      // Handled by UI
      break;
    case "build":
      // Single tile mode - preview handles placement
      // This is now handled by InputManager directly
      break;
    case "mine":
      this.createMineTasks(clickedEntity || selectedTiles);
      break;
    case "harvest":
      this.createHarvestTasks(clickedEntity || selectedTiles);
      break;
    case "cancel":
      selectedTiles.forEach(tile => this.taskSystem.cancelTasksAt(tile.x, tile.z));
      break;
  }
}
```

**Step 3: Commit**

```bash
git add web/js/input/ModeHandler.js
git commit -m "refactor: simplify ModeHandler for single-tile placement

- Remove multi-tile task creation logic
- Placement now handled by BuildingPreview + InputManager
- Keep other interaction modes (mine, harvest, cancel)"
```

---

## Task 18: Add completion flash effect

**Files:**
- Modify: `web/js/entities/Building.js` (onComplete method)

**Step 1: Implement flash animation in onComplete**

```javascript
onComplete() {
  // Flash effect
  if (this.mesh) {
    const originalColor = this.mesh.material.color.getHex();
    const flashColor = 0xffffff; // White flash

    // Simple flash using timeout
    this.mesh.material.color.setHex(flashColor);
    this.mesh.material.emissive = new THREE.Color(0x555555);

    setTimeout(() => {
      this.mesh.material.color.setHex(originalColor);
      this.mesh.material.emissive = new THREE.Color(0x000000);
    }, 200);
  }

  console.log(`${this.label} construction completed!`);
}
```

**Step 2: Test completion effect**

1. Place a building
2. Wait for construction to complete
3. Expected: Brief white flash on completion

**Step 3: Commit**

```bash
git add web/js/entities/Building.js
git commit -m "feat: add building completion flash effect

- Flash white briefly when construction completes
- Add emissive glow during flash
- Return to normal appearance after 200ms"
```

---

## Task 19: Test and verify all functionality

**Files:**
- None (manual testing)

**Step 1: Full workflow test**

1. Start game
2. Click "墙壁" → Preview appears, follows mouse
3. Move to valid position → Green outline
4. Move to invalid position → Red outline
5. Press R → Preview rotates
6. Click to place → Building appears with 30% opacity
7. Wait for construction → Opacity increases, green outline
8. Completion → Flash effect, 100% opacity, outline gone
9. Click demolish button → Click building → Red outline
10. Wait for demolition → Building disappears

**Step 2: Edge case tests**

- Place on water → Should show red
- Place on existing building → Should show red
- Place bed without walls → Should show red
- Rotate 2x2 workbench → Should correctly swap dimensions
- ESC during placement → Preview disappears
- Run out of resources → Should not place

**Step 3: Performance check**

- Move mouse rapidly → Preview should update smoothly
- Place many buildings → No memory leaks
- Rotate continuously → No mesh leaks

**Step 4: Document any issues found**

Create a file `docs/building-preview-issues.md` if any bugs are found.

**Step 5: Final commit**

```bash
git add docs/
git commit -m "docs: add building preview system test results

- Document full workflow test results
- Document edge cases tested
- Document performance checks"
```

---

## Summary

This plan implements the building preview and placement system in 19 bite-sized tasks:

1-3: Data model and configuration
4-8: PlacementValidator and BuildingPreview classes
9-14: InputManager integration and controls
15-18: Visual effects and demolish
19: Testing and verification

Each task follows TDD: write test → verify fail → implement → verify pass → commit.

**Total estimated time:** 3-4 hours for implementation
