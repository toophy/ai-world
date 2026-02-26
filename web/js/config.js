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

// Task labels for UI display
export const TASK_LABELS = {
  build_house: "建造房屋",
  plant_berry: "种植浆果",
  harvest_berry: "收获浆果",
  mine_ore: "开采矿石",
  move_order: "移动",
  attack: "攻击",
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
