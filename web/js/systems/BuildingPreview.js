import * as THREE from "three";
import { BUILDING_TYPES } from '../config.js';
import { gridToWorld, TILE_SIZE } from '../utils/geometry.js';

export class BuildingPreview {
  constructor(scene, buildingType, orientation = 0) {
    this.scene = scene;
    this.buildingType = buildingType;
    this.orientation = orientation;
    this.config = BUILDING_TYPES[buildingType];

    this.previewMesh = null;
    this.outlineMesh = null;
    this.currentPosition = null;
    this.isValid = false;

    this.createMeshes();
  }

  createMeshes() {
    // TODO: will be implemented in Task 5
  }

  updatePosition(gridPos, isValid) {
    // TODO: will be implemented in Task 6
  }

  rotate() {
    // TODO: will be implemented in Task 7
  }

  destroy() {
    // TODO: will be implemented in Task 8
  }
}