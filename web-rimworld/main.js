import * as THREE from 'three';

const MAP_SIZE = 18;
const TILE_SIZE = 1;
const GAME_SPEED = 12;

const terrainTypes = {
  grass: { color: 0x5f9d4d, walkable: true },
  dirt: { color: 0x8c6a44, walkable: true },
  sand: { color: 0xc9b870, walkable: true },
  water: { color: 0x3e6fa9, walkable: false },
  mountain: { color: 0x696e74, walkable: false },
};

const state = {
  time: 6,
  day: 1,
  tool: 'move',
  selectedTile: null,
  resources: { wood: 20, berries: 8, ore: 0, food: 10 },
  tasks: [],
  log: [],
  tiles: [],
  colonists: [],
};

const ui = {
  resourceBar: document.getElementById('resourceBar'),
  clock: document.getElementById('clock'),
  colonistList: document.getElementById('colonistList'),
  taskStats: document.getElementById('taskStats'),
  tileInspector: document.getElementById('tileInspector'),
  taskQueue: document.getElementById('taskQueue'),
  eventLog: document.getElementById('eventLog'),
  activeTool: document.getElementById('activeToolLabel'),
  hudTip: document.getElementById('hudTip'),
};

const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111822);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(MAP_SIZE * 0.55, 18, MAP_SIZE * 0.85);
camera.lookAt(MAP_SIZE / 2, 0, MAP_SIZE / 2);

scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
dirLight.position.set(8, 14, 10);
scene.add(dirLight);

const groundGroup = new THREE.Group();
const objectGroup = new THREE.Group();
const pawnGroup = new THREE.Group();
scene.add(groundGroup, objectGroup, pawnGroup);

let selectorMesh = new THREE.Mesh(
  new THREE.RingGeometry(0.25, 0.45, 24),
  new THREE.MeshBasicMaterial({ color: 0xffdb6a, side: THREE.DoubleSide })
);
selectorMesh.rotation.x = -Math.PI / 2;
selectorMesh.visible = false;
scene.add(selectorMesh);

function pushLog(msg) {
  state.log.unshift(`[${state.day}d ${state.time.toFixed(2)}] ${msg}`);
  state.log = state.log.slice(0, 50);
}

function tileAt(x, z) {
  return state.tiles.find((t) => t.x === x && t.z === z);
}

function addTask(type, x, z, meta = {}) {
  const tile = tileAt(x, z);
  if (!tile) return;
  if (state.tasks.some((t) => t.x === x && t.z === z && t.type === type && !t.done)) return;
  const task = { id: crypto.randomUUID(), type, x, z, progress: 0, done: false, reservedBy: null, ...meta };
  state.tasks.push(task);
  pushLog(`新增任务: ${type} (${x},${z})`);
}

function generateMap() {
  const geo = new THREE.BoxGeometry(TILE_SIZE, 0.18, TILE_SIZE);
  for (let z = 0; z < MAP_SIZE; z++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      let type = 'grass';
      const r = Math.random();
      if (r < 0.12) type = 'water';
      else if (r < 0.26) type = 'sand';
      else if (r < 0.4) type = 'dirt';
      if (x > 12 && z < 5 && Math.random() < 0.65) type = 'mountain';

      const tile = { x, z, type, plant: null, ore: false, building: null, mesh: null };
      if (type === 'mountain' && Math.random() < 0.45) tile.ore = true;
      if (type === 'grass' && Math.random() < 0.14) tile.plant = { growth: 1, berries: 3 };

      const mat = new THREE.MeshLambertMaterial({ color: terrainTypes[type].color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0, z);
      mesh.userData.tileKey = `${x},${z}`;
      groundGroup.add(mesh);
      tile.mesh = mesh;
      state.tiles.push(tile);
    }
  }
}

function spawnObjects() {
  objectGroup.clear();
  for (const tile of state.tiles) {
    if (tile.plant) {
      const berry = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.6, 8),
        new THREE.MeshLambertMaterial({ color: 0x3f8f3f })
      );
      berry.position.set(tile.x, 0.4, tile.z);
      objectGroup.add(berry);
    }
    if (tile.ore && tile.type === 'mountain') {
      const ore = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.28, 0),
        new THREE.MeshLambertMaterial({ color: 0x7da0bb })
      );
      ore.position.set(tile.x, 0.36, tile.z);
      objectGroup.add(ore);
    }
    if (tile.building) {
      const house = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.82, 0.82),
        new THREE.MeshLambertMaterial({ color: 0xc4b394 })
      );
      house.position.set(tile.x, 0.52, tile.z);
      objectGroup.add(house);
    }
  }
}

function createColonist(name, x, z, color) {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.18, 0.45, 4, 8),
    new THREE.MeshLambertMaterial({ color })
  );
  mesh.position.set(x, 0.5, z);
  pawnGroup.add(mesh);
  state.colonists.push({ name, hp: 100, x, z, target: null, taskId: null, status: 'idle', mesh, attackCd: 0 });
}

function isWalkable(x, z) {
  const tile = tileAt(x, z);
  return tile && terrainTypes[tile.type].walkable;
}

function reserveTask(colonist) {
  const priorities = ['attack', 'harvest', 'mine', 'build', 'plant', 'move'];
  for (const type of priorities) {
    const task = state.tasks.find((t) => !t.done && !t.reservedBy && t.type === type);
    if (task) {
      task.reservedBy = colonist.name;
      colonist.taskId = task.id;
      colonist.target = { x: task.x, z: task.z };
      colonist.status = task.type === 'attack' ? 'combat' : 'work';
      return;
    }
  }
  colonist.status = 'idle';
}

function moveColonist(colonist, dt) {
  if (!colonist.target) return;
  const dx = colonist.target.x - colonist.x;
  const dz = colonist.target.z - colonist.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.02) {
    colonist.x = colonist.target.x;
    colonist.z = colonist.target.z;
    colonist.mesh.position.set(colonist.x, 0.5, colonist.z);
    return;
  }
  const speed = 1.2;
  colonist.x += (dx / dist) * speed * dt;
  colonist.z += (dz / dist) * speed * dt;
  colonist.mesh.position.set(colonist.x, 0.5, colonist.z);
}

function processTask(colonist, dt) {
  if (!colonist.taskId) return;
  const task = state.tasks.find((t) => t.id === colonist.taskId && !t.done);
  if (!task) {
    colonist.taskId = null;
    colonist.target = null;
    colonist.status = 'idle';
    return;
  }
  const d = Math.hypot(task.x - colonist.x, task.z - colonist.z);
  if (d > 0.2) return;

  task.progress += dt;
  if (task.type === 'attack') {
    colonist.attackCd -= dt;
    if (colonist.attackCd <= 0) {
      colonist.attackCd = 0.8;
      task.hp -= 25;
      pushLog(`${colonist.name} 进行徒手攻击`);
    }
    if (task.hp <= 0) task.progress = 99;
  }

  if (task.progress < 2) return;
  const tile = tileAt(task.x, task.z);
  switch (task.type) {
    case 'build':
      if (!tile.building && state.resources.wood >= 8) {
        tile.building = { type: 'house' };
        state.resources.wood -= 8;
      }
      break;
    case 'plant':
      if (!tile.plant) tile.plant = { growth: 0.25, berries: 0 };
      break;
    case 'harvest':
      if (tile.plant && tile.plant.berries > 0) {
        state.resources.berries += tile.plant.berries;
        tile.plant.berries = 0;
      }
      break;
    case 'mine':
      if (tile.ore) {
        tile.ore = false;
        state.resources.ore += 5;
      }
      break;
    case 'move':
      break;
    case 'attack':
      break;
  }
  task.done = true;
  colonist.taskId = null;
  colonist.target = null;
  colonist.status = 'idle';
  pushLog(`${colonist.name} 完成任务 ${task.type}`);
  spawnObjects();
}

function updatePlants(dt) {
  for (const tile of state.tiles) {
    if (tile.plant) {
      tile.plant.growth += dt * 0.03;
      if (tile.plant.growth > 1 && tile.plant.berries < 3) {
        tile.plant.berries += 1;
        tile.plant.growth = 0.4;
      }
    }
  }
}

function refreshUI() {
  ui.resourceBar.innerHTML = Object.entries(state.resources)
    .map(([k, v]) => `<span>${k.toUpperCase()}: ${v}</span>`)
    .join('');
  ui.clock.textContent = `Day ${state.day} ${Math.floor(state.time).toString().padStart(2, '0')}:${Math.floor((state.time % 1) * 60)
    .toString()
    .padStart(2, '0')}`;
  ui.colonistList.innerHTML = state.colonists
    .map(
      (c) => `<div class="card"><b>${c.name}</b> HP:${c.hp}<br/><small class="status-${c.status}">${c.status}</small><br/>位置: ${c.x.toFixed(1)},${c.z.toFixed(1)}</div>`
    )
    .join('');

  const pending = state.tasks.filter((t) => !t.done);
  ui.taskStats.innerHTML = `<div class='card'>待办任务: ${pending.length}</div>`;
  ui.taskQueue.innerHTML = pending
    .slice(0, 14)
    .map((t) => `<div class='card'>${t.type} @ (${t.x},${t.z}) ${t.reservedBy ? `- ${t.reservedBy}` : ''}</div>`)
    .join('');
  ui.eventLog.innerHTML = state.log.map((l) => `<div>${l}</div>`).join('');

  if (!state.selectedTile) {
    ui.tileInspector.textContent = '未选择地块';
  } else {
    const t = tileAt(state.selectedTile.x, state.selectedTile.z);
    ui.tileInspector.innerHTML = `<div class='card'>
      坐标: (${t.x},${t.z})<br/>
      地形: ${t.type}<br/>
      植物: ${t.plant ? `浆果(${t.plant.berries})` : '无'}<br/>
      矿物: ${t.ore ? '有' : '无'}<br/>
      建筑: ${t.building ? t.building.type : '无'}
    </div>`;
  }
}

function setupInput() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(groundGroup.children);
    if (!hits.length) return;
    const hit = hits[0].object;
    const [x, z] = hit.userData.tileKey.split(',').map(Number);
    state.selectedTile = { x, z };
    selectorMesh.visible = true;
    selectorMesh.position.set(x, 0.11, z);

    const tile = tileAt(x, z);
    if (!tile) return;
    if (!isWalkable(x, z) && !['mine', 'attack'].includes(state.tool)) {
      ui.hudTip.textContent = '该地块不可行走';
      return;
    }
    addTask(state.tool, x, z, state.tool === 'attack' ? { hp: 100 } : {});
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    state.selectedTile = null;
    selectorMesh.visible = false;
  });

  document.querySelectorAll('.bottombar button').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.tool = btn.dataset.tool;
      document.querySelectorAll('.bottombar button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      ui.activeTool.textContent = `当前模式: ${state.tool}`;
    });
  });
  document.querySelector('.bottombar button').classList.add('active');
}

function tick(dt) {
  state.time += dt * 0.22;
  if (state.time >= 24) {
    state.time -= 24;
    state.day += 1;
    state.resources.food = Math.max(0, state.resources.food - state.colonists.length);
    pushLog('新的一天开始');
  }

  updatePlants(dt);

  for (const c of state.colonists) {
    if (!c.taskId) reserveTask(c);
    moveColonist(c, dt);
    processTask(c, dt);
  }

  if (Math.random() < 0.0015) {
    const x = Math.floor(Math.random() * MAP_SIZE);
    const z = Math.floor(Math.random() * MAP_SIZE);
    addTask('attack', x, z, { hp: 80 });
  }

  refreshUI();
}

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

function init() {
  generateMap();
  spawnObjects();
  createColonist('Lyn', 4, 6, 0xe67c73);
  createColonist('Bo', 6, 7, 0x7fb3ff);
  setupInput();
  resize();
  pushLog('殖民地建立完成');

  const clock = new THREE.Clock();
  function animate() {
    const dt = Math.min(0.05, clock.getDelta() * GAME_SPEED);
    tick(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

init();
