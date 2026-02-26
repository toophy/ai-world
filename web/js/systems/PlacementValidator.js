import { BUILDING_TYPES, MAP_SIZE } from '../config.js';

export class PlacementValidator {
  static validate(gridPos, buildingType, orientation, state) {
    const config = BUILDING_TYPES[buildingType];
    if (!config) {
      return { valid: false, reason: 'unknown_building_type' };
    }

    const occupiedTiles = this.getOccupiedTiles(gridPos, config, orientation);

    // 1. Boundary check
    if (!this.checkBounds(occupiedTiles)) {
      return { valid: false, reason: 'out_of_bounds' };
    }

    // 2. Terrain check
    const terrainResult = this.checkTerrain(occupiedTiles, config, state);
    if (!terrainResult.valid) {
      return terrainResult;
    }

    // 3. Building overlap check
    if (this.checkOverlap(occupiedTiles, state.buildings || [])) {
      return { valid: false, reason: 'building_overlap' };
    }

    // 4. Task overlap check
    if (state.taskSystem) {
      const hasTaskAt = (x, z) => state.taskSystem.tasks?.some(t => t.x === x && t.z === z &&
        (t.status === 'queued' || t.status === 'assigned' || t.status === 'in_progress'));
      if (occupiedTiles.some(t => hasTaskAt(t.x, t.z))) {
        return { valid: false, reason: 'task_overlap' };
      }
    }

    // 5. Building-specific rules
    const rules = config.placementRules || {};
    if (rules.requiresRoof) {
      const hasWall = this.hasAdjacentStructure(occupiedTiles, state.buildings || [], ['wall']);
      if (!hasWall) {
        return { valid: false, reason: 'requires_indoors' };
      }
    }

    if (rules.minNeighbors) {
      const neighbors = this.countAdjacentBuildings(occupiedTiles, state.buildings || []);
      if (neighbors < rules.minNeighbors) {
        return { valid: false, reason: 'needs_neighbors', required: rules.minNeighbors };
      }
    }

    return { valid: true };
  }

  static getOccupiedTiles(gridPos, config, orientation) {
    const w = orientation % 2 === 0 ? config.width : config.height;
    const h = orientation % 2 === 0 ? config.height : config.width;

    const tiles = [];
    for (let dz = 0; dz < h; dz++) {
      for (let dx = 0; dx < w; dx++) {
        tiles.push({ x: gridPos.x + dx, z: gridPos.z + dz });
      }
    }
    return tiles;
  }

  static checkBounds(tiles) {
    return tiles.every(t => t.x >= 0 && t.x < MAP_SIZE && t.z >= 0 && t.z < MAP_SIZE);
  }

  static checkTerrain(tiles, config, state) {
    const allowed = config.placementRules?.allowedTerrain ||
      ['grass', 'soil', 'sand', 'rock'];

    for (const tile of tiles) {
      const terrain = state.map[tile.z]?.[tile.x]?.type;
      if (!terrain || !allowed.includes(terrain)) {
        return { valid: false, reason: 'invalid_terrain', tile };
      }
    }
    return { valid: true };
  }

  static checkOverlap(tiles, buildings) {
    return buildings.some(b => {
      if (!b.getOccupiedTiles) return false;
      const bTiles = b.getOccupiedTiles();
      return bTiles.some(bt => tiles.some(t => t.x === bt.x && t.z === bt.z));
    });
  }

  static hasAdjacentStructure(tiles, buildings, types) {
    return tiles.some(tile => {
      const adjacents = [
        { x: tile.x - 1, z: tile.z },
        { x: tile.x + 1, z: tile.z },
        { x: tile.x, z: tile.z - 1 },
        { x: tile.x, z: tile.z + 1 },
      ];
      return adjacents.some(adj =>
        buildings.some(b =>
          types.includes(b.type) && b.getOccupiedTiles().some(bt => bt.x === adj.x && bt.z === adj.z)
        )
      );
    });
  }

  static countAdjacentBuildings(tiles, buildings) {
    let count = 0;
    const checked = new Set();

    for (const tile of tiles) {
      const adjacents = [
        { x: tile.x - 1, z: tile.z },
        { x: tile.x + 1, z: tile.z },
        { x: tile.x, z: tile.z - 1 },
        { x: tile.x, z: tile.z + 1 },
      ];

      for (const adj of adjacents) {
        const key = `${adj.x},${adj.z}`;
        if (!checked.has(key)) {
          checked.add(key);
          if (buildings.some(b => b.getOccupiedTiles().some(bt => bt.x === adj.x && bt.z === adj.z))) {
            count++;
          }
        }
      }
    }

    return count;
  }
}
