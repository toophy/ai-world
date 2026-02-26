import * as THREE from "https://unpkg.com/three@0.166.1/build/three.module.js";
import { TILE_SIZE, MAP_SIZE, HALF, TERRAIN, TASK_LABELS, MODE_TIPS, TASK_TYPES, BUILDING_TYPES, SKILL_LABELS } from "./js/config.js";
import { gridToWorld, worldToGrid, inBounds, isValidGrid } from "./js/utils/geometry.js";
import { Pawn } from "./js/entities/Pawn.js";
import { Task } from "./js/entities/Task.js";
import { Building } from "./js/entities/Building.js";
import { TaskSystem } from "./js/systems/TaskSystem.js";
import { TimeSystem } from "./js/systems/TimeSystem.js";
import { CameraFollow } from "./js/systems/CameraFollow.js";
import { TaskMarker } from "./js/systems/TaskMarker.js";
import { UIManager } from "./js/ui/UIManager.js";
import { InputManager } from "./js/input/InputManager.js";

const state = {
  gameSpeed: 1,
  hour: 6,
  day: 1,
  selectedMode: "inspect",
  selectedEntity: null,
  resources: { wood: 35, berry: 8, ore: 0, food: 20 },
  tasks: [],
  pawns: [],
  berryBushes: [],
  houses: [],
  ores: [],
  buildings: [],
  map: [],
  logs: [],
  // System references (will be initialized after scene setup)
  taskSystem: null,
  timeSystem: null,
  cameraFollow: null,
  taskMarker: null,
  uiManager: null,
  inputManager: null,
};

const ui = {
  resourceGroup: document.getElementById("resource-group"),
  pawnList: document.getElementById("pawn-list"),
  taskList: document.getElementById("task-list"),
  inspector: document.getElementById("inspector"),
  eventLog: document.getElementById("event-log"),
  modeTip: document.getElementById("mode-tip"),
  minimap: document.getElementById("minimap"),
};

const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87a7c3);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 42, 34);
camera.lookAt(0, 0, 0);

const hemi = new THREE.HemisphereLight(0xddeeff, 0x2b2f39, 0.8);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(20, 35, 18);
sun.castShadow = true;
scene.add(sun);

const world = new THREE.Group();
scene.add(world);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const tileMeshes = [];
const clock = new THREE.Clock();

// Pathfinding system wrapper for TaskSystem compatibility
const pathSystem = {
  findPath: null, // Will be set to findPath function after it's defined
};

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeMap() {
  for (let z = 0; z < MAP_SIZE; z++) {
    state.map[z] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      const edge = x < 3 || z < 3 || x > MAP_SIZE - 4 || z > MAP_SIZE - 4;
      const noise = Math.random();
      let type = "grass";
      if (edge && noise > 0.5) type = "water";
      else if (noise < 0.12) type = "sand";
      else if (noise > 0.8) type = "soil";
      else if (noise > 0.65) type = "rock";

      const mountain = type === "rock" && (x > MAP_SIZE * 0.55 && z > MAP_SIZE * 0.25) && Math.random() > 0.5;
      state.map[z][x] = {
        type,
        mountain,
        occupied: false,
      };
    }
  }
}

function isPassable(x, z) {
  if (!inBounds(x, z)) return false;
  const cell = state.map[z][x];
  if (cell.mountain) return false;
  return TERRAIN[cell.type].passable && !cell.occupied;
}

function buildTerrain() {
  const geo = new THREE.BoxGeometry(TILE_SIZE, 0.6, TILE_SIZE);
  for (let z = 0; z < MAP_SIZE; z++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const cell = state.map[z][x];
      const mat = new THREE.MeshStandardMaterial({ color: TERRAIN[cell.type].color });
      const tile = new THREE.Mesh(geo, mat);
      const pos = gridToWorld(x, z);
      tile.position.set(pos.x, -0.3, pos.z);
      tile.receiveShadow = true;
      tile.userData = { kind: "tile", x, z };
      world.add(tile);
      tileMeshes.push(tile);

      if (cell.mountain) {
        const m = new THREE.Mesh(
          new THREE.ConeGeometry(1.3, 3.5, 5),
          new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        m.position.set(pos.x, 1.4, pos.z);
        m.castShadow = true;
        m.userData = { kind: "mountain", x, z };
        world.add(m);
      }
    }
  }
}

function addOre(x, z) {
  const pos = gridToWorld(x, z);
  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.7),
    new THREE.MeshStandardMaterial({ color: 0x7ec4ff, emissive: 0x244a6c })
  );
  mesh.position.set(pos.x, 0.5, pos.z);
  mesh.castShadow = true;
  const node = { id: crypto.randomUUID(), x, z, amount: 40, mesh };
  mesh.userData = { kind: "ore", entity: node };
  state.ores.push(node);
  world.add(mesh);
}

function addBerryBush(x, z, mature = true) {
  const pos = gridToWorld(x, z);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 10, 10),
    new THREE.MeshStandardMaterial({ color: mature ? 0x4ea43f : 0x5c6f56 })
  );
  mesh.position.set(pos.x, 0.55, pos.z);
  mesh.castShadow = true;
  const bush = {
    id: crypto.randomUUID(),
    x,
    z,
    growth: mature ? 1 : 0,
    berryCount: mature ? randomRange(4, 7) : 0,
    mesh,
  };
  mesh.userData = { kind: "berry", entity: bush };
  state.berryBushes.push(bush);
  world.add(mesh);
}

function addHouse(x, z) {
  const pos = gridToWorld(x, z);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.4, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xa98b68 })
  );
  mesh.position.set(pos.x, 0.7, pos.z);
  mesh.castShadow = true;
  const house = { id: crypto.randomUUID(), x, z, hp: 100, mesh };
  mesh.userData = { kind: "house", entity: house };
  state.houses.push(house);
  state.buildings.push(house); // Also add to buildings array
  world.add(mesh);
  state.map[z][x].occupied = true;
}

function addPawn(name, x, z, color) {
  const pos = gridToWorld(x, z);
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 0.7, 4, 8),
    new THREE.MeshStandardMaterial({ color })
  );
  mesh.castShadow = true;
  mesh.position.set(pos.x, 0.8, pos.z);
  const pawn = new Pawn(name, x, z, color);
  pawn.mesh = mesh;
  mesh.userData = { kind: "pawn", entity: pawn };
  state.pawns.push(pawn);
  world.add(mesh);
}

function neighbors(node) {
  return [
    { x: node.x + 1, z: node.z },
    { x: node.x - 1, z: node.z },
    { x: node.x, z: node.z + 1 },
    { x: node.x, z: node.z - 1 },
  ].filter((n) => isPassable(n.x, n.z));
}

function findPath(start, goal) {
  const open = [start];
  const came = new Map();
  const key = (n) => `${n.x},${n.z}`;
  const g = new Map([[key(start), 0]]);
  const f = new Map([[key(start), Math.abs(goal.x - start.x) + Math.abs(goal.z - start.z)]]);

  while (open.length) {
    open.sort((a, b) => (f.get(key(a)) ?? 99999) - (f.get(key(b)) ?? 99999));
    const current = open.shift();
    if (!current) break;
    if (current.x === goal.x && current.z === goal.z) {
      const path = [current];
      let k = key(current);
      while (came.has(k)) {
        const prev = came.get(k);
        path.push(prev);
        k = key(prev);
      }
      return path.reverse();
    }
    for (const next of neighbors(current)) {
      const tentative = (g.get(key(current)) ?? 0) + 1;
      const nextKey = key(next);
      if (tentative < (g.get(nextKey) ?? 99999)) {
        came.set(nextKey, current);
        g.set(nextKey, tentative);
        f.set(nextKey, tentative + Math.abs(goal.x - next.x) + Math.abs(goal.z - next.z));
        if (!open.some((o) => o.x === next.x && o.z === next.z)) open.push(next);
      }
    }
  }
  return [];
}

// Set pathSystem.findPath reference for TaskSystem
pathSystem.findPath = findPath;

function createTask(type, x, z, payload = {}) {
  const task = new Task(type, x, z, {
    priority: payload.priority ?? 5,
    status: "queued",
    resources: payload.resources,
    buildingType: payload.buildingType,
  });
  state.tasks.push(task);

  // Also add to TaskSystem if it exists
  if (state.taskSystem) {
    state.taskSystem.addTask(task);
  }

  return task;
}

function logEvent(text) {
  state.logs.push(`[${state.day}D ${String(Math.floor(state.hour)).padStart(2, "0")}:00] ${text}`);
  if (state.logs.length > 26) state.logs.shift();
}

function assignTasks() {
  // Use TaskSystem if available, otherwise fall back to legacy logic
  if (state.taskSystem) {
    state.taskSystem.assignTasks();
    return;
  }

  // Legacy assignment logic
  const queued = state.tasks.filter((t) => t.status === "queued").sort((a, b) => b.priority - a.priority);
  for (const pawn of state.pawns) {
    if (pawn.task) continue;
    const nearest = queued
      .map((task) => ({
        task,
        distance: Math.abs(task.x - pawn.pos.x) + Math.abs(task.z - pawn.pos.z),
      }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (!nearest) continue;
    const task = nearest.task;
    task.status = "assigned";
    task.assignee = pawn.id;
    pawn.task = task;
    const path = findPath(pawn.pos, { x: task.x, z: task.z });
    pawn.targetPath = path.slice(1);
    logEvent(`${pawn.name} 接受任务：${labelTask(task.type)}`);
  }
}

function labelTask(type) {
  return TASK_LABELS[type] || type;
}

function finishTask(pawn, task) {
  if (task.type === "build_house") {
    if (state.resources.wood >= 8) {
      state.resources.wood -= 8;
      addHouse(task.x, task.z);
      logEvent(`${pawn.name} 完成房屋建造`);
    }
  } else if (task.type === "plant_berry") {
    addBerryBush(task.x, task.z, false);
    logEvent(`${pawn.name} 种下了浆果幼苗`);
  } else if (task.type === "harvest_berry") {
    const bush = state.berryBushes.find((b) => b.x === task.x && b.z === task.z && b.berryCount > 0);
    if (bush) {
      const picked = Math.min(3, bush.berryCount);
      bush.berryCount -= picked;
      state.resources.berry += picked;
      state.resources.food += picked;
      bush.mesh.material.color.setHex(bush.berryCount > 0 ? 0x4ea43f : 0x5c6f56);
      logEvent(`${pawn.name} 收获浆果 +${picked}`);
    }
  } else if (task.type === "mine_ore") {
    const ore = state.ores.find((o) => o.x === task.x && o.z === task.z);
    if (ore) {
      ore.amount -= 10;
      state.resources.ore += 10;
      logEvent(`${pawn.name} 开采矿石 +10`);
      if (ore.amount <= 0) {
        world.remove(ore.mesh);
        state.ores = state.ores.filter((o) => o.id !== ore.id);
        logEvent("矿脉已枯竭");
      }
    }
  } else if (task.type === "move_order") {
    logEvent(`${pawn.name} 到达目的地`);
  } else if (task.type === "attack") {
    const target = state.pawns.find((p) => p.id !== pawn.id);
    if (target) {
      target.hp = Math.max(0, target.hp - 8);
      logEvent(`${pawn.name} 徒手攻击 ${target.name} (-8HP)`);
    }
  }

  // Mark task as completed and let TaskSystem handle cleanup
  task.status = "completed";
  task.completedAt = Date.now();

  // Clear pawn task references
  if (pawn.task === task) {
    pawn.task = null;
  }
  if (pawn.currentTask === task) {
    pawn.currentTask = null;
  }
  pawn.workTimer = 0;

  // Gain experience
  pawn.gainExperience(task.type);
  pawn.addHistoryEntry(`完成 ${task.label || task.type}`);
}

function updatePawn(pawn, dt) {
  // Update needs using the Pawn class method
  if (typeof pawn.updateNeeds === 'function') {
    pawn.updateNeeds(dt * state.gameSpeed);
  }

  // Handle hunger (legacy compatibility)
  if (typeof pawn.hunger !== 'undefined') {
    pawn.hunger += dt * 0.8 * state.gameSpeed;
    if (pawn.hunger > 70 && state.resources.food > 0) {
      state.resources.food -= 1;
      pawn.hunger -= 20;
      logEvent(`${pawn.name} 自动进食`);
    }
  }

  // Check both task (old) and currentTask (new) for compatibility
  const currentTask = pawn.currentTask || pawn.task;

  // If working on a task
  if (currentTask) {
    // Move to task location if not there
    if (pawn.targetPath && pawn.targetPath.length > 0) {
      movePawnAlongPath(pawn, dt * state.gameSpeed);
      return;
    }

    // Check if at task location
    if (pawn.pos.x === currentTask.x && pawn.pos.z === currentTask.z) {
      currentTask.status = 'in_progress';

      // Get work time modified by skill
      let workTime = TASK_TYPES[currentTask.type.toUpperCase()]?.workTime || 1;
      if (typeof pawn.getSkillModifier === 'function') {
        workTime = workTime / pawn.getSkillModifier(currentTask.type);
      }

      pawn.workTimer = (pawn.workTimer || 0) + dt * state.gameSpeed;

      // Update task progress
      if (typeof currentTask.setProgress === 'function') {
        currentTask.setProgress(Math.min(100, (pawn.workTimer / workTime) * 100));
      } else {
        currentTask.progress = Math.min(100, (pawn.workTimer / workTime) * 100);
      }

      // Task complete
      if (pawn.workTimer >= workTime) {
        completeTask(pawn, currentTask);
      }
    } else {
      // Not at task location, need to move there
      const path = findPath(pawn.pos, { x: currentTask.x, z: currentTask.z });
      if (path.length > 1) {
        pawn.targetPath = path.slice(1);
      }
    }
  } else {
    // Auto-dispatch: find mature berry bushes (if TaskSystem is available)
    if (state.taskSystem && typeof state.taskSystem.hasTaskAt === 'function') {
      const mature = state.berryBushes.find((b) => b.berryCount > 0);
      if (mature && !state.taskSystem.hasTaskAt(mature.x, mature.z)) {
        const task = new Task("harvest_berry", mature.x, mature.z, { priority: 9 });
        state.taskSystem.addTask(task);
      }
    }
  }
}

/**
 * Move a pawn along their target path
 */
function movePawnAlongPath(pawn, dt) {
  if (!pawn.targetPath || pawn.targetPath.length === 0) return;

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
    pawn.mesh.position.set(worldPos.x, 0.8, worldPos.z);
  }
}

/**
 * Complete a task and apply its effects
 */
function completeTask(pawn, task) {
  // Mark task as completed
  if (typeof task.markCompleted === 'function') {
    task.markCompleted();
  } else {
    task.status = 'completed';
    task.completedAt = Date.now();
  }

  // Apply task effects
  switch (task.type) {
    case 'mine_ore':
      state.resources.ore = (state.resources.ore || 0) + 10;
      // Remove ore if depleted
      const ore = state.ores.find((o) => o.x === task.x && o.z === task.z);
      if (ore) {
        ore.amount -= 10;
        if (ore.amount <= 0) {
          world.remove(ore.mesh);
          state.ores = state.ores.filter((o) => o.id !== ore.id);
          logEvent("矿脉已枯竭");
        }
      }
      logEvent(`${pawn.name} 开采矿石 +10`);
      break;

    case 'harvest_berry':
      const bush = state.berryBushes?.find(b => b.x === task.x && b.z === task.z);
      if (bush && bush.berryCount > 0) {
        const picked = Math.min(3, bush.berryCount);
        bush.berryCount -= picked;
        state.resources.berry = (state.resources.berry || 0) + picked;
        state.resources.food = (state.resources.food || 0) + picked;
        if (bush.mesh) {
          bush.mesh.material.color.setHex(bush.berryCount > 0 ? 0x4ea43f : 0x5c6f56);
        }
        logEvent(`${pawn.name} 收获浆果 +${picked}`);
      }
      break;

    case 'build_wall':
    case 'build_door':
    case 'build_bed':
    case 'build_storage':
    case 'build_workbench':
    case 'build_house':
      if (typeof Building !== 'undefined') {
        const buildingType = task.buildingType || task.type.replace('build_', '');
        // For build_house, use 'house' type
        const actualType = buildingType === 'house' ? 'house' : buildingType;
        if (actualType === 'house') {
          addHouse(task.x, task.z);
          logEvent(`${pawn.name} 完成房屋建造`);
        } else {
          const building = new Building(actualType, task.x, task.z);
          state.buildings = state.buildings || [];
          state.buildings.push(building);
          // Mark map cell as occupied
          if (BUILDING_TYPES[actualType] && !BUILDING_TYPES[actualType].walkable) {
            state.map[task.z][task.x].occupied = true;
          }
          logEvent(`${pawn.name} 完成建造: ${BUILDING_TYPES[actualType]?.label || actualType}`);
        }
      }
      break;

    case 'plant_berry':
      addBerryBush(task.x, task.z, false);
      logEvent(`${pawn.name} 种下了浆果幼苗`);
      break;

    case 'move_order':
      logEvent(`${pawn.name} 到达目的地`);
      break;

    case 'attack':
      const target = state.pawns.find((p) => p.id !== pawn.id);
      if (target) {
        target.hp = Math.max(0, target.hp - 8);
        logEvent(`${pawn.name} 徒手攻击 ${target.name} (-8HP)`);
      }
      break;

    default:
      logEvent(`${pawn.name} 完成: ${task.label || task.type}`);
      break;
  }

  // Update pawn
  if (typeof pawn.addHistoryEntry === 'function') {
    pawn.addHistoryEntry(`完成: ${task.label || task.type}`);
  }
  if (typeof pawn.gainExperience === 'function') {
    pawn.gainExperience(task.type);
  }

  // Clear pawn task references
  if (pawn.task === task) {
    pawn.task = null;
  }
  if (pawn.currentTask === task) {
    pawn.currentTask = null;
  }
  pawn.workTimer = 0;

  console.log(`${pawn.name} completed: ${task.label || task.type}`);
}

function growPlants(dt) {
  for (const bush of state.berryBushes) {
    if (bush.growth < 1) {
      bush.growth += dt * 0.05;
      if (bush.growth >= 1) {
        bush.growth = 1;
        bush.berryCount = randomRange(3, 6);
        bush.mesh.material.color.setHex(0x4ea43f);
        logEvent("一株浆果成熟了");
      }
    } else if (bush.berryCount === 0 && Math.random() < dt * 0.08) {
      bush.berryCount = randomRange(2, 4);
      bush.mesh.material.color.setHex(0x4ea43f);
    }
  }
}

function drawMinimap() {
  const ctx = ui.minimap.getContext("2d");
  const size = 180 / MAP_SIZE;
  ctx.clearRect(0, 0, 180, 180);
  for (let z = 0; z < MAP_SIZE; z++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const cell = state.map[z][x];
      const colorHex = TERRAIN[cell.type].color;
      const color = "#" + colorHex.toString(16).padStart(6, "0");
      ctx.fillStyle = cell.mountain ? "#4f4f4f" : color;
      ctx.fillRect(x * size, z * size, size, size);
    }
  }
  for (const house of state.houses) {
    ctx.fillStyle = "#e9d2a2";
    ctx.fillRect(house.x * size, house.z * size, size, size);
  }
  for (const pawn of state.pawns) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(pawn.pos.x * size, pawn.pos.z * size, size, size);
  }
}

function renderUI() {
  // If UIManager is available, use it for some updates
  if (state.uiManager) {
    // UIManager handles its own updates in tick()
  } else {
    // Legacy UI rendering
    ui.resourceGroup.innerHTML = Object.entries(state.resources)
      .map(([k, v]) => `<div class="resource">${k.toUpperCase()}: ${Math.floor(v)}</div>`)
      .join("");

    ui.pawnList.innerHTML = state.pawns
      .map(
        (p) =>
          `<div class="card"><b>${p.name}</b><br/>HP: ${p.hp} | 饥饿: ${p.hunger.toFixed(0)}<br/>当前: ${
            p.task ? labelTask(p.task.type) : "空闲"
          }</div>`
      )
      .join("");
  }

  // Always update these legacy UI elements
  ui.resourceGroup.innerHTML = Object.entries(state.resources)
    .map(([k, v]) => `<div class="resource">${k.toUpperCase()}: ${Math.floor(v)}</div>`)
    .join("");

  // Update clock display
  if (state.timeSystem) {
    updateClockDisplay();
  }

  // Update task list from TaskSystem
  const tasks = state.taskSystem ? state.taskSystem.tasks : state.tasks;
  ui.taskList.innerHTML = tasks
    .filter(t => t.status !== "completed" && t.status !== "cancelled")
    .map((t) => `<div class="card">${labelTask(t.type)} @(${t.x},${t.z})<br/>状态: ${t.status}</div>`)
    .join("");

  ui.eventLog.innerHTML = state.logs.map((l) => `<div class="log-line">${l}</div>`).join("");

  ui.modeTip.textContent = MODE_TIPS[state.selectedMode];

  drawMinimap();
}

function inspectAt(hit) {
  if (!hit) {
    ui.inspector.innerHTML = "未选中对象";
    return;
  }
  const { kind, entity, x, z } = hit.object.userData;
  if (kind === "pawn") {
    state.selectedEntity = entity;
    ui.inspector.innerHTML = `殖民者：<b>${entity.name}</b><br/>HP: ${entity.hp}<br/>饥饿: ${entity.hunger.toFixed(0)}<br/>位置: (${entity.pos.x},${entity.pos.z})`;
  } else if (kind === "berry") {
    ui.inspector.innerHTML = `浆果灌木<br/>成熟度: ${(entity.growth * 100).toFixed(0)}%<br/>可收获: ${entity.berryCount}`;
  } else if (kind === "ore") {
    ui.inspector.innerHTML = `矿脉节点<br/>储量: ${entity.amount}`;
  } else if (kind === "house") {
    ui.inspector.innerHTML = `房屋<br/>耐久: ${entity.hp}<br/>坐标: (${entity.x},${entity.z})`;
  } else {
    ui.inspector.innerHTML = `地块: ${state.map[z][x].type}<br/>坐标: (${x},${z})`;
  }
}

function setMode(mode) {
  state.selectedMode = mode;
  for (const btn of document.querySelectorAll(".bottom-bar button")) {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  }

  // Also update InputManager mode if available
  if (state.inputManager) {
    state.inputManager.setMode(mode);
  }
}

function getClickedGrid(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(world.children, false);
  if (hits.length) return { hit: hits[0], worldPos: hits[0].point };

  const p = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(groundPlane, p)) return { hit: null, worldPos: p };
  return null;
}

canvas.addEventListener("click", (event) => {
  const info = getClickedGrid(event);
  if (!info) return;
  const cellPos = worldToGrid(info.worldPos);
  if (!inBounds(cellPos.x, cellPos.z)) return;

  if (state.selectedMode === "inspect") {
    inspectAt(info.hit);

    // Also update UI manager if available
    if (state.uiManager && info.hit?.object.userData.entity) {
      const entity = info.hit.object.userData.entity;
      if (entity instanceof Pawn) {
        state.uiManager.setSelectedPawn(entity);
      }
    }
    return;
  }

  // If InputManager is available, let it handle the interaction
  if (state.inputManager) {
    // InputManager handles mode-based interactions
    return;
  }

  // Legacy fallback
  if (state.selectedMode === "build_house") {
    if (isPassable(cellPos.x, cellPos.z) && state.map[cellPos.z][cellPos.x].type !== "water") {
      createTask("build_house", cellPos.x, cellPos.z, { priority: 8 });
      logEvent(`建造任务已下达 (${cellPos.x}, ${cellPos.z})`);
    }
  }

  if (state.selectedMode === "plant_berry") {
    const type = state.map[cellPos.z][cellPos.x].type;
    if ((type === "grass" || type === "soil") && isPassable(cellPos.x, cellPos.z)) {
      createTask("plant_berry", cellPos.x, cellPos.z, { priority: 7 });
      logEvent("已下达种植任务");
    }
  }

  if (state.selectedMode === "harvest_berry" && info.hit?.object.userData.kind === "berry") {
    const b = info.hit.object.userData.entity;
    createTask("harvest_berry", b.x, b.z, { priority: 9 });
    logEvent("已下达收获任务");
  }

  if (state.selectedMode === "mine_ore" && info.hit?.object.userData.kind === "ore") {
    const o = info.hit.object.userData.entity;
    createTask("mine_ore", o.x, o.z, { priority: 8 });
    logEvent("已下达采矿任务");
  }

  if (state.selectedMode === "move_order") {
    createTask("move_order", cellPos.x, cellPos.z, { priority: 10 });
  }

  if (state.selectedMode === "attack") {
    createTask("attack", cellPos.x, cellPos.z, { priority: 6 });
  }
});

for (const btn of document.querySelectorAll(".bottom-bar button")) {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Build mode buttons - connect to InputManager
document.querySelectorAll('.build-btn, .action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    const building = btn.dataset.building;

    document.querySelectorAll('.build-btn, .action-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (state.inputManager) {
      if (building) {
        state.inputManager.setMode(mode, building);
      } else {
        state.inputManager.setMode(mode);
      }
    } else {
      // Legacy fallback
      state.selectedMode = mode;
    }
  });
});

// Priority buttons
document.querySelectorAll('.priority-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (state.inputManager && state.inputManager.modeHandler) {
      state.inputManager.modeHandler.setPriority(parseInt(btn.dataset.priority));
    }
  });
});

function seedWorld() {
  makeMap();
  buildTerrain();
  addPawn("阿林", 7, 7, 0xf5dd8b);
  addPawn("诺雅", 9, 8, 0xff8eb2);

  for (let i = 0; i < 10; i++) {
    const x = randomRange(4, MAP_SIZE - 5);
    const z = randomRange(4, MAP_SIZE - 5);
    if (isPassable(x, z) && state.map[z][x].type !== "water") addBerryBush(x, z, true);
  }

  let ores = 0;
  for (let z = 4; z < MAP_SIZE - 4; z++) {
    for (let x = 4; x < MAP_SIZE - 4; x++) {
      if (state.map[z][x].mountain && ores < 6) {
        addOre(x, z);
        ores++;
      }
    }
  }

  logEvent("殖民地着陆完成。请选择底部指令开始建设。");
}

function initSystems() {
  // Initialize systems
  state.taskSystem = new TaskSystem(state, pathSystem);
  state.timeSystem = new TimeSystem();
  state.cameraFollow = new CameraFollow(camera);
  state.taskMarker = new TaskMarker(scene, state.taskSystem);
  state.uiManager = new UIManager(state, state.taskSystem);
  state.inputManager = new InputManager(canvas, camera, raycaster, groundPlane, state, state.taskSystem, pathSystem, state.uiManager);

  // Sync initial state
  state.timeSystem.gameSpeed = state.gameSpeed;
  state.timeSystem.hour = state.hour;
  state.timeSystem.day = state.day;

  // Initialize UI
  state.uiManager.init();

  // Migrate existing tasks to TaskSystem
  for (const task of state.tasks) {
    if (task instanceof Task) {
      state.taskSystem.addTask(task);
    } else {
      // Convert legacy task to Task instance
      const newTask = new Task(task.type, task.x, task.z, {
        priority: task.priority,
        status: task.status,
        assignee: task.assignee,
      });
      state.taskSystem.addTask(newTask);
    }
  }

  console.log("Systems initialized");

  // Time controls (must be after systems are initialized)
  const pauseBtn = document.getElementById('pause-btn');
  const speedBtn = document.getElementById('speed-btn');
  const clockDisplay = document.getElementById('game-clock');
  const dayDisplay = document.getElementById('day-number');

  pauseBtn.addEventListener('click', () => {
    const paused = state.timeSystem.togglePause();
    document.getElementById('pause-icon').textContent = paused ? '▶️' : '⏸️';
    pauseBtn.classList.toggle('paused', paused);
  });

  speedBtn.addEventListener('click', () => {
    const newSpeed = state.timeSystem.cycleSpeed();
    document.getElementById('speed-display').textContent =
      newSpeed === 0 ? '⏸️' : `▶️ ${newSpeed}x`;
  });

  // Update clock display
  window.updateClockDisplay = function() {
    clockDisplay.textContent = state.timeSystem.getTimeString();
    dayDisplay.textContent = state.timeSystem.day;
  };
}

function tick(delta) {
  // Update time system
  let effectiveDt = delta;
  if (state.timeSystem) {
    effectiveDt = state.timeSystem.update(delta);
    if (effectiveDt === 0) {
      // Game is paused
      return;
    }
    // Sync legacy state
    state.hour = state.timeSystem.hour;
    state.day = state.timeSystem.day;
    state.gameSpeed = state.timeSystem.gameSpeed;
  } else {
    // Legacy time update
    state.hour += delta * 0.3 * state.gameSpeed;
    if (state.hour >= 24) {
      state.hour -= 24;
      state.day += 1;
    }
  }

  // Assign tasks through TaskSystem
  if (state.taskSystem) {
    state.taskSystem.assignTasks();
  } else {
    assignTasks();
  }

  // Update pawns
  for (const pawn of state.pawns) {
    updatePawn(pawn, effectiveDt);
  }

  // Grow plants
  growPlants(effectiveDt);

  // Update task markers
  if (state.taskMarker) {
    state.taskMarker.update();
  }

  // Update UI
  if (state.uiManager) {
    state.uiManager.updateAll();
  }

  // Update camera follow
  if (state.cameraFollow) {
    state.cameraFollow.update(effectiveDt);
  }

  // Cleanup completed tasks
  if (state.taskSystem) {
    state.taskSystem.cleanup();
  }
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  tick(dt);
  renderUI();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Initialize the game
seedWorld();
initSystems();
renderUI();
animate();
