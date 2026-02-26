import { Task } from '../entities/Task.js';
import { BUILDING_TYPES } from '../config.js';
import { isValidGrid } from '../utils/geometry.js';

export class ModeHandler {
  constructor(state, taskSystem, pathSystem, inputManager = null) {
    this.state = state;
    this.taskSystem = taskSystem;
    this.pathSystem = pathSystem;
    this.inputManager = inputManager;
    this.currentMode = "inspect";
    this.selectedBuildingType = null;
    this.priorityLevel = 5;
  }

  setMode(mode, buildingType = null) {
    // End building preview when exiting build mode or switching building types
    if (this.currentMode === "build" && (mode !== "build" || buildingType !== this.selectedBuildingType)) {
      if (this.inputManager && typeof this.inputManager.endBuildingPreview === 'function') {
        this.inputManager.endBuildingPreview();
      }
    }

    this.currentMode = mode;
    this.selectedBuildingType = buildingType;
    console.log(`Mode: ${mode}`, buildingType ? `(${buildingType})` : '');

    // Start building preview when entering build mode with a building type
    if (mode === "build" && buildingType && this.inputManager) {
      if (typeof this.inputManager.startBuildingPreview === 'function') {
        this.inputManager.startBuildingPreview(buildingType);
      }
    }
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
