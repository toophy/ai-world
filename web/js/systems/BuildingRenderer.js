import * as THREE from "three";
import { TILE_SIZE } from '../config.js';
import { gridToWorld } from '../utils/geometry.js';

// Constants for building visualization
const MIN_OPACITY = 0.3;
const OPACITY_RANGE = 0.7;
const OUTLINE_OPACITY = 0.8;
const CONSTRUCTION_COMPLETE_PROGRESS = 100;
const FULL_OPACITY = 1.0;
const MESH_HEIGHT = 0.5;
const OUTLINE_COLOR = 0x00ff00; // Green for construction
// Red indicates destruction/destruction-in-progress (universal warning color)
const DEMOLISH_OUTLINE_COLOR = 0xff0000; // Red for demolition

// Flash effect constants
const FLASH_DURATION = 150; // ms
const FLASH_EMISSIVE_COLOR_CONSTRUCTION = new THREE.Color(0xffff00); // Yellow for construction
const FLASH_EMISSIVE_COLOR_DEMOLITION = new THREE.Color(0xff4444); // Red for demolition

/**
 * BuildingRenderer - Handles visualization of buildings with construction progress
 *
 * Features:
 * - Renders buildings with opacity based on construction progress
 * - Shows green outline during construction
 * - Removes outline and sets full opacity when complete
 * - Updates building visuals in real-time as progress changes
 *
 * TODO (performance): Consider adding dirty flags to avoid updating all buildings every frame
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
    this.activeFlashes = new Map(); // building.id -> { endTime: number, originalEmissive: Color }
  }

  /**
   * Calculate opacity based on construction progress
   * @param {number} progress - Construction progress (0-100)
   * @returns {number} Opacity value (MIN_OPACITY to FULL_OPACITY)
   */
  calculateOpacity(progress) {
    return MIN_OPACITY + (progress / CONSTRUCTION_COMPLETE_PROGRESS) * OPACITY_RANGE;
  }

  /**
   * Trigger a flash effect on a building
   * @param {string} buildingId - The ID of the building to flash
   * @param {boolean} isDemolition - True if this is a demolition completion flash
   */
  flashBuilding(buildingId, isDemolition = false) {
    const meshes = this.buildingMeshes.get(buildingId);
    if (!meshes) return;

    const { mesh } = meshes;
    const flashColor = isDemolition ? FLASH_EMISSIVE_COLOR_DEMOLITION : FLASH_EMISSIVE_COLOR_CONSTRUCTION;

    // Store original emissive if not already flashing
    if (!this.activeFlashes.has(buildingId)) {
      this.activeFlashes.set(buildingId, {
        endTime: Date.now() + FLASH_DURATION,
        originalEmissive: mesh.material.emissive ? mesh.material.emissive.clone() : new THREE.Color(0x000000),
        flashColor: flashColor
      });

      // Apply flash
      mesh.material.emissive = flashColor.clone();
      mesh.material.emissiveIntensity = 1.0;
    }
  }

  /**
   * Update flash effects (call this every frame)
   */
  updateFlashes() {
    const now = Date.now();
    const expiredFlashes = [];

    for (const [buildingId, flash] of this.activeFlashes) {
      if (now >= flash.endTime) {
        // Flash expired, restore original
        const meshes = this.buildingMeshes.get(buildingId);
        if (meshes && meshes.mesh) {
          meshes.mesh.material.emissive = flash.originalEmissive;
          meshes.mesh.material.emissiveIntensity = 0;
        }
        expiredFlashes.push(buildingId);
      } else {
        // Fade out the flash over time
        const elapsed = now - (flash.endTime - FLASH_DURATION);
        const progress = elapsed / FLASH_DURATION;
        const intensity = 1 - progress;

        const meshes = this.buildingMeshes.get(buildingId);
        if (meshes && meshes.mesh) {
          meshes.mesh.material.emissiveIntensity = intensity;
        }
      }
    }

    // Remove expired flashes
    for (const buildingId of expiredFlashes) {
      this.activeFlashes.delete(buildingId);
    }
  }

  /**
   * Properly dispose of mesh geometry and materials
   * @param {Object} meshes - Object containing mesh and outline properties
   * @private
   */
  _disposeMeshes(meshes) {
    this.scene.remove(meshes.mesh);
    this.scene.remove(meshes.outline);

    if (meshes.mesh.geometry) meshes.mesh.geometry.dispose();
    if (meshes.mesh.material) meshes.mesh.material.dispose();
    if (meshes.outline.geometry) meshes.outline.geometry.dispose();
    if (meshes.outline.material) meshes.outline.material.dispose();
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
    // Use red outline for demolishing buildings
    const outlineColor = building.state === 'demolishing' ? DEMOLISH_OUTLINE_COLOR : OUTLINE_COLOR;
    const lineMaterial = new THREE.LineBasicMaterial({
      color: outlineColor,
      transparent: true,
      opacity: OUTLINE_OPACITY,
    });

    const outline = new THREE.LineSegments(edges, lineMaterial);

    // Calculate position
    const centerX = building.x + (w - 1) / 2;
    const centerZ = building.z + (h - 1) / 2;
    const worldPos = gridToWorld(centerX, centerZ);

    mesh.position.set(worldPos.x, MESH_HEIGHT, worldPos.z);
    outline.position.set(worldPos.x, MESH_HEIGHT, worldPos.z);

    // Apply rotation based on orientation
    const angle = building.orientation * Math.PI / 2;
    mesh.rotation.y = angle;
    outline.rotation.y = angle;

    // Hide outline if building is complete
    if (building.progress >= CONSTRUCTION_COMPLETE_PROGRESS || building.isComplete) {
      outline.visible = false;
      material.opacity = FULL_OPACITY;
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

    this._disposeMeshes(meshes);
    this.buildingMeshes.delete(building.id);
    this.activeFlashes.delete(building.id);

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
    const isComplete = building.progress >= CONSTRUCTION_COMPLETE_PROGRESS || building.isComplete;
    const isDemolishing = building.state === 'demolishing';

    // Update opacity based on progress (show demolition progress too)
    if (isDemolishing) {
      // For demolition, opacity decreases as progress goes from 100 to 0
      mesh.material.opacity = this.calculateOpacity(building.progress);
    } else if (!isComplete) {
      mesh.material.opacity = this.calculateOpacity(building.progress);
    } else {
      mesh.material.opacity = FULL_OPACITY;
    }

    // Show outline during construction or demolition
    outline.visible = !isComplete || isDemolishing;

    // Update outline color for demolishing buildings
    if (isDemolishing) {
      outline.material.color.setHex(DEMOLISH_OUTLINE_COLOR);
    } else {
      outline.material.color.setHex(OUTLINE_COLOR);
    }
  }

  /**
   * Update all buildings' visual appearances
   * Call this each frame to keep visuals in sync with building state
   *
   * TODO (performance): Consider using dirty flags to only update buildings
   * whose state has actually changed since the last frame.
   */
  updateAll() {
    for (const building of this.buildings) {
      this.updateBuilding(building);
    }
    // Update flash effects
    this.updateFlashes();
  }

  /**
   * Update the buildings array and sync meshes
   * @param {Array} buildings - New array of Building instances
   *
   * TODO (performance): This rebuilds all meshes on every call. For large numbers
   * of buildings, consider incremental updates that only add/remove changed buildings.
   */
  setBuildings(buildings) {
    // Remove meshes for buildings that are no longer in the array
    for (const [id, meshes] of this.buildingMeshes) {
      if (!buildings.find(b => b.id === id)) {
        this._disposeMeshes(meshes);
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
      this._disposeMeshes(meshes);
    }

    this.buildingMeshes.clear();
    this.activeFlashes.clear();
  }
}
