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

  /**
   * Get the rotated dimensions of the building based on current orientation
   * @returns {Object} Object with width and height properties
   */
  getRotatedDimensions() {
    return {
      width: this.orientation % 2 === 0 ? this.config.width : this.config.height,
      height: this.orientation % 2 === 0 ? this.config.height : this.config.width
    };
  }

  createMeshes() {
    const { width: w, height: h } = this.getRotatedDimensions();

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
    // Null/undefined check - hide preview when no position is provided
    if (!gridPos) {
      this.hide();
      return;
    }

    // Store validity state
    this.isValid = isValid;
    this.currentPosition = gridPos;

    // Get actual width/height based on orientation
    const { width: w, height: h } = this.getRotatedDimensions();

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

  /**
   * Hide the preview by moving it below ground
   */
  hide() {
    if (this.previewMesh && this.outlineMesh) {
      this.previewMesh.position.set(0, -10, 0);
      this.outlineMesh.position.set(0, -10, 0);
    }
  }

  /**
   * Apply rotation to both preview and outline meshes
   */
  applyRotation() {
    const angle = this.orientation * Math.PI / 2;
    this.previewMesh.rotation.y = angle;
    this.outlineMesh.rotation.y = angle;
  }

  /**
   * Helper method to dispose of a mesh and its resources
   * @param {THREE.Mesh|THREE.LineSegments} mesh - The mesh to dispose
   */
  disposeMesh(mesh) {
    if (mesh) {
      this.scene.remove(mesh);
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        mesh.material.dispose();
      }
    }
  }

  rotate() {
    // Increment orientation (wrap around 0-3)
    this.orientation = (this.orientation + 1) % 4;

    // Store current position to restore later
    const previousPosition = this.currentPosition;
    const previousIsValid = this.isValid;

    // Remove old meshes from scene and dispose
    this.disposeMesh(this.previewMesh);
    this.disposeMesh(this.outlineMesh);
    this.previewMesh = null;
    this.outlineMesh = null;

    // Recreate meshes with new dimensions
    this.createMeshes();

    // Apply rotation to the new meshes
    this.applyRotation();

    // Restore position if there was one
    if (previousPosition) {
      this.updatePosition(previousPosition, previousIsValid);
    }
  }

  /**
   * Clean up all Three.js resources and reset state
   * Called when canceling build mode or after placing a building
   */
  destroy() {
    // Remove meshes from scene and dispose of geometry/materials
    this.disposeMesh(this.previewMesh);
    this.disposeMesh(this.outlineMesh);

    // Clear mesh references
    this.previewMesh = null;
    this.outlineMesh = null;

    // Reset state properties
    this.orientation = 0;
    this.currentPosition = null;
    this.isValid = false;
  }
}