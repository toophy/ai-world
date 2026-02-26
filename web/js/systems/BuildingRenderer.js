import * as THREE from "three";
import { TILE_SIZE } from '../config.js';
import { gridToWorld } from '../utils/geometry.js';

/**
 * BuildingRenderer - Handles visualization of buildings with construction progress
 *
 * Features:
 * - Renders buildings with opacity based on construction progress
 * - Shows green outline during construction
 * - Removes outline and sets full opacity when complete
 * - Updates building visuals in real-time as progress changes
 */
export class BuildingRenderer {
  /**
   * @param {THREE.Scene} scene - The Three.js scene to add building meshes to
   * @param {Array} buildings - Array of Building instances to render
   */
  constructor(scene, buildings = []) {
    this.scene = scene;
    this.buildings = buildings;
    this.buildingMeshes = new Map(); // building.id -> { mesh, outline }
  }

  /**
   * Calculate opacity based on construction progress
   * @param {number} progress - Construction progress (0-100)
   * @returns {number} Opacity value (0.3 to 1.0)
   */
  calculateOpacity(progress) {
    return 0.3 + (progress / 100) * 0.7;
  }

  /**
   * Get the rotated dimensions of the building based on orientation
   * @param {Building} building - The building instance
   * @returns {Object} Object with width and height properties
   */
  getRotatedDimensions(building) {
    return {
      width: building.orientation % 2 === 0 ? building.width : building.height,
      height: building.orientation % 2 === 0 ? building.height : building.width
    };
  }

  /**
   * Create meshes for a building (main mesh + outline)
   * @param {Building} building - The building instance
   * @returns {Object} Object containing mesh and outline mesh
   */
  createBuildingMeshes(building) {
    const { width: w, height: h } = this.getRotatedDimensions(building);

    // Create the main building mesh
    const geometry = new THREE.BoxGeometry(w * TILE_SIZE, 1, h * TILE_SIZE);
    const material = new THREE.MeshStandardMaterial({
      color: building.color,
      transparent: true,
      opacity: this.calculateOpacity(building.progress),
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { kind: "building", entity: building };

    // Create outline using edges
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00, // Green for construction
      transparent: true,
      opacity: 0.8,
    });

    const outline = new THREE.LineSegments(edges, lineMaterial);

    // Calculate position
    const centerX = building.x + (w - 1) / 2;
    const centerZ = building.z + (h - 1) / 2;
    const worldPos = gridToWorld(centerX, centerZ);

    mesh.position.set(worldPos.x, 0.5, worldPos.z);
    outline.position.set(worldPos.x, 0.5, worldPos.z);

    // Apply rotation based on orientation
    const angle = building.orientation * Math.PI / 2;
    mesh.rotation.y = angle;
    outline.rotation.y = angle;

    // Hide outline if building is complete
    if (building.progress >= 100 || building.isComplete) {
      outline.visible = false;
      material.opacity = 1.0;
    }

    return { mesh, outline };
  }

  /**
   * Add a building to the renderer
   * @param {Building} building - The building instance
   */
  addBuilding(building) {
    if (this.buildingMeshes.has(building.id)) {
      console.warn(`Building ${building.id} already has meshes`);
      return;
    }

    const { mesh, outline } = this.createBuildingMeshes(building);
    this.buildingMeshes.set(building.id, { mesh, outline });

    this.scene.add(mesh);
    this.scene.add(outline);

    // Add mesh reference to building for backward compatibility
    building.mesh = mesh;
  }

  /**
   * Remove a building from the renderer
   * @param {Building} building - The building instance
   */
  removeBuilding(building) {
    const meshes = this.buildingMeshes.get(building.id);
    if (!meshes) return;

    this.scene.remove(meshes.mesh);
    this.scene.remove(meshes.outline);

    // Dispose geometry and materials
    if (meshes.mesh.geometry) meshes.mesh.geometry.dispose();
    if (meshes.mesh.material) meshes.mesh.material.dispose();
    if (meshes.outline.geometry) meshes.outline.geometry.dispose();
    if (meshes.outline.material) meshes.outline.material.dispose();

    this.buildingMeshes.delete(building.id);
    if (building.mesh === meshes.mesh) {
      building.mesh = null;
    }
  }

  /**
   * Update a building's visual appearance based on current progress
   * @param {Building} building - The building instance
   */
  updateBuilding(building) {
    const meshes = this.buildingMeshes.get(building.id);
    if (!meshes) return;

    const { mesh, outline } = meshes;
    const isComplete = building.progress >= 100 || building.isComplete;

    // Update opacity based on progress
    mesh.material.opacity = this.calculateOpacity(building.progress);

    // Show/hide outline based on completion
    if (isComplete) {
      outline.visible = false;
      mesh.material.opacity = 1.0;
    } else {
      outline.visible = true;
    }
  }

  /**
   * Update all buildings' visual appearances
   * Call this each frame to keep visuals in sync with building state
   */
  updateAll() {
    for (const building of this.buildings) {
      this.updateBuilding(building);
    }
  }

  /**
   * Update the buildings array and sync meshes
   * @param {Array} buildings - New array of Building instances
   */
  setBuildings(buildings) {
    // Remove meshes for buildings that are no longer in the array
    for (const [id, meshes] of this.buildingMeshes) {
      if (!buildings.find(b => b.id === id)) {
        this.scene.remove(meshes.mesh);
        this.scene.remove(meshes.outline);

        if (meshes.mesh.geometry) meshes.mesh.geometry.dispose();
        if (meshes.mesh.material) meshes.mesh.material.dispose();
        if (meshes.outline.geometry) meshes.outline.geometry.dispose();
        if (meshes.outline.material) meshes.outline.material.dispose();
      }
    }

    // Clear and rebuild the map
    this.buildingMeshes.clear();
    this.buildings = buildings;

    // Add meshes for all buildings
    for (const building of this.buildings) {
      if (!this.buildingMeshes.has(building.id)) {
        this.addBuilding(building);
      }
    }
  }

  /**
   * Clean up all resources
   */
  dispose() {
    for (const [id, meshes] of this.buildingMeshes) {
      this.scene.remove(meshes.mesh);
      this.scene.remove(meshes.outline);

      if (meshes.mesh.geometry) meshes.mesh.geometry.dispose();
      if (meshes.mesh.material) meshes.mesh.material.dispose();
      if (meshes.outline.geometry) meshes.outline.geometry.dispose();
      if (meshes.outline.material) meshes.outline.material.dispose();
    }

    this.buildingMeshes.clear();
  }
}
