import { TASK_TYPES } from '../config.js';

export class Task {
  constructor(type, x, z, options = {}) {
    // Validate coordinates
    if (typeof x !== 'number' || typeof z !== 'number') {
      throw new Error('Task coordinates must be numbers');
    }
    if (x < 0 || z < 0) {
      throw new Error('Task coordinates must be non-negative');
    }

    // Validate type
    if (typeof type !== 'string' || type.trim().length === 0) {
      throw new Error('Task type must be a non-empty string');
    }

    // Validate priority range
    if (options.priority !== undefined && (options.priority < 1 || options.priority > 10)) {
      throw new Error('Priority must be between 1 and 10');
    }

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
