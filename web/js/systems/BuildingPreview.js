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
    const w = this.orientation % 2 === 0 ? this.config.width : this.config.height;
    const h = this.orientation % 2 === 0 ? this.config.height : this.config.width;

    // Create semi-transparent preview mesh
    const geometry = new THREE.BoxGeometry(w * TILE_SIZE, 1, h * TILE_SIZE);
    const material = new THREE.MeshBasicMaterial({
      color: this.config.color,
      transparent: true,
      opacity: 0.5,
      depthTest: false,
      depthWrite: false,
    });

    this.previewMesh = new THREE.Mesh(geometry, material);
    this.previewMesh.renderOrder = 100; // Render on top
    this.scene.add(this.previewMesh);

    // Create outline using edges
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00, // Green by default
      transparent: true,
      opacity: 0.8,
      depthTest: false,
    });

    this.outlineMesh = new THREE.LineSegments(edges, lineMaterial);
    this.outlineMesh.renderOrder = 101;
    this.scene.add(this.outlineMesh);

    // Set initial position below ground (hidden)
    this.previewMesh.position.set(0, -10, 0);
    this.outlineMesh.position.set(0, -10, 0);
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