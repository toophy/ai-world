# Task Dispatch System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add player-driven task dispatch system to the RimWorld-style colony game, including box selection, task management UI, colonist details, and skill system.

**Architecture:** Refactor monolithic `game.js` into layered architecture (entities/, systems/, ui/, input/, utils/). Add task queue system where players create tasks via box selection, colonists auto-assign based on priority/skills. Use event-driven communication between modules.

**Tech Stack:** Vanilla JavaScript, Three.js (existing), HTML5, CSS3. No build tools - direct browser ES6 modules.

---

## Task 1: Create Directory Structure

**Files:**
- Create: `web/js/entities/`
- Create: `web/js/systems/`
- Create: `web/js/ui/`
- Create: `web/js/ui/panels/`
- Create: `web/js/ui/modals/`
- Create: `web/js/input/`
- Create: `web/js/utils/`

**Step 1: Create directory structure**

Run:
```bash
cd web && mkdir -p js/entities js/systems js/ui/panels js/ui/modals js/input js/utils
```

**Step 2: Verify directories created**

Run: `ls -la web/js/`
Expected: Output shows entities/, systems/, ui/, input/, utils/ directories

**Step 3: Commit**

```bash
git add web/js/
git commit -m "feat: create directory structure for modular architecture"
```

---

## Task 2: Extract Config Constants

**Files:**
- Create: `web/js/config.js`
- Modify: `web/game.js` (remove constants)

**Step 1: Write config.js**

```javascript
// Game constants
export const TILE_SIZE = 2;
export const MAP_WIDTH = 30;
export const MAP_HEIGHT = 30;
export const HALF = Math.floor(MAP_WIDTH / 2);

// Terrain colors
export const TERRAIN_COLORS = {
  grass: 0x3a5f0b,
  dirt: 0x8b7355,
  stone: 0x808080,
  water: 0x4169e1,
};

// Task types with configuration
export const TASK_TYPES = {
  BUILD_WALL: { workTime: 2, resources: { wood: 3 }, label: "建造墙壁" },
  BUILD_DOOR: { workTime: 3, resources: { wood: 5 }, label: "建造门" },
  BUILD_BED: { workTime: 2.5, resources: { wood: 8 }, label: "建造床铺" },
  BUILD_STORAGE: { workTime: 3, resources: { wood: 12 }, label: "建造储物箱" },
  BUILD_WORKBENCH: { workTime: 5, resources: { wood: 20, ore: 5 }, label: "建造工作台" },
  MINE_ORE: { workTime: 1.5, yield: { ore: 10 }, label: "开采矿石" },
  HARVEST_BERRY: { workTime: 1, yield: { berry: 3 }, label: "收获浆果" },
  PLANT_BERRY: { workTime: 0.8, resources: {}, label: "种植浆果" },
  HAUL: { workTime: 0.5, label: "搬运" },
  SLEEP: { workTime: 0, label: "休息" },
  EAT: { workTime: 0.5, label: "进食" },
  HEAL: { workTime: 1, label: "治疗" },
};

// Building types configuration
export const BUILDING_TYPES = {
  wall: {
    width: 1, height: 1,
    resources: { wood: 3 },
    label: "墙壁",
    color: 0x8b7355,
    walkable: false,
  },
  door: {
    width: 1, height: 1,
    resources: { wood: 5 },
    label: "门",
    color: 0x6b8e23,
    walkable: true,
    open: false,
  },
  bed: {
    width: 1, height: 1,
    resources: { wood: 8 },
    label: "床铺",
    color: 0xdeb887,
    walkable: false,
    restores: "energy",
  },
  storage: {
    width: 1, height: 1,
    resources: { wood: 12 },
    label: "储物箱",
    color: 0x654321,
    walkable: false,
    capacity: 500,
  },
  workbench: {
    width: 2, height: 1,
    resources: { wood: 20, ore: 5 },
    label: "工作台",
    color: 0xcd853f,
    walkable: false,
  },
  medical_bed: {
    width: 1, height: 1,
    resources: { wood: 15 },
    label: "医务床",
    color: 0xffe4e1,
    walkable: false,
    restores: "hp",
  },
};

// Skill labels
export const SKILL_LABELS = {
  building: "建造",
  mining: "采矿",
  planting: "种植",
  hauling: "搬运",
  medicine: "医疗",
};
```

**Step 2: Update index.html to import config.js**

Modify `web/index.html` - add before game.js:
```html
<script type="module" src="js/config.js"></script>
```

**Step 3: Verify page loads without errors**

Open: `http://localhost:8000/web/index.html` (or your local server)
Expected: Page loads, no console errors about missing constants

**Step 4: Commit**

```bash
git add web/js/config.js web/index.html
git commit -m "feat: extract config constants to separate module"
```

---

## Task 3: Extract Geometry Utilities

**Files:**
- Create: `web/js/utils/geometry.js`
- Modify: `web/game.js` (remove geometry functions)

**Step 1: Write geometry.js**

```javascript
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, HALF } from '../config.js';

// Convert grid coordinates to world coordinates
export function gridToWorld(gx, gz) {
  return {
    x: (gx - HALF) * TILE_SIZE + TILE_SIZE / 2,
    z: (gz - HALF) * TILE_SIZE + TILE_SIZE / 2
  };
}

// Convert world coordinates to grid coordinates
export function worldToGrid(wx, wz) {
  return {
    x: Math.floor(wx / TILE_SIZE + HALF),
    z: Math.floor(wz / TILE_SIZE + HALF)
  };
}

// Check if grid position is valid
export function isValidGrid(x, z) {
  return x >= 0 && x < MAP_WIDTH && z >= 0 && z < MAP_HEIGHT;
}

// Calculate Manhattan distance between two grid positions
export function gridDistance(x1, z1, x2, z2) {
  return Math.abs(x1 - x2) + Math.abs(z1 - z2);
}

// Convert color number to CSS hex string
export function colorToHex(colorNumber) {
  return '#' + colorNumber.toString(16).padStart(6, '0');
}
```

**Step 2: Update game.js to import from geometry.js**

Add at top of `web/game.js`:
```javascript
import { gridToWorld, worldToGrid, isValidGrid, gridDistance } from './js/utils/geometry.js';
```

**Step 3: Verify game still runs**

Open: Browser with game
Expected: Game renders normally, colonists move correctly

**Step 4: Commit**

```bash
git add web/js/utils/geometry.js web/game.js
git commit -m "feat: extract geometry utilities to separate module"
```

---

## Task 4: Create Task Entity Class

**Files:**
- Create: `web/js/entities/Task.js`

**Step 1: Write Task.js**

```javascript
import { TASK_TYPES } from '../config.js';

export class Task {
  constructor(type, x, z, options = {}) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.x = x;
    this.z = z;
    this.status = options.status ?? "queued"; // queued | assigned | in_progress | completed | cancelled
    this.priority = options.priority ?? 5; // 1-10, higher is more important
    this.assignee = options.assignee ?? null; // Pawn ID
    this.progress = options.progress ?? 0; // 0-100 for visual feedback
    this.requiredResources = options.resources || {};
    this.buildingType = options.buildingType || null;
    this.createdAt = Date.now();
    this.completedAt = null;
  }

  get label() {
    return TASK_TYPES[this.type.toUpperCase()]?.label || this.type;
  }

  get workTime() {
    return TASK_TYPES[this.type.toUpperCase()]?.workTime || 1;
  }

  markCompleted() {
    this.status = "completed";
    this.progress = 100;
    this.completedAt = Date.now();
  }

  cancel() {
    this.status = "cancelled";
  }
}
```

**Step 2: Verify Task class syntax**

Run: JSHint or ESLint if available, or check browser console for syntax errors
Expected: No syntax errors

**Step 3: Commit**

```bash
git add web/js/entities/Task.js
git commit -m "feat: add Task entity class"
```

---

## Task 5: Create Building Entity Class

**Files:**
- Create: `web/js/entities/Building.js`

**Step 1: Write Building.js**

```javascript
import { BUILDING_TYPES } from '../config.js';

export class Building {
  constructor(type, x, z) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.x = x;
    this.z = z;
    this.hp = 100;
    this.maxHp = 100;
    this.progress = 0; // Construction progress 0-100
    this.assignedPawn = null; // Pawn currently building it
    this.isComplete = false;

    const config = BUILDING_TYPES[type];
    this.width = config.width;
    this.height = config.height;
    this.resources = config.resources;
    this.label = config.label;
    this.color = config.color;
    this.walkable = config.walkable ?? false;

    // Type-specific properties
    if (config.restores) this.restores = config.restores;
    if (config.capacity) this.capacity = config.capacity;
    if (config.open !== undefined) this.open = config.open;
  }

  updateProgress(amount) {
    this.progress = Math.min(100, Math.max(0, this.progress + amount));
    if (this.progress >= 100 && !this.isComplete) {
      this.isComplete = true;
      this.onComplete();
    }
  }

  onComplete() {
    // Called when building is fully constructed
    // Can be extended for specific building behaviors
  }

  isWalkable() {
    if (this.type === 'door') {
      return this.open;
    }
    return this.walkable;
  }

  toggleDoor() {
    if (this.type === 'door') {
      this.open = !this.open;
    }
  }
}
```

**Step 2: Verify syntax**

Expected: No syntax errors

**Step 3: Commit**

```bash
git add web/js/entities/Building.js
git commit -m "feat: add Building entity class"
```

---

## Task 6: Enhance Pawn Entity Class

**Files:**
- Create: `web/js/entities/Pawn.js`
- Modify: `web/game.js` (remove old Pawn class, import new one)

**Step 1: Write enhanced Pawn.js**

```javascript
import { gridDistance } from '../utils/geometry.js';
import { TASK_TYPES } from '../config.js';

export class Pawn {
  constructor(name, x, z, color) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.pos = { x, z };
    this.hp = 100;
    this.maxHp = 100;
    this.hunger = 0;
    this.maxHunger = 100;
    this.energy = 100;
    this.maxEnergy = 100;
    this.color = color;
    this.speed = 2.8;

    // Skills system (3-8 range on init)
    this.skills = {
      building: Math.random() * 5 + 3,
      mining: Math.random() * 5 + 3,
      planting: Math.random() * 5 + 3,
      hauling: Math.random() * 5 + 3,
      medicine: Math.random() * 5 + 3,
    };

    // State tracking
    this.taskHistory = [];
    this.currentTask = null;
    this.desires = [];
    this.healthIssues = [];
    this.isResting = false;

    // Movement
    this.targetPath = [];
    this.workTimer = 0;
    this.mesh = null;
  }

  // Get skill modifier for a task type
  getSkillModifier(taskType) {
    const skillMap = {
      build_wall: 'building',
      build_door: 'building',
      build_bed: 'building',
      build_storage: 'building',
      build_workbench: 'building',
      mine_ore: 'mining',
      plant_berry: 'planting',
      harvest_berry: 'planting',
      haul: 'hauling',
      heal: 'medicine',
    };
    const skillName = skillMap[taskType];
    if (!skillName) return 1;
    const skillLevel = this.skills[skillName] || 5;
    // Each point above 5 gives +10% speed, below gives -10%
    return 1 + (skillLevel - 5) * 0.1;
  }

  // Calculate work time with skill modifier
  getWorkTime(taskType) {
    const baseTime = TASK_TYPES[taskType.toUpperCase()]?.workTime || 1;
    const modifier = this.getSkillModifier(taskType);
    return baseTime / modifier;
  }

  // Add entry to task history
  addHistoryEntry(action) {
    const now = new Date();
    this.taskHistory.unshift({
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      action,
    });
    // Keep only last 20 entries
    if (this.taskHistory.length > 20) {
      this.taskHistory.pop();
    }
  }

  // Update needs and generate desires
  updateNeeds(dt) {
    this.desires = [];

    // Hunger increases over time
    this.hunger = Math.min(this.maxHunger, this.hunger + dt * 0.5);
    if (this.hunger > 70) {
      this.desires.push({ type: 'eat', urgency: this.hunger });
    }

    // Energy decreases over time
    this.energy = Math.max(0, this.energy - dt * 0.3);
    if (this.energy < 30) {
      this.desires.push({ type: 'sleep', urgency: 100 - this.energy });
    }

    // Health issues
    if (this.hp < 50) {
      this.healthIssues.push({ type: 'injured', severity: 100 - this.hp });
    }
  }

  // Gain experience in a skill
  gainExperience(taskType) {
    const skillMap = {
      build_wall: 'building',
      build_door: 'building',
      build_bed: 'building',
      mine_ore: 'mining',
      plant_berry: 'planting',
      harvest_berry: 'planting',
      haul: 'hauling',
    };
    const skill = skillMap[taskType];
    if (skill && this.skills[skill] < 20) {
      this.skills[skill] += 0.01;
    }
  }
}
```

**Step 2: Update game.js to import new Pawn**

Add at top of `web/game.js`:
```javascript
import { Pawn } from './js/entities/Pawn.js';
```

Remove old Pawn class definition from game.js (around line 50-80)

**Step 3: Verify game runs**

Open: Browser with game
Expected: Colonists spawn and move with skills

**Step 4: Commit**

```bash
git add web/js/entities/Pawn.js web/game.js
git commit -m "feat: add enhanced Pawn entity with skills and needs"
```

---

## Task 7: Create TaskSystem

**Files:**
- Create: `web/js/systems/TaskSystem.js`

**Step 1: Write TaskSystem.js**

```javascript
import { Task } from '../entities/Task.js';
import { gridDistance } from '../utils/geometry.js';

export class TaskSystem {
  constructor(state, pathSystem) {
    this.state = state;
    this.pathSystem = pathSystem;
    this.tasks = [];
    this.taskMap = new Map(); // "x,z" -> [tasks]
  }

  addTask(task) {
    this.tasks.push(task);
    const key = `${task.x},${task.z}`;
    if (!this.taskMap.has(key)) {
      this.taskMap.set(key, []);
    }
    this.taskMap.get(key).push(task);
  }

  removeTask(taskId) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      const task = this.tasks[index];
      const key = `${task.x},${task.z}`;
      const tasksAtKey = this.taskMap.get(key);
      if (tasksAtKey) {
        const idx = tasksAtKey.findIndex(t => t.id === taskId);
        if (idx !== -1) tasksAtKey.splice(idx, 1);
        if (tasksAtKey.length === 0) this.taskMap.delete(key);
      }
      this.tasks.splice(index, 1);
    }
  }

  hasTaskAt(x, z) {
    const key = `${x},${z}`;
    const tasksAtKey = this.taskMap.get(key);
    return tasksAtKey && tasksAtKey.length > 0;
  }

  getTasksAt(x, z) {
    const key = `${x},${z}`;
    return this.taskMap.get(key) || [];
  }

  cancelTasksAt(x, z) {
    const key = `${x},${z}`;
    const tasksAtKey = this.taskMap.get(key);
    if (tasksAtKey) {
      for (const task of tasksAtKey) {
        if (task.status === "queued" || task.status === "assigned") {
          task.cancel();
          // Clear pawn's current task if assigned
          if (task.assignee) {
            const pawn = this.state.pawns.find(p => p.id === task.assignee);
            if (pawn && pawn.currentTask?.id === task.id) {
              pawn.currentTask = null;
              pawn.targetPath = [];
            }
          }
        }
      }
    }
  }

  getTasksByType(type) {
    return this.tasks.filter(t =>
      t.type === type &&
      t.status !== "cancelled" &&
      t.status !== "completed"
    );
  }

  getTaskCounts() {
    const counts = {};
    for (const task of this.tasks) {
      if (task.status !== "cancelled" && task.status !== "completed") {
        counts[task.type] = (counts[task.type] || 0) + 1;
      }
    }
    return counts;
  }

  // Auto-assign tasks to idle pawns
  assignTasks() {
    const queued = this.tasks
      .filter(t => t.status === "queued")
      .sort((a, b) => b.priority - a.priority);

    for (const pawn of this.state.pawns) {
      if (pawn.currentTask) continue;
      if (pawn.isResting) continue;

      const nearest = this.findNearestTask(pawn, queued);
      if (!nearest) continue;

      nearest.status = "assigned";
      nearest.assignee = pawn.id;
      pawn.currentTask = nearest;

      const path = this.pathSystem.findPath(pawn.pos, { x: nearest.x, z: nearest.z });
      pawn.targetPath = path ? path.slice(1) : [];

      console.log(`${pawn.name} assigned: ${nearest.label}`);
    }
  }

  findNearestTask(pawn, availableTasks) {
    if (availableTasks.length === 0) return null;

    const withDistance = availableTasks
      .map(task => ({
        task,
        distance: gridDistance(pawn.pos.x, pawn.pos.z, task.x, task.z),
      }))
      .sort((a, b) => a.distance - b.distance);

    for (const { task } of withDistance) {
      if (this.canPawnDoTask(pawn, task)) {
        return task;
      }
    }
    return null;
  }

  canPawnDoTask(pawn, task) {
    // Check skill requirements
    if (task.type === "heal" && pawn.skills.medicine < 3) return false;
    if (task.type === "build_workbench" && pawn.skills.building < 4) return false;
    return true;
  }

  // Force assign a task to a specific pawn
  forceAssign(pawnId, taskType, x, z, priority = 10) {
    const pawn = this.state.pawns.find(p => p.id === pawnId);
    if (!pawn) return false;

    // Cancel current task
    if (pawn.currentTask) {
      pawn.currentTask.cancel();
      pawn.currentTask = null;
    }

    const task = new Task(taskType, x, z, { priority });
    task.status = "assigned";
    task.assignee = pawnId;
    this.addTask(task);

    pawn.currentTask = task;
    const path = this.pathSystem.findPath(pawn.pos, { x, z });
    pawn.targetPath = path ? path.slice(1) : [];

    return true;
  }

  // Clean up completed/cancelled tasks
  cleanup() {
    const toRemove = this.tasks.filter(t =>
      t.status === "completed" || t.status === "cancelled"
    );
    for (const task of toRemove) {
      this.removeTask(task.id);
    }
  }
}
```

**Step 2: Verify syntax**

Expected: No syntax errors

**Step 3: Commit**

```bash
git add web/js/systems/TaskSystem.js
git commit -m "feat: add TaskSystem for task management and assignment"
```

---

## Task 8: Create SelectionHandler

**Files:**
- Create: `web/js/input/SelectionHandler.js`

**Step 1: Write SelectionHandler.js**

```javascript
import { worldToGrid } from '../utils/geometry.js';

export class SelectionHandler {
  constructor(camera, raycaster, groundPlane) {
    this.camera = camera;
    this.raycaster = raycaster;
    this.groundPlane = groundPlane;
    this.isSelecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.selectedEntities = [];
    this.selectionBoxElement = null;
  }

  onStart(screenPos) {
    this.isSelecting = true;
    this.selectionStart = screenPos;
    this.showSelectionBox();
  }

  onMove(screenPos) {
    if (!this.isSelecting) return;
    this.selectionEnd = screenPos;
    this.updateSelectionBox();
  }

  onEnd() {
    this.isSelecting = false;
    const selected = this.calculateSelectedTiles();
    this.hideSelectionBox();
    return selected;
  }

  showSelectionBox() {
    if (this.selectionBoxElement) return;
    const box = document.createElement('div');
    box.className = 'selection-box';
    box.style.cssText = `
      position: absolute;
      border: 2px dashed rgba(121, 176, 255, 0.7);
      background: rgba(121, 176, 255, 0.1);
      pointer-events: none;
      z-index: 1000;
    `;
    document.body.appendChild(box);
    this.selectionBoxElement = box;
  }

  updateSelectionBox() {
    if (!this.selectionBoxElement || !this.selectionStart || !this.selectionEnd) return;

    const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
    const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);

    this.selectionBoxElement.style.left = left + 'px';
    this.selectionBoxElement.style.top = top + 'px';
    this.selectionBoxElement.style.width = width + 'px';
    this.selectionBoxElement.style.height = height + 'px';
  }

  hideSelectionBox() {
    if (this.selectionBoxElement) {
      this.selectionBoxElement.remove();
      this.selectionBoxElement = null;
    }
  }

  calculateSelectedTiles() {
    if (!this.selectionStart || !this.selectionEnd) return [];

    const tiles = [];
    const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const right = Math.max(this.selectionStart.x, this.selectionEnd.x);
    const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const bottom = Math.max(this.selectionStart.y, this.selectionEnd.y);

    // Convert screen corners to world coordinates
    const topLeft = this.screenToWorld(left, top);
    const bottomRight = this.screenToWorld(right, bottom);

    if (!topLeft || !bottomRight) return [];

    // Get grid coordinates
    const gridMin = worldToGrid(topLeft.x, topLeft.z);
    const gridMax = worldToGrid(bottomRight.x, bottomRight.z);

    // Generate all tiles in the selection rectangle
    const minX = Math.min(gridMin.x, gridMax.x);
    const maxX = Math.max(gridMin.x, gridMax.x);
    const minZ = Math.min(gridMin.z, gridMax.z);
    const maxZ = Math.max(gridMin.z, gridMax.z);

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        tiles.push({ x, z });
      }
    }

    return tiles;
  }

  screenToWorld(screenX, screenY) {
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        (screenX / window.innerWidth) * 2 - 1,
        -(screenY / window.innerHeight) * 2 + 1
      ),
      this.camera
    );
    const intersects = this.raycaster.intersectObject(this.groundPlane);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  }

  getTileAt(screenX, screenY) {
    const worldPos = this.screenToWorld(screenX, screenY);
    if (!worldPos) return null;
    return worldToGrid(worldPos.x, worldPos.z);
  }
}
```

**Step 2: Add selection box styles to styles.css**

```css
.selection-box {
  position: absolute;
  border: 2px dashed rgba(121, 176, 255, 0.7);
  background: rgba(121, 176, 255, 0.1);
  pointer-events: none;
  z-index: 1000;
}
```

**Step 3: Commit**

```bash
git add web/js/input/SelectionHandler.js web/styles.css
git commit -m "feat: add SelectionHandler for box selection"
```

---

## Task 9: Create ModeHandler

**Files:**
- Create: `web/js/input/ModeHandler.js`

**Step 1: Write ModeHandler.js**

```javascript
import { Task } from '../entities/Task.js';
import { BUILDING_TYPES } from '../config.js';
import { isValidGrid } from '../utils/geometry.js';

export class ModeHandler {
  constructor(state, taskSystem, pathSystem) {
    this.state = state;
    this.taskSystem = taskSystem;
    this.pathSystem = pathSystem;
    this.currentMode = "inspect";
    this.selectedBuildingType = null;
    this.priorityLevel = 5;
  }

  setMode(mode, buildingType = null) {
    this.currentMode = mode;
    this.selectedBuildingType = buildingType;
    console.log(`Mode: ${mode}`, buildingType ? `(${buildingType})` : '');
  }

  setPriority(level) {
    this.priorityLevel = Math.max(1, Math.min(10, level));
    console.log(`Priority: ${this.priorityLevel}`);
  }

  handleInteraction(selectedTiles, clickedEntity = null) {
    switch (this.currentMode) {
      case "inspect":
        // Handled by UI
        break;
      case "build":
        this.createBuildTasks(selectedTiles);
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

  createBuildTasks(tiles) {
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
    if (!this.checkResources(config.resources, tiles.length)) {
      this.showResourceWarning(config.resources);
      return;
    }

    let created = 0;
    for (const tile of tiles) {
      if (!isValidGrid(tile.x, tile.z)) continue;
      if (this.taskSystem.hasTaskAt(tile.x, tile.z)) continue;

      const task = new Task(`build_${this.selectedBuildingType}`, tile.x, tile.z, {
        priority: this.priorityLevel,
        buildingType: this.selectedBuildingType,
        resources: { ...config.resources },
      });
      this.taskSystem.addTask(task);
      created++;
    }

    // Deduct resources
    this.deductResources(config.resources, tiles.length);
    console.log(`Created ${created} build tasks`);
  }

  createMineTasks(target) {
    if (Array.isArray(target)) {
      // Box selection - find ore in selected tiles
      for (const tile of target) {
        const ore = this.state.ores?.find(o => o.x === tile.x && o.z === tile.z);
        if (ore && !this.taskSystem.hasTaskAt(tile.x, tile.z)) {
          const task = new Task('mine_ore', tile.x, tile.z, {
            priority: this.priorityLevel,
          });
          this.taskSystem.addTask(task);
        }
      }
    } else if (target && target.type === 'ore') {
      // Single ore clicked
      if (!this.taskSystem.hasTaskAt(target.x, target.z)) {
        const task = new Task('mine_ore', target.x, target.z, {
          priority: this.priorityLevel,
        });
        this.taskSystem.addTask(task);
      }
    }
  }

  createHarvestTasks(target) {
    if (Array.isArray(target)) {
      for (const tile of target) {
        const bush = this.state.berryBushes?.find(b => b.x === tile.x && b.z === tile.z);
        if (bush && bush.berryCount > 0 && !this.taskSystem.hasTaskAt(tile.x, tile.z)) {
          const task = new Task('harvest_berry', tile.x, tile.z, {
            priority: this.priorityLevel,
          });
          this.taskSystem.addTask(task);
        }
      }
    } else if (target && target.type === 'berry_bush') {
      if (target.berryCount > 0 && !this.taskSystem.hasTaskAt(target.x, target.z)) {
        const task = new Task('harvest_berry', target.x, target.z, {
          priority: this.priorityLevel,
        });
        this.taskSystem.addTask(task);
      }
    }
  }

  checkResources(required, count) {
    for (const [resource, amount] of Object.entries(required)) {
      if ((this.state.resources[resource] || 0) < amount * count) {
        return false;
      }
    }
    return true;
  }

  deductResources(required, count) {
    for (const [resource, amount] of Object.entries(required)) {
      this.state.resources[resource] = (this.state.resources[resource] || 0) - amount * count;
    }
  }

  showResourceWarning(required) {
    console.warn("Insufficient resources:", required);
    // TODO: Show UI notification
  }
}
```

**Step 2: Verify syntax**

Expected: No syntax errors

**Step 3: Commit**

```bash
git add web/js/input/ModeHandler.js
git commit -m "feat: add ModeHandler for build modes and task creation"
```

---

## Task 10: Create InputManager

**Files:**
- Create: `web/js/input/InputManager.js`

**Step 1: Write InputManager.js**

```javascript
import { SelectionHandler } from './SelectionHandler.js';
import { ModeHandler } from './ModeHandler.js';

export class InputManager {
  constructor(canvas, camera, raycaster, groundPlane, state, taskSystem, pathSystem, uiManager) {
    this.canvas = canvas;
    this.camera = camera;
    this.raycaster = raycaster;
    this.groundPlane = groundPlane;
    this.state = state;
    this.uiManager = uiManager;

    this.selectionHandler = new SelectionHandler(camera, raycaster, groundPlane);
    this.modeHandler = new ModeHandler(state, taskSystem, pathSystem);

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse down - start box selection
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button === 0) { // Left click
        this.selectionHandler.onStart({ x: e.clientX, y: e.clientY });
      } else if (e.button === 2) { // Right click - cancel tasks
        this.handleRightClick(e);
      }
    });

    // Mouse move - update selection
    this.canvas.addEventListener('pointermove', (e) => {
      this.selectionHandler.onMove({ x: e.clientX, y: e.clientY });
    });

    // Mouse up - complete selection
    this.canvas.addEventListener('pointerup', (e) => {
      if (e.button === 0) {
        const selectedTiles = this.selectionHandler.onEnd();
        const clickedEntity = this.getClickedEntity(e);
        this.modeHandler.handleInteraction(selectedTiles, clickedEntity);
      }
    });

    // Disable context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleKeyDown(e) {
    // F - toggle camera follow
    if (e.key === 'f' || e.key === 'F') {
      this.toggleFollowMode();
    }

    // Space - pause
    if (e.key === ' ') {
      e.preventDefault();
      this.togglePause();
    }

    // 1-3 - set priority
    if (e.key >= '1' && e.key <= '3') {
      this.modeHandler.setPriority(parseInt(e.key) * 3);
    }

    // Escape - cancel current mode
    if (e.key === 'Escape') {
      this.modeHandler.setMode('inspect');
    }
  }

  handleRightClick(event) {
    const tile = this.selectionHandler.getTileAt(event.clientX, event.clientY);
    if (tile) {
      this.modeHandler.handleInteraction([tile], null);
    }
  }

  getClickedEntity(event) {
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      ),
      this.camera
    );

    // Check pawns first
    const pawnMeshes = this.state.pawns.filter(p => p.mesh).map(p => p.mesh);
    const pawnIntersects = this.raycaster.intersectObjects(pawnMeshes);
    if (pawnIntersects.length > 0) {
      const mesh = pawnIntersects[0].object;
      return this.state.pawns.find(p => p.mesh === mesh);
    }

    // TODO: Check other entities (ores, berry bushes, buildings)

    return null;
  }

  setMode(mode, buildingType = null) {
    this.modeHandler.setMode(mode, buildingType);
  }

  toggleFollowMode() {
    // TODO: Implement camera follow
    console.log('Toggle follow mode');
  }

  togglePause() {
    // TODO: Implement pause
    console.log('Toggle pause');
  }
}
```

**Step 2: Verify syntax**

Expected: No syntax errors

**Step 3: Commit**

```bash
git add web/js/input/InputManager.js
git commit -m "feat: add InputManager for input handling coordination"
```

---

## Task 11: Create TaskCounterPanel

**Files:**
- Create: `web/js/ui/panels/TaskCounterPanel.js`
- Modify: `web/index.html`
- Modify: `web/styles.css`

**Step 1: Write TaskCounterPanel.js**

```javascript
import { TASK_TYPES } from '../../config.js';

export class TaskCounterPanel {
  constructor(taskSystem) {
    this.taskSystem = taskSystem;
    this.element = null;
    this.tooltip = null;
  }

  init() {
    this.element = document.getElementById('task-counter');
    if (!this.element) {
      console.warn('Task counter element not found');
      return;
    }
    this.render();
  }

  render() {
    if (!this.element) return;

    const counts = this.taskSystem.getTaskCounts();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    this.element.innerHTML = `
      <div class="task-counter-header">
        <span class="task-counter-title">任务队列</span>
        <span class="total-count">${total}</span>
      </div>
      <div class="task-counts">
        ${Object.entries(counts).length > 0 ? Object.entries(counts).map(([type, count]) => `
          <div class="task-count-item" data-task-type="${type}">
            <span class="task-label">${this.getTaskLabel(type)}</span>
            <span class="task-count">${count}</span>
          </div>
        `).join('') : '<div class="no-tasks">暂无任务</div>'}
      </div>
    `;

    this.setupTooltips();
  }

  getTaskLabel(type) {
    return TASK_TYPES[type.toUpperCase()]?.label || type;
  }

  setupTooltips() {
    if (!this.element) return;

    this.element.querySelectorAll('.task-count-item').forEach(item => {
      item.addEventListener('mouseenter', (e) => {
        const taskType = e.currentTarget.dataset.taskType;
        this.showTooltip(taskType, e);
      });
      item.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  showTooltip(taskType, event) {
    const tasks = this.taskSystem.getTasksByType(taskType);
    if (tasks.length === 0) return;

    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'task-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-header">${this.getTaskLabel(taskType)}</div>
      <div class="tooltip-tasks">
        ${tasks.map(t => `
          <div class="tooltip-task">
            <span class="task-location">(${t.x}, ${t.z})</span>
            <span class="task-status status-${t.status}">${this.getStatusLabel(t.status)}</span>
            ${t.assignee ? `<span class="task-assignee">${this.getPawnName(t.assignee)}</span>` : '<span class="task-unassigned">未分配</span>'}
          </div>
        `).join('')}
      </div>
    `;

    document.body.appendChild(tooltip);
    this.positionTooltip(tooltip, event);
    this.tooltip = tooltip;
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  positionTooltip(tooltip, event) {
    const rect = tooltip.getBoundingClientRect();
    let x = event.clientX + 10;
    let y = event.clientY + 10;

    // Keep tooltip on screen
    if (x + rect.width > window.innerWidth) {
      x = event.clientX - rect.width - 10;
    }
    if (y + rect.height > window.innerHeight) {
      y = event.clientY - rect.height - 10;
    }

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  getStatusLabel(status) {
    const labels = {
      queued: '等待中',
      assigned: '已分配',
      in_progress: '进行中',
    };
    return labels[status] || status;
  }

  getPawnName(pawnId) {
    const pawn = this.taskSystem.state?.pawns?.find(p => p.id === pawnId);
    return pawn?.name || '未知';
  }
}
```

**Step 2: Add task counter HTML to index.html**

Add to `web/index.html` in the left panel area:
```html
<div id="task-counter" class="panel task-counter-panel">
  <!-- Task counter will be rendered here -->
</div>
```

**Step 3: Add task counter styles to styles.css**

```css
.task-counter-panel {
  top: 78px;
  left: 10px;
  width: 200px;
  max-height: 200px;
  padding: 10px;
  overflow-y: auto;
}

.task-counter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--panel-border);
}

.task-counter-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.total-count {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.task-counts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-count-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}

.task-count-item:hover {
  background: rgba(121, 176, 255, 0.15);
}

.task-label {
  font-size: 12px;
  color: var(--text-dim);
}

.task-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}

.no-tasks {
  font-size: 12px;
  color: var(--text-dim);
  text-align: center;
  padding: 10px;
}

/* Tooltip styles */
.task-tooltip {
  position: absolute;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 6px;
  padding: 8px;
  min-width: 200px;
  max-width: 300px;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.tooltip-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--panel-border);
}

.tooltip-tasks {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 200px;
  overflow-y: auto;
}

.tooltip-task {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  padding: 3px 4px;
  border-radius: 3px;
}

.task-location {
  color: var(--text-dim);
}

.task-status {
  color: var(--ok);
}

.status-queued {
  color: var(--text-dim);
}

.status-assigned {
  color: var(--accent);
}

.status-in_progress {
  color: var(--ok);
}

.task-assignee {
  color: var(--ok);
  font-size: 10px;
}

.task-unassigned {
  color: var(--text-dim);
  font-size: 10px;
  font-style: italic;
}
```

**Step 4: Verify task counter displays**

Open: Browser with game
Expected: Task counter panel shows on left

**Step 5: Commit**

```bash
git add web/js/ui/panels/TaskCounterPanel.js web/index.html web/styles.css
git commit -m "feat: add TaskCounterPanel with hover tooltips"
```

---

## Task 12: Create ColonistDetailModal

**Files:**
- Create: `web/js/ui/modals/ColonistDetailModal.js`
- Modify: `web/index.html`
- Modify: `web/styles.css`

**Step 1: Write ColonistDetailModal.js**

```javascript
import { SKILL_LABELS } from '../../config.js';

export class ColonistDetailModal {
  constructor(pawn, taskSystem) {
    this.pawn = pawn;
    this.taskSystem = taskSystem;
    this.element = null;
    this.currentTab = 'status';
  }

  show() {
    if (this.element) {
      this.close();
    }

    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';
    this.element.innerHTML = `
      <div class="modal-content colonist-detail">
        <button class="modal-close">&times;</button>

        <div class="colonist-header">
          <div class="colonist-avatar" style="background: #${this.pawn.color.toString(16).padStart(6, '0')}"></div>
          <div class="colonist-info">
            <h2>${this.pawn.name}</h2>
            <div class="colonist-status">
              ${this.pawn.currentTask ? `正在: ${this.pawn.currentTask.label}` : '空闲'}
            </div>
          </div>
        </div>

        <div class="colonist-tabs">
          <button class="tab-btn active" data-tab="status">状态</button>
          <button class="tab-btn" data-tab="skills">技能</button>
          <button class="tab-btn" data-tab="history">历史</button>
          <button class="tab-btn" data-tab="actions">操作</button>
        </div>

        <div class="colonist-tab-content">
          ${this.renderStatusTab()}
          ${this.renderSkillsTab()}
          ${this.renderHistoryTab()}
          ${this.renderActionsTab()}
        </div>
      </div>
    `;

    document.body.appendChild(this.element);
    this.setupEventListeners();
    this.showTab('status');
  }

  renderStatusTab() {
    return `
      <div class="tab-pane" data-tab="status">
        <div class="stat-bars">
          <div class="stat-bar">
            <label>生命值</label>
            <div class="bar-container">
              <div class="bar-fill hp" style="width: ${(this.pawn.hp / this.pawn.maxHp) * 100}%"></div>
            </div>
            <span class="stat-value">${this.pawn.hp}/${this.pawn.maxHp}</span>
          </div>
          <div class="stat-bar">
            <label>饥饿值</label>
            <div class="bar-container">
              <div class="bar-fill hunger" style="width: ${(this.pawn.hunger / this.pawn.maxHunger) * 100}%"></div>
            </div>
            <span class="stat-value">${this.pawn.hunger}/${this.pawn.maxHunger}</span>
          </div>
          <div class="stat-bar">
            <label>精力值</label>
            <div class="bar-container">
              <div class="bar-fill energy" style="width: ${(this.pawn.energy / this.pawn.maxEnergy) * 100}%"></div>
            </div>
            <span class="stat-value">${this.pawn.energy}/${this.pawn.maxEnergy}</span>
          </div>
        </div>
        <div class="desires-section">
          <h3>当前需求</h3>
          ${this.pawn.desires.length > 0
            ? this.pawn.desires.map(d => `<span class="desire-tag">${this.getDesireLabel(d.type)}</span>`).join('')
            : '<span class="no-desires">无特殊需求</span>'}
        </div>
      </div>
    `;
  }

  renderSkillsTab() {
    return `
      <div class="tab-pane" data-tab="skills">
        <div class="skills-list">
          ${Object.entries(this.pawn.skills).map(([skill, level]) => `
            <div class="skill-item">
              <span class="skill-name">${SKILL_LABELS[skill]}</span>
              <div class="skill-bar">
                <div class="skill-fill" style="width: ${Math.min(100, level * 5)}%"></div>
              </div>
              <span class="skill-level">${level.toFixed(1)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderHistoryTab() {
    return `
      <div class="tab-pane" data-tab="history">
        <div class="task-history">
          ${this.pawn.taskHistory.length > 0
            ? this.pawn.taskHistory.map(entry => `
              <div class="history-entry">
                <span class="history-time">${entry.time}</span>
                <span class="history-action">${entry.action}</span>
              </div>
            `).join('')
            : '<p class="no-history">暂无历史记录</p>'}
        </div>
      </div>
    `;
  }

  renderActionsTab() {
    return `
      <div class="tab-pane" data-tab="actions">
        <h3>强制派发任务</h3>
        <div class="action-buttons">
          <button class="action-btn" data-action="assign-build">指派建造任务</button>
          <button class="action-btn" data-action="assign-mine">指派采矿任务</button>
          <button class="action-btn" data-action="assign-haul">指派搬运任务</button>
          <button class="action-btn danger" data-action="cancel-current">取消当前任务</button>
        </div>
        <div id="assign-task-panel" class="assign-panel" style="display: none;">
          <p>选择地图上的位置来派发任务...</p>
        </div>
      </div>
    `;
  }

  getDesireLabel(type) {
    const labels = { eat: '进食', sleep: '休息', heal: '治疗' };
    return labels[type] || type;
  }

  setupEventListeners() {
    // Close button
    this.element.querySelector('.modal-close').addEventListener('click', () => this.close());

    // Close on overlay click
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) this.close();
    });

    // Tab buttons
    this.element.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.showTab(e.target.dataset.tab);
      });
    });

    // Action buttons
    this.element.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleAction(e.target.dataset.action);
      });
    });

    // Escape key to close
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    window.addEventListener('keydown', this.escapeHandler);
  }

  showTab(tabName) {
    this.currentTab = tabName;

    // Update tab buttons
    this.element.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Show/hide tab panes
    this.element.querySelectorAll('.tab-pane').forEach(pane => {
      pane.style.display = pane.dataset.tab === tabName ? 'block' : 'none';
    });
  }

  handleAction(action) {
    switch (action) {
      case 'assign-build':
        this.enterAssignMode('build_wall');
        break;
      case 'assign-mine':
        this.enterAssignMode('mine_ore');
        break;
      case 'assign-haul':
        this.enterAssignMode('haul');
        break;
      case 'cancel-current':
        if (this.pawn.currentTask) {
          this.pawn.currentTask.cancel();
          this.pawn.currentTask = null;
          this.pawn.targetPath = [];
          this.close();
        }
        break;
    }
  }

  enterAssignMode(taskType) {
    // Emit custom event for InputManager to handle
    document.dispatchEvent(new CustomEvent('enter-assign-mode', {
      detail: { pawnId: this.pawn.id, taskType }
    }));
    this.close();
  }

  close() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    if (this.escapeHandler) {
      window.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }
  }
}
```

**Step 2: Add modal styles to styles.css**

```css
/* Modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(2px);
}

/* Modal content */
.modal-content {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 20px;
  min-width: 500px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-dim);
  cursor: pointer;
  padding: 4px 8px;
}

.modal-close:hover {
  color: var(--text-main);
}

/* Colonist detail specific */
.colonist-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--panel-border);
}

.colonist-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 3px solid var(--panel-border);
}

.colonist-info h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: var(--text-main);
}

.colonist-status {
  font-size: 14px;
  color: var(--text-dim);
}

/* Tabs */
.colonist-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--panel-border);
  padding-bottom: 8px;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-dim);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: rgba(121, 176, 255, 0.1);
  color: var(--text-main);
}

.tab-btn.active {
  background: rgba(121, 176, 255, 0.2);
  color: var(--accent);
}

/* Tab content */
.colonist-tab-content {
  min-height: 300px;
}

.tab-pane {
  display: none;
}

.tab-pane[data-tab="status"] {
  display: block;
}

/* Stat bars */
.stat-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-bar label {
  width: 60px;
  font-size: 13px;
  color: var(--text-dim);
}

.bar-container {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s;
}

.bar-fill.hp { background: var(--danger); }
.bar-fill.hunger { background: #d4a574; }
.bar-fill.energy { background: #9b59b6; }

.stat-value {
  width: 60px;
  text-align: right;
  font-size: 12px;
  color: var(--text-dim);
}

/* Desires */
.desires-section h3 {
  font-size: 14px;
  color: var(--text-dim);
  margin: 0 0 8px 0;
}

.desire-tag {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(121, 176, 255, 0.2);
  border-radius: 12px;
  font-size: 12px;
  color: var(--accent);
  margin-right: 6px;
}

.no-desires {
  font-size: 13px;
  color: var(--text-dim);
  font-style: italic;
}

/* Skills */
.skills-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skill-name {
  width: 60px;
  font-size: 13px;
  color: var(--text-dim);
}

.skill-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.skill-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s;
}

.skill-level {
  width: 40px;
  text-align: right;
  font-size: 12px;
  color: var(--text-main);
}

/* History */
.task-history {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 250px;
  overflow-y: auto;
}

.history-entry {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  font-size: 12px;
}

.history-time {
  color: var(--text-dim);
}

.history-action {
  color: var(--text-main);
}

.no-history {
  color: var(--text-dim);
  text-align: center;
  padding: 20px;
}

/* Actions */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.action-btn {
  padding: 10px 16px;
  background: rgba(76, 103, 156, 0.4);
  border: 1px solid rgba(134, 170, 230, 0.5);
  border-radius: 6px;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: rgba(109, 153, 236, 0.5);
}

.action-btn.danger {
  background: rgba(232, 106, 124, 0.3);
  border-color: rgba(232, 106, 124, 0.5);
}

.action-btn.danger:hover {
  background: rgba(232, 106, 124, 0.5);
}

.assign-panel {
  padding: 12px;
  background: rgba(121, 176, 255, 0.1);
  border-radius: 6px;
  text-align: center;
  color: var(--text-dim);
  font-size: 13px;
}
```

**Step 3: Verify modal displays**

Open: Browser with game
Expected: Click colonist opens modal with tabs

**Step 4: Commit**

```bash
git add web/js/ui/modals/ColonistDetailModal.js web/styles.css
git commit -m "feat: add ColonistDetailModal with status, skills, history, actions tabs"
```

---

## Task 13: Create UIManager

**Files:**
- Create: `web/js/ui/UIManager.js`

**Step 1: Write UIManager.js**

```javascript
import { TaskCounterPanel } from './panels/TaskCounterPanel.js';
import { ColonistDetailModal } from './modals/ColonistDetailModal.js';

export class UIManager {
  constructor(state, taskSystem) {
    this.state = state;
    this.taskSystem = taskSystem;
    this.taskCounterPanel = new TaskCounterPanel(taskSystem);
    this.colonistDetailModal = null;
    this.selectedPawn = null;
  }

  init() {
    this.taskCounterPanel.init();
    this.setupPawnClickHandlers();
    this.updateAll();
  }

  setupPawnClickHandlers() {
    // Click on pawn mesh to show detail modal
    this.state.pawns.forEach(pawn => {
      if (pawn.mesh) {
        pawn.mesh.userData.pawnId = pawn.id;
      }
    });
  }

  updateAll() {
    this.taskCounterPanel.render();
    this.updateResourcePanel();
    this.updatePawnList();
  }

  updateResourcePanel() {
    const resourcePanel = document.getElementById('resources');
    if (!resourcePanel) return;

    const resources = this.state.resources || {};
    resourcePanel.innerHTML = Object.entries(resources).map(([name, amount]) => `
      <div class="resource">
        <span class="resource-name">${this.getResourceLabel(name)}</span>
        <span class="resource-amount">${Math.floor(amount)}</span>
      </div>
    `).join('');
  }

  getResourceLabel(name) {
    const labels = { wood: '木材', ore: '矿石', berry: '浆果', food: '食物' };
    return labels[name] || name;
  }

  updatePawnList() {
    const pawnList = document.getElementById('pawn-list');
    if (!pawnList) return;

    pawnList.innerHTML = this.state.pawns.map(pawn => `
      <div class="pawn-card ${this.selectedPawn?.id === pawn.id ? 'selected' : ''}" data-pawn-id="${pawn.id}">
        <div class="pawn-card-header">
          <div class="pawn-avatar-small" style="background: #${pawn.color.toString(16).padStart(6, '0')}"></div>
          <span class="pawn-name">${pawn.name}</span>
        </div>
        <div class="pawn-status">${pawn.currentTask ? pawn.currentTask.label : '空闲'}</div>
        ${pawn.desires.length > 0 ? `
          <div class="pawn-desires">
            ${pawn.desires.map(d => `<span class="desire-icon">${this.getDesireIcon(d.type)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    // Add click handlers
    pawnList.querySelectorAll('.pawn-card').forEach(card => {
      card.addEventListener('click', () => {
        const pawnId = card.dataset.pawnId;
        const pawn = this.state.pawns.find(p => p.id === pawnId);
        if (pawn) {
          this.showColonistDetail(pawn);
        }
      });
    });
  }

  getDesireIcon(type) {
    const icons = { eat: '🍖', sleep: '💤', heal: '💊' };
    return icons[type] || '❓';
  }

  showColonistDetail(pawn) {
    if (this.colonistDetailModal) {
      this.colonistDetailModal.close();
    }
    this.colonistDetailModal = new ColonistDetailModal(pawn, this.taskSystem);
    this.colonistDetailModal.show();
  }

  setSelectedPawn(pawn) {
    this.selectedPawn = pawn;
    this.updatePawnList();
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 12px 16px;
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 4000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}
```

**Step 2: Add notification animation to styles.css**

```css
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
```

**Step 3: Commit**

```bash
git add web/js/ui/UIManager.js web/styles.css
git commit -m "feat: add UIManager to coordinate UI updates"
```

---

## Task 14: Create TimeSystem

**Files:**
- Create: `web/js/systems/TimeSystem.js`

**Step 1: Write TimeSystem.js**

```javascript
export class TimeSystem {
  constructor() {
    this.isPaused = false;
    this.gameSpeed = 1;
    this.hour = 6; // Start at 6 AM
    this.day = 1;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  setSpeed(speed) {
    this.gameSpeed = Math.max(0.1, Math.min(5, speed));
  }

  cycleSpeed() {
    const speeds = [0, 1, 2, 3];
    const currentIndex = speeds.indexOf(this.gameSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    this.gameSpeed = speeds[nextIndex];
    return this.gameSpeed;
  }

  update(dt) {
    if (this.isPaused || this.gameSpeed === 0) {
      return 0;
    }

    // Time passes: dt is seconds, we want 1 real second = 1 game minute at speed 1
    const effectiveDt = dt * this.gameSpeed * 0.1;
    this.hour += effectiveDt;

    if (this.hour >= 24) {
      this.hour -= 24;
      this.day += 1;
      console.log(`Day ${this.day} begins`);
    }

    return effectiveDt;
  }

  getTimeString() {
    const hours = Math.floor(this.hour);
    const minutes = Math.floor((this.hour - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  isDaytime() {
    return this.hour >= 6 && this.hour < 20;
  }

  isNighttime() {
    return !this.isDaytime();
  }
}
```

**Step 2: Commit**

```bash
git add web/js/systems/TimeSystem.js
git commit -m "feat: add TimeSystem with pause and speed controls"
```

---

## Task 15: Create CameraFollow System

**Files:**
- Create: `web/js/systems/CameraFollow.js`

**Step 1: Write CameraFollow.js**

```javascript
import { gridToWorld } from '../utils/geometry.js';

export class CameraFollow {
  constructor(camera) {
    this.camera = camera;
    this.isFollowing = false;
    this.targetPawn = null;
    this.baseOffset = new THREE.Vector3(0, 42, 34);
    this.smoothness = 0.05;
  }

  toggleFollow(pawn) {
    if (this.isFollowing && this.targetPawn === pawn) {
      this.stopFollow();
      return false;
    } else {
      this.startFollow(pawn);
      return true;
    }
  }

  startFollow(pawn) {
    this.isFollowing = true;
    this.targetPawn = pawn;
    console.log(`Following ${pawn.name}`);
  }

  stopFollow() {
    this.isFollowing = false;
    this.targetPawn = null;
    console.log('Stopped following');
  }

  update(dt) {
    if (!this.isFollowing || !this.targetPawn) return;

    const worldPos = gridToWorld(this.targetPawn.pos.x, this.targetPawn.pos.z);
    const targetPos = new THREE.Vector3(
      worldPos.x + this.baseOffset.x,
      this.baseOffset.y,
      worldPos.z + this.baseOffset.z
    );

    // Smooth camera movement
    this.camera.position.lerp(targetPos, this.smoothness);
    this.camera.lookAt(worldPos.x, 0, worldPos.z);
  }

  setOffset(x, y, z) {
    this.baseOffset.set(x, y, z);
  }

  setSmoothness(value) {
    this.smoothness = Math.max(0.01, Math.min(1, value));
  }
}
```

**Step 2: Commit**

```bash
git add web/js/systems/CameraFollow.js
git commit -m "feat: add CameraFollow system for pawn camera tracking"
```

---

## Task 16: Create TaskMarker for Visual Feedback

**Files:**
- Create: `web/js/systems/TaskMarker.js`

**Step 1: Write TaskMarker.js**

```javascript
import { TILE_SIZE, HALF } from '../config.js';

export class TaskMarker {
  constructor(scene, taskSystem) {
    this.scene = scene;
    this.taskSystem = taskSystem;
    this.markers = new Map(); // taskId -> mesh
  }

  update() {
    // Update existing markers and remove completed tasks
    for (const task of this.taskSystem.tasks) {
      if (task.status === 'completed' || task.status === 'cancelled') {
        this.removeMarker(task.id);
        continue;
      }

      if (!this.markers.has(task.id)) {
        this.createMarker(task);
      } else {
        this.updateMarker(task);
      }
    }
  }

  createMarker(task) {
    const geometry = new THREE.RingGeometry(0.3, 0.5, 16);
    const material = new THREE.MeshBasicMaterial({
      color: this.getTaskColor(task.type),
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (task.x - HALF) * TILE_SIZE + TILE_SIZE * 0.5,
      0.15,
      (task.z - HALF) * TILE_SIZE + TILE_SIZE * 0.5
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 100; // Render on top

    this.scene.add(mesh);
    this.markers.set(task.id, mesh);
  }

  updateMarker(task) {
    const mesh = this.markers.get(task.id);
    if (!mesh) return;

    // Update opacity based on progress
    const progress = task.progress || 0;
    mesh.material.opacity = 0.7 * (1 - progress / 100);

    // Change geometry based on status
    const isAssigned = task.status === 'assigned' || task.status === 'in_progress';
    const currentGeometry = mesh.geometry;

    if (isAssigned && currentGeometry.type !== 'CircleGeometry') {
      mesh.geometry.dispose();
      mesh.geometry = new THREE.CircleGeometry(0.4, 16);
    } else if (!isAssigned && currentGeometry.type !== 'RingGeometry') {
      mesh.geometry.dispose();
      mesh.geometry = new THREE.RingGeometry(0.3, 0.5, 16);
    }
  }

  removeMarker(taskId) {
    const mesh = this.markers.get(taskId);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      this.markers.delete(taskId);
    }
  }

  getTaskColor(type) {
    const colors = {
      build_wall: 0x8b7355,
      build_door: 0x6b8e23,
      build_bed: 0xdeb887,
      build_storage: 0x654321,
      build_workbench: 0xcd853f,
      mine_ore: 0x7ec4ff,
      harvest_berry: 0x4ea43f,
      plant_berry: 0x90EE90,
      haul: 0xffa500,
      sleep: 0x9370db,
    };
    return colors[type] || 0xffffff;
  }

  cleanup() {
    for (const [taskId, mesh] of this.markers) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.markers.clear();
  }
}
```

**Step 2: Commit**

```bash
git add web/js/systems/TaskMarker.js
git commit -m "feat: add TaskMarker for visual task feedback"
```

---

## Task 17: Add Build Mode UI Buttons

**Files:**
- Modify: `web/index.html`
- Modify: `web/styles.css`

**Step 1: Add build mode buttons to index.html**

```html
<div class="panel build-mode-panel">
  <h3>建造</h3>
  <div class="button-grid">
    <button class="build-btn" data-building="wall" data-mode="build">
      <span class="build-icon">🧱</span>
      <span class="build-label">墙壁</span>
    </button>
    <button class="build-btn" data-building="door" data-mode="build">
      <span class="build-icon">🚪</span>
      <span class="build-label">门</span>
    </button>
    <button class="build-btn" data-building="bed" data-mode="build">
      <span class="build-icon">🛏️</span>
      <span class="build-label">床铺</span>
    </button>
    <button class="build-btn" data-building="storage" data-mode="build">
      <span class="build-icon">📦</span>
      <span class="build-label">储物箱</span>
    </button>
    <button class="build-btn" data-building="workbench" data-mode="build">
      <span class="build-icon">🔧</span>
      <span class="build-label">工作台</span>
    </button>
    <button class="build-btn" data-building="medical_bed" data-mode="build">
      <span class="build-icon">🏥</span>
      <span class="build-label">医务床</span>
    </button>
  </div>

  <h3>资源</h3>
  <div class="button-grid">
    <button class="action-btn" data-mode="mine">
      <span class="action-icon">⛏️</span>
      <span class="action-label">采矿</span>
    </button>
    <button class="action-btn" data-mode="harvest">
      <span class="action-icon">🫐</span>
      <span class="action-label">收获</span>
    </button>
    <button class="action-btn" data-mode="plant">
      <span class="action-icon">🌱</span>
      <span class="action-label">种植</span>
    </button>
  </div>

  <h3>优先级</h3>
  <div class="priority-selector">
    <button class="priority-btn low" data-priority="3">低</button>
    <button class="priority-btn medium active" data-priority="5">中</button>
    <button class="priority-btn high" data-priority="9">高</button>
  </div>
</div>
```

**Step 2: Add build mode styles to styles.css**

```css
.build-mode-panel {
  top: 78px;
  right: 10px;
  width: 280px;
  max-height: calc(100vh - 200px);
  padding: 12px;
  overflow-y: auto;
}

.build-mode-panel h3 {
  font-size: 13px;
  color: var(--accent);
  margin: 8px 0 6px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(121, 176, 255, 0.2);
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.build-btn, .action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  background: rgba(76, 103, 156, 0.3);
  border: 1px solid rgba(134, 170, 230, 0.4);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.build-btn:hover, .action-btn:hover {
  background: rgba(109, 153, 236, 0.4);
  border-color: var(--accent);
}

.build-btn.active {
  background: rgba(121, 176, 255, 0.3);
  border-color: var(--accent);
  box-shadow: 0 0 8px rgba(121, 176, 255, 0.4);
}

.build-icon, .action-icon {
  font-size: 20px;
}

.build-label, .action-label {
  font-size: 11px;
  color: var(--text-dim);
}

.priority-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.priority-btn {
  flex: 1;
  padding: 8px;
  background: rgba(76, 103, 156, 0.3);
  border: 1px solid rgba(134, 170, 230, 0.4);
  border-radius: 6px;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12px;
}

.priority-btn:hover {
  background: rgba(109, 153, 236, 0.4);
}

.priority-btn.active {
  background: rgba(121, 176, 255, 0.4);
  border-color: var(--accent);
}

.priority-btn.low.active { border-color: #4ea43f; color: #4ea43f; }
.priority-btn.medium.active { border-color: #ffa500; color: #ffa500; }
.priority-btn.high.active { border-color: #e86a7c; color: #e86a7c; }
```

**Step 3: Commit**

```bash
git add web/index.html web/styles.css
git commit -m "feat: add build mode UI buttons and priority selector"
```

---

## Task 18: Integrate All Systems in Main Game Loop

**Files:**
- Modify: `web/game.js`

**Step 1: Update game.js to use new modular systems**

At the top of game.js, add imports:
```javascript
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, HALF, TASK_TYPES, BUILDING_TYPES, SKILL_LABELS } from './js/config.js';
import { gridToWorld, worldToGrid, isValidGrid } from './js/utils/geometry.js';
import { Pawn } from './js/entities/Pawn.js';
import { Task } from './js/entities/Task.js';
import { Building } from './js/entities/Building.js';
import { TaskSystem } from './js/systems/TaskSystem.js';
import { TimeSystem } from './js/systems/TimeSystem.js';
import { CameraFollow } from './js/systems/CameraFollow.js';
import { TaskMarker } from './js/systems/TaskMarker.js';
import { UIManager } from './js/ui/UIManager.js';
import { InputManager } from './js/input/InputManager.js';
```

**Step 2: Initialize systems in init() function**

```javascript
// Add after scene setup
const taskSystem = new TaskSystem(state, pathSystem);
const timeSystem = new TimeSystem();
const cameraFollow = new CameraFollow(camera);
const taskMarker = new TaskMarker(scene, taskSystem);
const uiManager = new UIManager(state, taskSystem);
const inputManager = new InputManager(canvas, camera, raycaster, ground, state, taskSystem, pathSystem, uiManager);

// Store on state for access
state.taskSystem = taskSystem;
state.timeSystem = timeSystem;
state.cameraFollow = cameraFollow;
state.taskMarker = taskMarker;
state.uiManager = uiManager;
state.inputManager = inputManager;

// Initialize UI
uiManager.init();
```

**Step 3: Update game loop to use systems**

```javascript
function update(dt) {
  // Update time system
  const effectiveDt = timeSystem.update(dt);
  if (effectiveDt === 0) return; // Paused

  // Update pawns
  for (const pawn of state.pawns) {
    updatePawn(pawn, effectiveDt);
  }

  // Task assignment
  taskSystem.assignTasks();

  // Update task markers
  taskMarker.update();

  // Update UI
  uiManager.updateAll();

  // Camera follow
  cameraFollow.update(effectiveDt);

  // Cleanup old tasks
  taskSystem.cleanup();
}
```

**Step 4: Connect build mode buttons**

```javascript
// Add after UI initialization
document.querySelectorAll('.build-btn, .action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    const building = btn.dataset.building;

    // Update active state
    document.querySelectorAll('.build-btn, .action-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Set mode
    if (building) {
      inputManager.setMode(mode, building);
    } else {
      inputManager.setMode(mode);
    }
  });
});

// Priority buttons
document.querySelectorAll('.priority-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    inputManager.modeHandler.setPriority(parseInt(btn.dataset.priority));
  });
});
```

**Step 5: Verify everything works**

Open: Browser with game
Expected: All systems integrated, game runs with new features

**Step 6: Commit**

```bash
git add web/game.js
git commit -m "feat: integrate all modular systems into main game loop"
```

---

## Task 19: Add Pawn Task Execution Logic

**Files:**
- Modify: `web/game.js`

**Step 1: Update updatePawn function to handle tasks**

```javascript
function updatePawn(pawn, dt) {
  // Update needs
  pawn.updateNeeds(dt);

  // If working on a task
  if (pawn.currentTask) {
    const task = pawn.currentTask;

    // Move to task location if not there
    if (pawn.targetPath.length > 0) {
      movePawnAlongPath(pawn, dt);
      return;
    }

    // Check if at task location
    if (pawn.pos.x === task.x && pawn.pos.z === task.z) {
      task.status = 'in_progress';

      // Get work time modified by skill
      const workTime = pawn.getWorkTime(task.type);
      pawn.workTimer += dt;

      // Update task progress
      task.progress = Math.min(100, (pawn.workTimer / workTime) * 100);

      // Task complete
      if (pawn.workTimer >= workTime) {
        completeTask(pawn, task);
      }
    }
  }
}

function completeTask(pawn, task) {
  task.markCompleted();

  // Apply task effects
  switch (task.type) {
    case 'mine_ore':
      state.resources.ore = (state.resources.ore || 0) + 10;
      break;
    case 'harvest_berry':
      const bush = state.berryBushes.find(b => b.x === task.x && b.z === task.z);
      if (bush) {
        state.resources.berry = (state.resources.berry || 0) + bush.berryCount;
        bush.berryCount = 0;
      }
      break;
    case 'build_wall':
    case 'build_door':
    case 'build_bed':
    case 'build_storage':
    case 'build_workbench':
      const building = new Building(task.buildingType, task.x, task.z);
      state.buildings.push(building);
      break;
  }

  // Update pawn
  pawn.addHistoryEntry(`完成: ${task.label}`);
  pawn.gainExperience(task.type);
  pawn.currentTask = null;
  pawn.workTimer = 0;

  console.log(`${pawn.name} completed: ${task.label}`);
}

function movePawnAlongPath(pawn, dt) {
  if (pawn.targetPath.length === 0) return;

  const target = pawn.targetPath[0];
  const dx = target.x - pawn.pos.x;
  const dz = target.z - pawn.pos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  const moveDist = pawn.speed * dt;

  if (dist <= moveDist) {
    // Reached this waypoint
    pawn.pos.x = target.x;
    pawn.pos.z = target.z;
    pawn.targetPath.shift();
  } else {
    // Move towards waypoint
    pawn.pos.x += (dx / dist) * moveDist;
    pawn.pos.z += (dz / dist) * moveDist;
  }

  // Update mesh position
  if (pawn.mesh) {
    const worldPos = gridToWorld(pawn.pos.x, pawn.pos.z);
    pawn.mesh.position.set(worldPos.x, 0.5, worldPos.z);
  }
}
```

**Step 2: Verify pawn behavior**

Open: Browser with game
Expected: Pawns move to tasks, work, complete them

**Step 3: Commit**

```bash
git add web/game.js
git commit -m "feat: add pawn task execution logic with skill modifiers"
```

---

## Task 20: Add Pause/Speed Controls to UI

**Files:**
- Modify: `web/index.html`
- Modify: `web/styles.css`

**Step 1: Add time controls to index.html**

```html
<div class="clock-group">
  <button id="pause-btn" class="clock-btn" title="暂停 (Space)">
    <span id="pause-icon">⏸️</span>
  </button>
  <span id="game-clock" class="game-clock">06:00</span>
  <span class="day-indicator">Day <span id="day-number">1</span></span>
  <button id="speed-btn" class="clock-btn" title="游戏速度">
    <span id="speed-display">▶️ 1x</span>
  </button>
</div>
```

**Step 2: Add clock styles to styles.css**

```css
.clock-group {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.clock-btn {
  background: rgba(76, 103, 156, 0.4);
  border: 1px solid rgba(134, 170, 230, 0.5);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  min-width: 40px;
  transition: all 0.15s;
}

.clock-btn:hover {
  background: rgba(109, 153, 236, 0.5);
}

.game-clock {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  min-width: 50px;
  text-align: center;
}

.day-indicator {
  font-size: 13px;
  color: var(--text-dim);
}

#day-number {
  color: var(--accent);
  font-weight: 600;
}

#speed-display {
  font-size: 13px;
}
```

**Step 3: Connect controls in game.js**

```javascript
// Add after system initialization
const pauseBtn = document.getElementById('pause-btn');
const speedBtn = document.getElementById('speed-btn');
const clockDisplay = document.getElementById('game-clock');
const dayDisplay = document.getElementById('day-number');

pauseBtn.addEventListener('click', () => {
  const paused = timeSystem.togglePause();
  document.getElementById('pause-icon').textContent = paused ? '▶️' : '⏸️';
  pauseBtn.classList.toggle('paused', paused);
});

speedBtn.addEventListener('click', () => {
  const newSpeed = timeSystem.cycleSpeed();
  document.getElementById('speed-display').textContent =
    newSpeed === 0 ? '⏸️' : `▶️ ${newSpeed}x`;
});

// Update clock display
function updateClockDisplay() {
  clockDisplay.textContent = timeSystem.getTimeString();
  dayDisplay.textContent = timeSystem.day;
}

// Call updateClockDisplay() in game loop
```

**Step 4: Verify time controls work**

Open: Browser with game
Expected: Pause/speed buttons work, clock updates

**Step 5: Commit**

```bash
git add web/index.html web/styles.css web/game.js
git commit -m "feat: add pause and speed controls with clock display"
```

---

## Task 21: Test and Verify All Features

**Files:**
- No new files
- Manual testing

**Step 1: Create test checklist**

Test the following features:

1. **Box Selection**
   - [ ] Click and drag creates selection box
   - [ ] Selection box visual shows correctly
   - [ ] Releasing click processes selection

2. **Build Mode**
   - [ ] Click build button activates mode
   - [ ] Box selection creates multiple build tasks
   - [ ] Resource check works (shows warning if insufficient)
   - [ ] Task markers appear on map

3. **Task Counter**
   - [ ] Task counts display correctly
   - [ ] Hover tooltip shows task details
   - [ ] Clicking tasks works (if implemented)

4. **Colonist Detail**
   - [ ] Click colonist opens modal
   - [ ] All tabs display correctly (status, skills, history, actions)
   - [ ] Close button works
   - [ ] ESC key closes modal

5. **Task Assignment**
   - [ ] Idle colonists auto-assign to tasks
   - [ ] Colonists move to task locations
   - [ ] Work progress updates
   - [ ] Tasks complete and resources update

6. **Skills**
   - [ ] Different colonists have different skill levels
   - [ ] High skill colonists work faster
   - [ ] Experience gains over time

7. **Time Controls**
   - [ ] Space key toggles pause
   - [ ] Speed button cycles speeds
   - [ ] Clock displays correct time

8. **Priority**
   - [ ] Priority buttons change level
   - [ ] High priority tasks assigned first

9. **Right Click Cancel**
   - [ ] Right click on task cancels it
   - [ ] Colonist stops working on cancelled task

**Step 2: Run tests and document results**

For each test, run it and note pass/fail. Fix any issues found.

**Step 3: Create summary documentation**

If all tests pass, create a brief user guide:
```markdown
# Task Dispatch System - User Guide

## Controls
- **Left Click + Drag**: Box select area
- **Right Click**: Cancel task at location
- **Space**: Pause/Resume game
- **1/2/3**: Set task priority (Low/Medium/High)
- **F**: Toggle camera follow (with colonist selected)
- **Esc**: Cancel current mode

## Building
1. Click a building button in the right panel
2. Select priority level
3. Click or drag on map to place buildings
4. Colonists will auto-assign and build

## Colonist Details
- Click a colonist card to view details
- View stats, skills, work history
- Force assign tasks from Actions tab

## Tips
- Build beds first so colonists can rest
- High priority tasks get done first
- Right-click to cancel misplaced tasks
```

**Step 4: Final commit if tests pass**

```bash
git add docs/
git commit -m "docs: add user guide for task dispatch system"
```

---

## Summary

This plan refactors the monolithic game.js into a modular architecture and adds:

1. **Modular Structure**: entities/, systems/, ui/, input/, utils/
2. **Task System**: Player-created tasks with box selection, priority, auto-assignment
3. **UI Components**: Task counter with tooltips, colonist detail modal, build mode buttons
4. **Enhanced Entities**: Pawn with skills, Task with progress, Building types
5. **Systems**: TimeSystem with pause/speed, CameraFollow, TaskMarker for visual feedback
6. **Input**: Box selection, mode handling, priority controls, right-click cancel

**Total estimated time**: 8-12 hours for implementation

**Key files created**:
- 15+ new JavaScript modules
- Enhanced HTML structure
- Expanded CSS styles
