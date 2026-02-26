// Game constants
export const TILE_SIZE = 2;
export const MAP_WIDTH = 30;
export const MAP_HEIGHT = 30;
export const HALF = Math.floor(MAP_WIDTH / 2);

// Terrain colors
export const TERRAIN_COLORS = {
  grass: 0x3a5f0b,
  dirt: 0x8b7355,
  stone: 0x808080,
  water: 0x4169e1,
};

// Task types with configuration
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

// Building types configuration
export const BUILDING_TYPES = {
  wall: { width: 1, height: 1, resources: { wood: 3 }, label: "墙壁", color: 0x8b7355, walkable: false },
  door: { width: 1, height: 1, resources: { wood: 5 }, label: "门", color: 0x6b8e23, walkable: true, open: false },
  bed: { width: 1, height: 1, resources: { wood: 8 }, label: "床铺", color: 0xdeb887, walkable: false, restores: "energy" },
  storage: { width: 1, height: 1, resources: { wood: 12 }, label: "储物箱", color: 0x654321, walkable: false, capacity: 500 },
  workbench: { width: 2, height: 1, resources: { wood: 20, ore: 5 }, label: "工作台", color: 0xcd853f, walkable: false },
  medical_bed: { width: 1, height: 1, resources: { wood: 15 }, label: "医务床", color: 0xffe4e1, walkable: false, restores: "hp" },
};

// Skill labels
export const SKILL_LABELS = {
  building: "建造",
  mining: "采矿",
  planting: "种植",
  hauling: "搬运",
  medicine: "医疗",
};
