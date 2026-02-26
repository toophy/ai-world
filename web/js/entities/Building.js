import { BUILDING_TYPES } from '../config.js';

export class Building {
  constructor(type, x, z, orientation = 0) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.x = x;
    this.z = z;
    this.orientation = orientation; // 0-3 for 0°, 90°, 180°, 270°
    this.state = 'constructing'; // 'planning' | 'constructing' | 'complete' | 'demolishing'
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
}
