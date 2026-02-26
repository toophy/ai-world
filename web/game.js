import * as THREE from "https://unpkg.com/three@0.166.1/build/three.module.js";

const TILE_SIZE = 2;
const MAP_SIZE = 24;
const HALF = MAP_SIZE / 2;

const TERRAIN = {
  grass: { color: 0x4b8f46, passable: true },
  soil: { color: 0x6d5231, passable: true },
  sand: { color: 0xb8a166, passable: true },
  water: { color: 0x2d5b91, passable: false },
  rock: { color: 0x7f7f7f, passable: true },
};

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
  map: [],
  logs: [],
};

const ui = {
  resourceGroup: document.getElementById("resource-group"),
  dayLabel: document.getElementById("day-label"),
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

function gridToWorld(x, z) {
  return new THREE.Vector3((x - HALF) * TILE_SIZE + TILE_SIZE * 0.5, 0, (z - HALF) * TILE_SIZE + TILE_SIZE * 0.5);
}

function worldToGrid(v) {
  return {
    x: Math.floor(v.x / TILE_SIZE + HALF),
    z: Math.floor(v.z / TILE_SIZE + HALF),
  };
}

function inBounds(x, z) {
  return x >= 0 && x < MAP_SIZE && z >= 0 && z < MAP_SIZE;
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
  const pawn = {
    id: crypto.randomUUID(),
    name,
    hp: 100,
    hunger: 0,
    pos: { x, z },
    mesh,
    speed: 2.8,
    targetPath: [],
    task: null,
    workTimer: 0,
  };
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

function createTask(type, x, z, payload = {}) {
  state.tasks.push({
    id: crypto.randomUUID(),
    type,
    x,
    z,
    status: "queued",
    priority: payload.priority ?? 5,
    payload,
  });
}

function logEvent(text) {
  state.logs.push(`[${state.day}D ${String(Math.floor(state.hour)).padStart(2, "0")}:00] ${text}`);
  if (state.logs.length > 26) state.logs.shift();
}

function assignTasks() {
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
  return {
    build_house: "建造房屋",
    plant_berry: "种植浆果",
    harvest_berry: "收获浆果",
    mine_ore: "开采矿石",
    move_order: "移动",
    attack: "攻击",
  }[type] || type;
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

  state.tasks = state.tasks.filter((t) => t.id !== task.id);
  pawn.task = null;
  pawn.workTimer = 0;
}

function updatePawn(pawn, dt) {
  pawn.hunger += dt * 0.8;
  if (pawn.hunger > 70 && state.resources.food > 0) {
    state.resources.food -= 1;
    pawn.hunger -= 20;
    logEvent(`${pawn.name} 自动进食`);
  }

  if (pawn.targetPath.length > 0) {
    const next = pawn.targetPath[0];
    const wp = gridToWorld(next.x, next.z);
    const dir = wp.clone().sub(pawn.mesh.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist < 0.05) {
      pawn.mesh.position.set(wp.x, 0.8, wp.z);
      pawn.pos.x = next.x;
      pawn.pos.z = next.z;
      pawn.targetPath.shift();
    } else {
      dir.normalize();
      pawn.mesh.position.addScaledVector(dir, pawn.speed * dt * state.gameSpeed);
    }
    return;
  }

  if (pawn.task) {
    pawn.workTimer += dt * state.gameSpeed;
    if (pawn.workTimer >= 1.4) finishTask(pawn, pawn.task);
  } else {
    // 自动派发：寻找成熟浆果
    const mature = state.berryBushes.find((b) => b.berryCount > 0);
    if (mature && !state.tasks.some((t) => t.type === "harvest_berry" && t.x === mature.x && t.z === mature.z)) {
      createTask("harvest_berry", mature.x, mature.z, { priority: 9 });
    }
  }
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
      const color = {
        grass: "#4b8f46",
        soil: "#6d5231",
        sand: "#b8a166",
        water: "#2d5b91",
        rock: "#7f7f7f",
      }[cell.type];
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
  ui.resourceGroup.innerHTML = Object.entries(state.resources)
    .map(([k, v]) => `<div class="resource">${k.toUpperCase()}: ${Math.floor(v)}</div>`)
    .join("");

  const h = String(Math.floor(state.hour) % 24).padStart(2, "0");
  ui.dayLabel.textContent = `第 ${state.day} 天 ${h}:00`;

  ui.pawnList.innerHTML = state.pawns
    .map(
      (p) =>
        `<div class="card"><b>${p.name}</b><br/>HP: ${p.hp} | 饥饿: ${p.hunger.toFixed(0)}<br/>当前: ${
          p.task ? labelTask(p.task.type) : "空闲"
        }</div>`
    )
    .join("");

  ui.taskList.innerHTML = state.tasks
    .map((t) => `<div class="card">${labelTask(t.type)} @(${t.x},${t.z})<br/>状态: ${t.status}</div>`)
    .join("");

  ui.eventLog.innerHTML = state.logs.map((l) => `<div class="log-line">${l}</div>`).join("");

  ui.modeTip.textContent = {
    inspect: "检视模式：点击任何地块/单位查看信息。",
    build_house: "房屋耗费木材8；点击可建地块下达建造任务。",
    plant_berry: "在草地/土壤地块种植浆果。",
    harvest_berry: "点击浆果灌木下达收获任务。",
    mine_ore: "点击矿脉下达开采任务。",
    move_order: "点击地面让最近空闲小人移动。",
    attack: "点击地面，小人会到达后进行一次徒手攻击。",
  }[state.selectedMode];

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
    return;
  }

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
for (const btn of document.querySelectorAll(".clock-group button")) {
  btn.addEventListener("click", () => {
    state.gameSpeed = Number(btn.dataset.speed);
    for (const b of document.querySelectorAll(".clock-group button")) b.classList.remove("active");
    btn.classList.add("active");
  });
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
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

function tick(delta) {
  state.hour += delta * 0.3 * state.gameSpeed;
  if (state.hour >= 24) {
    state.hour -= 24;
    state.day += 1;
  }

  assignTasks();
  for (const pawn of state.pawns) updatePawn(pawn, delta);
  growPlants(delta);
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  tick(dt);
  renderUI();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

seedWorld();
renderUI();
animate();
