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
    this.task = null;
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
