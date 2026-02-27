import { Task } from '../entities/Task.js';

const OBJECT_OPERATION_RULES = {
  ore: ['mine'],
  berry_bush: ['harvest'],
  building: ['demolish'],
};

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
    const BUILD_MODE = 'build';

    if (this.currentMode === BUILD_MODE && (mode !== BUILD_MODE || buildingType !== this.selectedBuildingType)) {
      if (this.inputManager) {
        this.inputManager.endBuildingPreview();
      }
    }

    this.currentMode = mode;
    this.selectedBuildingType = buildingType;
    console.log(`Mode: ${mode}`, buildingType ? `(${buildingType})` : '');

    if (mode === BUILD_MODE && buildingType && this.inputManager) {
      this.inputManager.startBuildingPreview(buildingType);
    }
  }

  setPriority(level) {
    this.priorityLevel = Math.max(1, Math.min(10, level));
    console.log(`Priority: ${this.priorityLevel}`);
  }

  handleInteraction(selectedTiles, clickedEntity = null) {
    switch (this.currentMode) {
      case "inspect":
        break;
      case "mine":
        this.createMineTasks(clickedEntity || selectedTiles);
        break;
      case "harvest":
        this.createHarvestTasks(clickedEntity || selectedTiles);
        break;
      case "demolish":
        this.createDemolishTasks(clickedEntity || selectedTiles);
        break;
      case "cancel":
        selectedTiles.forEach(tile => this.taskSystem.cancelTasksAt(tile.x, tile.z));
        break;
    }
  }

  _getEntityKind(target) {
    if (!target) return null;
    if (target.entityType) return target.entityType;
    if (target.type === 'ore') return 'ore';
    if (target.type === 'berry_bush') return 'berry_bush';
    if (target.type && ['wall', 'door', 'bed', 'storage', 'workbench', 'medical_bed', 'house'].includes(target.type)) return 'building';
    if (target.amount !== undefined && target.x !== undefined && target.z !== undefined) return 'ore';
    if (target.berryCount !== undefined && target.x !== undefined && target.z !== undefined) return 'berry_bush';
    if (target.id && target.x !== undefined && target.z !== undefined) return 'building';
    return null;
  }

  _isOperationAllowedForEntity(mode, target) {
    const kind = this._getEntityKind(target);
    if (!kind) return false;
    const allowed = OBJECT_OPERATION_RULES[kind] || [];
    return allowed.includes(mode);
  }

  createMineTasks(target) {
    if (Array.isArray(target)) {
      for (const tile of target) {
        const ore = this.state.ores?.find(o => o.x === tile.x && o.z === tile.z);
        if (ore && !this.taskSystem.hasTaskAt(tile.x, tile.z)) {
          const task = new Task('mine_ore', tile.x, tile.z, {
            priority: this.priorityLevel,
          });
          this.taskSystem.addTask(task);
        }
      }
      return;
    }

    if (!this._isOperationAllowedForEntity('mine', target)) return;

    if (!this.taskSystem.hasTaskAt(target.x, target.z)) {
      const task = new Task('mine_ore', target.x, target.z, {
        priority: this.priorityLevel,
      });
      this.taskSystem.addTask(task);
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
      return;
    }

    if (!this._isOperationAllowedForEntity('harvest', target)) return;

    if (target.berryCount > 0 && !this.taskSystem.hasTaskAt(target.x, target.z)) {
      const task = new Task('harvest_berry', target.x, target.z, {
        priority: this.priorityLevel,
      });
      this.taskSystem.addTask(task);
    }
  }

  createDemolishTasks(target) {
    if (Array.isArray(target)) {
      for (const tile of target) {
        const building = this.state.buildings?.find(b => b.x === tile.x && b.z === tile.z);
        if (building && building.state !== 'demolishing' && !this.taskSystem.hasTaskAt(tile.x, tile.z)) {
          const task = new Task('demolish', tile.x, tile.z, {
            priority: this.priorityLevel,
            buildingId: building.id,
          });
          this.taskSystem.addTask(task);
          building.state = 'demolishing';
        }
      }
      return;
    }

    if (!this._isOperationAllowedForEntity('demolish', target)) return;

    const building = this.state.buildings?.find(b => b.id === target.id) || target;
    if (building && building.state !== 'demolishing' && !this.taskSystem.hasTaskAt(building.x, building.z)) {
      const task = new Task('demolish', building.x, building.z, {
        priority: this.priorityLevel,
        buildingId: building.id,
      });
      this.taskSystem.addTask(task);
      building.state = 'demolishing';
    }
  }
}
