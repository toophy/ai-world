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
