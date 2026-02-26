# 建筑预览与放置系统设计

**日期**: 2026-02-26
**状态**: 设计阶段
**作者**: Claude + 用户协作

## 概述

为 RimWorld 风格的殖民地游戏添加完整的建筑预览和放置系统，包括：
- 单格子建筑放置（移除多格子框选）
- 鼠标跟随的建筑预览
- 颜色编码的放置验证（绿色=可放置，红色=不可放置）
- 建筑 90° 旋转支持
- 建造/拆除进度可视化（透明度 + 轮廓）
- 建筑特定放置规则配置

## 核心设计决策

### 1. 建筑旋转
- **选择**: 90° 旋转，4 个方向（北、东、南、西）
- **控制**: R 键或右键点击
- **数据**: `orientation` 属性（0-3 对应 0°, 90°, 180°, 270°）

### 2. 放置验证规则
- **基本规则**: 边界检查、建筑重叠、地形验证
- **地形规则**: 每个建筑配置允许的地形类型
- **特定规则**: 室内要求（如床需要靠近墙壁）、最小邻居数量
- **可扩展**: 建筑可以有自己独特的配置规则

### 3. 视觉效果
| 状态 | 透明度 | 轮廓颜色 | 额外效果 |
|------|--------|----------|----------|
| 建造中 (0%) | 30% | 绿色 | - |
| 建造中 (50%) | 65% | 绿色 | - |
| 建造中 (100%) | 100% | 无 | 完成动画 |
| 拆除中 (0%) | 100% | 红色 | 拆除图标 |
| 拆除中 (100%) | 30% | 红色 | 拆除图标 |

## 架构设计

### 新增组件

```
web/js/systems/BuildingPreview.js
├── createPreviewMesh(buildingType)  → THREE.Mesh
├── createOutlineMesh(buildingType)  → THREE.Mesh
├── updatePosition(gridPos, isValid) → void
├── rotate()                         → void
└── destroy()                        → void

web/js/systems/PlacementValidator.js
├── validate(gridPos, type, orientation, state) → ValidationResult
├── getOccupiedTiles(gridPos, config, orientation) → Tile[]
├── checkBounds(tiles)               → boolean
├── checkTerrain(tiles, config, state) → ValidationResult
├── checkOverlap(tiles, buildings)   → boolean
├── checkTaskOverlap(tiles, taskSystem) → boolean
└── checkSpecificRules(tiles, config, state) → ValidationResult
```

### 修改组件

```
web/js/config.js
└── BUILDING_TYPES 扩展
    ├── width, height (已有)
    ├── placementRules (新增)
    │   ├── allowedTerrain: string[]
    │   ├── requiresRoof: boolean
    │   └── minNeighbors: number

web/js/entities/Building.js
├── orientation: number (新增, 0-3)
├── state: 'planning' | 'constructing' | 'complete' | 'demolishing' (新增)
└── getOccupiedTiles(): Tile[] (新增)

web/js/input/InputManager.js
├── buildingPreview: BuildingPreview (新增)
├── _handlePointerMove() - 添加预览更新
├── _handlePointerDown() - 添加放置和旋转
└── handleKeyDown() - 添加 R 键旋转

web/js/input/ModeHandler.js
└── createBuildTasks() - 改为单格子放置
```

## 数据流程

```
用户点击建筑按钮
    ↓
ModeHandler.setMode('build', 'bed')
    ↓
InputManager 创建 BuildingPreview
    ↓
鼠标移动
    ↓
BuildingPreview.updatePosition()
    ↓
PlacementValidator.validate()
    ↓
预览颜色更新 (绿色/红色)
    ↓
用户按 R 或右键
    ↓
BuildingPreview.rotate()
    ↓
重新验证位置
    ↓
用户左键点击
    ↓
创建 Building 实例 (state='constructing', progress=0)
    ↓
创建建造 Task
    ↓
扣除资源
    ↓
清除预览
```

## 配置示例

```javascript
export const BUILDING_TYPES = {
  bed: {
    width: 1,
    height: 2,  // 1x2 格子
    resources: { wood: 8 },
    label: "床铺",
    color: 0xdeb887,
    walkable: false,
    restores: "energy",
    placementRules: {
      allowedTerrain: ['grass', 'soil'],
      requiresRoof: true,    // 需要室内
      minNeighbors: 1,       // 至少靠近1面墙
    }
  },
  workbench: {
    width: 2,
    height: 1,
    resources: { wood: 20, ore: 5 },
    label: "工作台",
    color: 0xcd853f,
    walkable: false,
    placementRules: {
      allowedTerrain: ['grass', 'soil', 'rock'],
      requiresRoof: false,
    }
  },
  wall: {
    width: 1,
    height: 1,
    resources: { wood: 3 },
    label: "墙壁",
    color: 0x8b7355,
    walkable: false,
    placementRules: {
      allowedTerrain: ['grass', 'soil', 'sand', 'rock'],
    }
  }
};
```

## 实现顺序

### 第一阶段: 数据模型
- [ ] 扩展 `BUILDING_TYPES` 配置
- [ ] 扩展 `Building` 类添加 `orientation` 和 `state`
- [ ] 实现 `Building.getOccupiedTiles()`

### 第二阶段: 验证逻辑
- [ ] 实现 `PlacementValidator` 类
- [ ] 单元测试: 边界检查
- [ ] 单元测试: 地形检查
- [ ] 单元测试: 重叠检查
- [ ] 单元测试: 特定规则检查

### 第三阶段: 预览系统
- [ ] 实现 `BuildingPreview` 类
- [ ] 预览网格渲染
- [ ] 轮廓线渲染
- [ ] 连接 InputManager 鼠标移动事件

### 第四阶段: 放置交互
- [ ] 修改 `ModeHandler.createBuildTasks()` 为单格子
- [ ] 实现 `InputManager` 点击放置
- [ ] 实现 R 键旋转
- [ ] 实现右键旋转
- [ ] ESC 退出建造模式

### 第五阶段: 视觉效果
- [ ] 实现建造进度透明度
- [ ] 实现建造轮廓（绿色）
- [ ] 实现拆除进度透明度
- [ ] 实现拆除轮廓（红色）
- [ ] 实现拆除图标

### 第六阶段: 拆除功能
- [ ] 添加 `demolish` 任务类型
- [ ] 实现拆除任务创建
- [ ] 实现拆除进度逻辑
- [ ] 实现拆除完成处理

## 技术细节

### 旋转处理

```javascript
// 根据方向获取实际占用的格子
getOccupiedTiles() {
  const w = this.orientation % 2 === 0 ? this.width : this.height;
  const h = this.orientation % 2 === 0 ? this.height : this.width;
  const tiles = [];
  for (let dz = 0; dz < h; dz++) {
    for (let dx = 0; dx < w; dx++) {
      tiles.push({ x: this.x + dx, z: this.z + dz });
    }
  }
  return tiles;
}

// 旋转预览网格
applyRotation() {
  const angle = this.orientation * Math.PI / 2;
  this.previewMesh.rotation.y = angle;
  this.outlineMesh.rotation.y = angle;
}
```

### 室内检测

```javascript
// 检查是否有相邻墙壁
hasAdjacentWall(tiles, buildings) {
  return tiles.some(tile => {
    const adjacents = [
      { x: tile.x - 1, z: tile.z },
      { x: tile.x + 1, z: tile.z },
      { x: tile.x, z: tile.z - 1 },
      { x: tile.x, z: tile.z + 1 },
    ];
    return adjacents.some(adj =>
      buildings.some(b => b.type === 'wall' &&
        b.getOccupiedTiles().some(bt => bt.x === adj.x && bt.z === adj.z)
      )
    );
  });
}
```

### 视觉更新

```javascript
getVisualConfig() {
  switch(this.state) {
    case 'constructing':
      return {
        opacity: 0.3 + (this.progress / 100) * 0.7,
        outlineColor: 0x00ff00,
      };
    case 'complete':
      return { opacity: 1.0 };
    case 'demolishing':
      return {
        opacity: 1.0 - (this.progress / 100) * 0.7,
        outlineColor: 0xff0000,
        showIcon: true,
      };
  }
}
```

## UI 反馈

### 预览状态
- **绿色轮廓**: 可以放置
- **红色轮廓**: 不能放置（显示原因提示）
- **方向指示**: 显示当前朝向

### 建筑状态
- **悬停建造中**: 显示进度百分比
- **悬停拆除中**: 显示剩余时间
- **完成时**: 简单的"闪光"动画

## 测试计划

### 单元测试
- [ ] `PlacementValidator` 各种验证规则
- [ ] `Building.getOccupiedTiles()` 各个方向
- [ ] `Building.getVisualConfig()` 各个状态

### 集成测试
- [ ] 完整的放置流程（选择 → 移动 → 旋转 → 放置）
- [ ] 资源扣除逻辑
- [ ] 建造到完成的进度更新
- [ ] 完整的拆除流程

### 视觉测试
- [ ] 预览网格渲染正确
- [ ] 透明度渐变平滑
- [ ] 轮廓线清晰可见
- [ ] 拆除图标位置正确

## 未来扩展

可能的未来增强：
- 建筑蓝图系统（先规划，后建造）
- 建筑升级系统
- 建筑连接（如门连接墙）
- 建筑群组（一次性放置多建筑）
- 撤销/重做功能
- 建筑复制/粘贴

## 参考资料

- RimWorld 建筑系统
- Factorio 建造预览
- Dwarf Fortress 建筑状态
