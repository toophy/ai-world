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
    // Store validity state
    this.isValid = isValid;
    this.currentPosition = gridPos;

    // Get actual width/height based on orientation
    const w = this.orientation % 2 === 0 ? this.config.width : this.config.height;
    const h = this.orientation % 2 === 0 ? this.config.height : this.config.width;

    // Calculate center position for multi-tile buildings
    // The gridPos represents the top-left corner of the building footprint
    // We need to center the mesh on the full footprint
    const centerX = gridPos.x + (w - 1) / 2;
    const centerZ = gridPos.z + (h - 1) / 2;

    // Convert to world coordinates
    const worldPos = gridToWorld(centerX, centerZ);

    // Update mesh positions (y=0.5 to place mesh above ground)
    this.previewMesh.position.set(worldPos.x, 0.5, worldPos.z);
    this.outlineMesh.position.set(worldPos.x, 0.5, worldPos.z);

    // Update outline color based on validity
    const outlineColor = isValid ? 0x00ff00 : 0xff0000;
    this.outlineMesh.material.color.setHex(outlineColor);
  }

  rotate() {
    // TODO: will be implemented in Task 7
  }

  destroy() {
    // TODO: will be implemented in Task 8
  }
}