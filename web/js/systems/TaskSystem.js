import { gridDistance } from '../utils/geometry.js';
import { Task } from '../entities/Task.js';

/**
 * TaskSystem - Manages task creation, assignment, and completion
 *
 * Dependencies:
 * - Task entity (from entities/Task.js)
 * - gridDistance utility (from utils/geometry.js)
 * - pathSystem (from game.js - passed during instantiation)
 */
export class TaskSystem {
  constructor(pathSystem) {
    this.pathSystem = pathSystem;
  }

  /**
   * Assign tasks to idle pawns based on priority and distance
   * @param {Array} tasks - Array of Task objects
   * @param {Array} pawns - Array of Pawn objects
   */
  assignTasks(tasks, pawns) {
    // Get queued tasks sorted by priority (higher first)
    const queued = tasks
      .filter(task => task.status === 'queued')
      .sort((a, b) => b.priority - a.priority);

    for (const pawn of pawns) {
      // Skip if pawn already has a task
      if (pawn.currentTask) continue;

      // Find nearest task based on grid distance
      const nearest = queued
        .map(task => ({
          task,
          distance: gridDistance(pawn.pos.x, pawn.pos.z, task.x, task.z)
        }))
        .filter(item => item.distance !== Infinity) // Ensure reachable
        .sort((a, b) => a.distance - b.distance)[0];

      if (!nearest) continue;

      const task = nearest.task;
      task.status = 'assigned';
      task.assignee = pawn.id;
      pawn.currentTask = task;

      // Assign path using pathSystem
      const path = this.pathSystem.findPath(pawn.pos, { x: task.x, z: task.z });
      pawn.targetPath = path.slice(1);

      console.log(`${pawn.name} assigned to ${task.label} at (${task.x}, ${task.z})`);
    }
  }

  /**
   * Create a new task
   * @param {string} type - Task type
   * @param {number} x - Grid X coordinate
   * @param {number} z - Grid Z coordinate
   * @param {Object} options - Task options (priority, resources, buildingType, etc.)
   * @returns {Task} The created task
   */
  createTask(type, x, z, options = {}) {
    return new Task(type, x, z, options);
  }

  /**
   * Complete a task
   * @param {Task} task - Task to complete
   */
  completeTask(task) {
    task.status = 'completed';
    task.progress = 100;
    task.completedAt = Date.now();
  }

  /**
   * Cancel a task
   * @param {Task} task - Task to cancel
   */
  cancelTask(task) {
    task.status = 'cancelled';
    if (task.assignee) {
      // Clear pawn's current task if this was their assignment
      task.assignee = null;
    }
  }

  /**
   * Get all tasks of a specific status
   * @param {Array} tasks - Array of Task objects
   * @param {string} status - Status to filter by
   * @returns {Array} Filtered tasks
   */
  getTasksByStatus(tasks, status) {
    return tasks.filter(task => task.status === status);
  }

  /**
   * Get all tasks assigned to a specific pawn
   * @param {Array} tasks - Array of Task objects
   * @param {string} pawnId - Pawn ID
   * @returns {Array} Tasks assigned to the pawn
   */
  getPawnTasks(tasks, pawnId) {
    return tasks.filter(task => task.assignee === pawnId);
  }

  /**
   * Update task progress
   * @param {Task} task - Task to update
   * @param {number} progress - Progress value (0-100)
   */
  updateProgress(task, progress) {
    task.progress = Math.max(0, Math.min(100, progress));
    if (task.progress >= 100 && task.status !== 'completed') {
      this.completeTask(task);
    }
  }

  /**
   * Clean up completed/cancelled tasks from the task list
   * @param {Array} tasks - Array of Task objects
   * @returns {Array} Cleaned task array
   */
  cleanupTasks(tasks) {
    return tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
  }

  /**
   * Auto-generate tasks based on game state (e.g., harvesting mature crops)
   * @param {Object} state - Game state containing berryBushes, resources, etc.
   * @param {Array} existingTasks - Existing tasks to avoid duplicates
   * @returns {Array} Newly created tasks
   */
  autoGenerateTasks(state, existingTasks = []) {
    const newTasks = [];

    // Auto-harvest mature berries
    const matureBushes = state.berryBushes.filter(
      bush => bush.berryCount > 0 &&
      !existingTasks.some(t => t.type === 'harvest_berry' && t.x === bush.x && t.z === bush.z)
    );

    for (const bush of matureBushes) {
      const task = this.createTask('harvest_berry', bush.x, bush.z, { priority: 9 });
      newTasks.push(task);
    }

    return newTasks;
  }
}
