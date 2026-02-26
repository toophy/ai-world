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
      // Clean up building state if this was a demolish task
      if (task.type === 'demolish' && task.buildingId) {
        const building = this.state.buildings?.find(b => b.id === task.buildingId);
        if (building && building.state === 'demolishing') {
          // Check if there are any other demolish tasks for this building
          const hasOtherDemolishTasks = this.tasks.some(t =>
            t.id !== taskId &&
            t.type === 'demolish' &&
            t.buildingId === task.buildingId &&
            t.status !== 'cancelled' &&
            t.status !== 'completed'
          );
          if (!hasOtherDemolishTasks) {
            // Reset building state if no other demolish tasks exist
            building.state = building.isComplete ? 'complete' : 'constructing';
          }
        }
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
    if (task.type === "heal" && pawn.skills.medicine < 3) return false;
    if (task.type === "build_workbench" && pawn.skills.building < 4) return false;
    return true;
  }

  forceAssign(pawnId, taskType, x, z, priority = 10) {
    const pawn = this.state.pawns.find(p => p.id === pawnId);
    if (!pawn) return false;

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

  cleanup() {
    const toRemove = this.tasks.filter(t =>
      t.status === "completed" || t.status === "cancelled"
    );
    for (const task of toRemove) {
      this.removeTask(task.id);
    }
  }
}
