// Game constants
export const TILE_SIZE = 2;
export const MAP_SIZE = 24;
export const HALF = MAP_SIZE / 2;

// Terrain types with colors and passability
export const TERRAIN = {
  grass: { color: 0x4b8f46, passable: true },
  soil: { color: 0x6d5231, passable: true },
  sand: { color: 0xb8a166, passable: true },
  water: { color: 0x2d5b91, passable: false },
  rock: { color: 0x7f7f7f, passable: true },
};

// Task types with work time, resources, yield, and labels
export const TASK_TYPES = {
  BUILD_WALL: { workTime: 2, resources: { wood: 3 }, label: "建造墙壁" },
  BUILD_DOOR: { workTime: 3, resources: { wood: 5 }, label: "建造门" },
  BUILD_BED: { workTime: 2.5, resources: { wood: 8 }, label: "建造床铺" },
  BUILD_STORAGE: { workTime: 3, resources: { wood: 12 }, label: "建造储物箱" },
  BUILD_WORKBENCH: { workTime: 5, resources: { wood: 20, ore: 5 }, label: "建造工作台" },
  MINE_ORE: { workTime: 1.5, yield: { ore: 10 }, label: "开采矿石" },
  HARVEST_BERRY: { workTime: 1, yield: { berry: 3 }, label: "收获浆果" },
  PLANT_BERRY: { workTime: 0.8, resources: {}, label: "种植浆果" },
  HAUL: { workTime: 0.5, label: "搬运" },
  SLEEP: { workTime: 0, label: "休息" },
  EAT: { workTime: 0.5, label: "进食" },
  HEAL: { workTime: 1, label: "治疗" },
};

// Task labels for UI display (legacy, maintained for compatibility)
export const TASK_LABELS = {
  build_house: "建造房屋",
  plant_berry: "种植浆果",
  harvest_berry: "收获浆果",
  mine_ore: "开采矿石",
  move_order: "移动",
  attack: "攻击",
};

// Building types configuration
export const BUILDING_TYPES = {
  wall: {
    width: 1, height: 1,
    resources: { wood: 3 },
    label: "墙壁",
    color: 0x8b7355,
    walkable: false,
    placementRules: {
      allowedTerrain: ['grass', 'soil', 'sand', 'rock'],
      requiresRoof: false,
      minNeighbors: 0,
    },
  },
  door: {
    width: 1, height: 1,
    resources: { wood: 5 },
    label: "门",
    color: 0x6b8e23,
    walkable: true,
    open: false,
    placementRules: {
      allowedTerrain: ['grass', 'soil', 'sand', 'rock'],
      requiresRoof: false,
      minNeighbors: 0,
    },
  },
  bed: {
    width: 1, height: 2,
    resources: { wood: 8 },
    label: "床铺",
    color: 0xdeb887,
    walkable: false,
    restores: "energy",
    placementRules: {
      allowedTerrain: ['grass', 'soil'],
      requiresRoof: true,
      minNeighbors: 1,
    },
  },
  storage: {
    width: 1, height: 1,
    resources: { wood: 12 },
    label: "储物箱",
    color: 0x654321,
    walkable: false,
    capacity: 500,
    placementRules: {
      allowedTerrain: ['grass', 'soil', 'sand', 'rock'],
      requiresRoof: false,
      minNeighbors: 0,
    },
  },
  workbench: {
    width: 2, height: 1,
    resources: { wood: 20, ore: 5 },
    label: "工作台",
    color: 0xcd853f,
    walkable: false,
    placementRules: {
      allowedTerrain: ['grass', 'soil', 'sand', 'rock'],
      requiresRoof: false,
      minNeighbors: 0,
    },
  },
  medical_bed: {
    width: 1, height: 1,
    resources: { wood: 15 },
    label: "医务床",
    color: 0xffe4e1,
    walkable: false,
    restores: "hp",
    placementRules: {
      allowedTerrain: ['grass', 'soil'],
      requiresRoof: true,
      minNeighbors: 0,
    },
  },
};

// Mode tips for UI
export const MODE_TIPS = {
  inspect: "检视模式：点击任何地块/单位查看信息。",
  build_house: "房屋耗费木材8；点击可建地块下达建造任务。",
  plant_berry: "在草地/土壤地块种植浆果。",
  harvest_berry: "点击浆果灌木下达收获任务。",
  mine_ore: "点击矿脉下达开采任务。",
  move_order: "点击地面让最近空闲小人移动。",
  attack: "点击地面，小人会到达后进行一次徒手攻击。",
};

// Skill labels for UI display
export const SKILL_LABELS = {
  building: "建造",
  mining: "采矿",
  planting: "种植",
  hauling: "搬运",
  medicine: "医疗",
};
