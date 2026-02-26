import * as THREE from "three";
import { SelectionHandler } from './SelectionHandler.js';
import { ModeHandler } from './ModeHandler.js';
import { BuildingPreview } from '../systems/BuildingPreview.js';
import { PlacementValidator } from '../systems/PlacementValidator.js';
import { Building } from '../entities/Building.js';
import { Task } from '../entities/Task.js';
import { worldToGrid } from '../utils/geometry.js';

export class InputManager {
  constructor(canvas, camera, raycaster, groundPlane, state, taskSystem, pathSystem, uiManager, scene) {
    // Validate required parameters
    if (!canvas || !camera || !raycaster || !groundPlane || !state) {
      throw new Error('InputManager requires canvas, camera, raycaster, groundPlane, and state');
    }

    this.canvas = canvas;
    this.camera = camera;
    this.raycaster = raycaster;
    this.groundPlane = groundPlane;
    this.state = state;
    this.uiManager = uiManager;
    this.scene = scene;

    this.selectionHandler = new SelectionHandler(camera, raycaster, groundPlane);
    // Pass inputManager reference to ModeHandler so it can control building preview
    this.modeHandler = new ModeHandler(state, taskSystem, pathSystem, this);

    // Building preview system
    this.buildingPreview = null;

    // Store handler references for cleanup
    this._boundHandlers = {
      pointerDown: this._handlePointerDown.bind(this),
      pointerMove: this._handlePointerMove.bind(this),
      pointerUp: this._handlePointerUp.bind(this),
      contextMenu: this._handleContextMenu.bind(this),
      keyDown: this.handleKeyDown.bind(this)
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse down - start box selection
    this.canvas.addEventListener('pointerdown', this._boundHandlers.pointerDown);

    // Mouse move - update selection
    this.canvas.addEventListener('pointermove', this._boundHandlers.pointerMove);

    // Mouse up - complete selection
    this.canvas.addEventListener('pointerup', this._boundHandlers.pointerUp);

    // Disable context menu
    this.canvas.addEventListener('contextmenu', this._boundHandlers.contextMenu);

    // Keyboard shortcuts
    window.addEventListener('keydown', this._boundHandlers.keyDown);
  }

  _handlePointerDown(e) {
    if (e.button === 0) { // Left click
      this.selectionHandler.onStart({ x: e.clientX, y: e.clientY });
    } else if (e.button === 2) { // Right click
      // Check if we're in build mode with an active preview
      if (this.buildingPreview && this.modeHandler?.currentMode === 'build') {
        // Rotate the building preview
        this.buildingPreview.rotate();
        return; // Prevent other right-click behavior
      }
      // Otherwise, handle normal right-click behavior (cancel tasks)
      this.handleRightClick(e);
    }
  }

  _handlePointerMove(e) {
    this.selectionHandler.onMove({ x: e.clientX, y: e.clientY });

    // Handle building preview update
    if (this.buildingPreview) {
      this._updateBuildingPreview(e);
    }
  }

  _handlePointerUp(e) {
    if (e.button === 0) {
      const selectedTiles = this.selectionHandler.onEnd();
      const clickedEntity = this.getClickedEntity(e);

      // Handle building placement in build mode
      if (this._tryPlaceBuilding()) {
        // Building was placed, don't process normal interaction
        return;
      }

      this.modeHandler.handleInteraction(selectedTiles, clickedEntity);
    }
  }

  _handleContextMenu(e) {
    e.preventDefault();
  }

  handleKeyDown(e) {
    // F - toggle camera follow
    if (e.key === 'f' || e.key === 'F') {
      this.toggleFollowMode();
    }

    // Space - pause
    if (e.key === ' ') {
      e.preventDefault();
      this.togglePause();
    }

    // Keys 1-3 set priority to 3, 6, 9 respectively
    if (e.key >= '1' && e.key <= '3') {
      this.modeHandler.setPriority(parseInt(e.key) * 3);
    }

    // Escape - cancel build mode
    if (e.key === 'Escape' && this.modeHandler?.currentMode === 'build') {
      this.modeHandler.setMode('inspect');
    }

    // R - rotate building preview when in build mode
    if ((e.key === 'r' || e.key === 'R') && this.buildingPreview) {
      this.buildingPreview.rotate();
    }
  }

  /**
   * Attempt to place a building when in build mode
   * @returns {boolean} True if a building was placed, false otherwise
   */
  _tryPlaceBuilding() {
    // Check if we're in build mode with an active preview
    if (!this.buildingPreview || this.modeHandler.currentMode !== 'build') {
      return false;
    }

    // Check if the preview is in a valid position
    if (!this.buildingPreview.isValid || !this.buildingPreview.currentPosition) {
      return false;
    }

    const gridPos = this.buildingPreview.currentPosition;
    const buildingType = this.buildingPreview.buildingType;
    const orientation = this.buildingPreview.orientation;

    // Get building config to check resource requirements
    const config = this.buildingPreview.config;
    if (!config) {
      console.warn('Building config not found for type:', buildingType);
      return false;
    }

    // Check resources and deduct if sufficient
    const resources = config.resources || {};
    if (!this._checkAndDeductResources(resources)) {
      return false;
    }

    // Validate placement (PlacementValidator already checks task overlap)
    const validationResult = PlacementValidator.validate(
      gridPos,
      buildingType,
      orientation,
      this.state
    );

    if (!validationResult.valid) {
      console.warn('Placement validation failed:', validationResult.reason);
      // TODO: Implement transaction/rollback mechanism to revert resource deduction
      // when placement fails after resource check. For now, resources remain deducted.
      return false;
    }

    // TODO: Consider implementing a transactional system where resources are only
    // committed after all validation passes. This would prevent resource loss if
    // later steps fail (e.g., building creation or task assignment errors).

    // Create the Building instance
    const building = new Building(buildingType, gridPos.x, gridPos.z, orientation);
    this.state.buildings = this.state.buildings || [];
    this.state.buildings.push(building);

    // Add building to renderer if available
    if (this.state.buildingRenderer) {
      this.state.buildingRenderer.addBuilding(building);
    }

    // Create a build task for the building
    const task = new Task(`build_${buildingType}`, gridPos.x, gridPos.z, {
      priority: this.modeHandler.priorityLevel,
      buildingType: buildingType,
      resources: { ...resources },
    });

    // Link the task to the building
    task.buildingId = building.id;
    building.taskId = task.id;

    // Add task to system
    if (this.state.taskSystem) {
      this.state.taskSystem.addTask(task);
    } else {
      this.state.tasks = this.state.tasks || [];
      this.state.tasks.push(task);
    }

    console.log(`Placed ${buildingType} at (${gridPos.x}, ${gridPos.z})`);

    // Don't end the preview - keep it active for multiple placements
    // This provides better UX for placing multiple buildings of the same type
    return true;
  }

  /**
   * Check if required resources are available and deduct them if so
   * @param {Object} resources - Object mapping resource names to required amounts
   * @returns {boolean} True if resources were sufficient and deducted, false otherwise
   * @private
   */
  _checkAndDeductResources(resources) {
    // First pass: check all resources
    for (const [resource, amount] of Object.entries(resources)) {
      if ((this.state.resources[resource] || 0) < amount) {
        console.warn(`Insufficient ${resource}: need ${amount}, have ${this.state.resources[resource] || 0}`);
        // TODO: Show UI notification for insufficient resources
        return false;
      }
    }

    // Second pass: deduct resources (only if all checks passed)
    for (const [resource, amount] of Object.entries(resources)) {
      this.state.resources[resource] = (this.state.resources[resource] || 0) - amount;
    }

    return true;
  }

  /**
   * Update building preview position and validity based on cursor position
   * @param {PointerEvent} e - The pointer move event
   */
  _updateBuildingPreview(e) {
    if (!this.buildingPreview || !this.groundPlane) {
      return;
    }

    // Set up raycaster from mouse position
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      ),
      this.camera
    );

    // Raycast against ground plane
    const intersects = this.raycaster.intersectObject(this.groundPlane);

    if (intersects.length > 0) {
      const point = intersects[0].point;

      // Convert world position to grid coordinates
      const gridPos = worldToGrid(point.x, point.z);

      // Validate placement using PlacementValidator
      const validationResult = PlacementValidator.validate(
        gridPos,
        this.buildingPreview.buildingType,
        this.buildingPreview.orientation,
        this.state
      );

      // Update preview position and validity state
      this.buildingPreview.updatePosition(gridPos, validationResult.valid);
    } else {
      // No ground intersection - hide preview
      this.buildingPreview.hide();
    }
  }

  dispose() {
    // Remove all event listeners using stored handler references
    this.canvas.removeEventListener('pointerdown', this._boundHandlers.pointerDown);
    this.canvas.removeEventListener('pointermove', this._boundHandlers.pointerMove);
    this.canvas.removeEventListener('pointerup', this._boundHandlers.pointerUp);
    this.canvas.removeEventListener('contextmenu', this._boundHandlers.contextMenu);
    window.removeEventListener('keydown', this._boundHandlers.keyDown);

    // Clean up handlers
    this._boundHandlers = null;

    // Dispose of building preview if active
    this.endBuildingPreview();

    // Dispose of selection handler if it has a dispose method
    if (this.selectionHandler && typeof this.selectionHandler.dispose === 'function') {
      this.selectionHandler.dispose();
    }
    this.selectionHandler = null;
    this.modeHandler = null;
  }

  handleRightClick(event) {
    const tile = this.selectionHandler.getTileAt(event.clientX, event.clientY);
    if (tile) {
      this.modeHandler.handleInteraction([tile], null);
    }
  }

  getClickedEntity(event) {
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      ),
      this.camera
    );

    // Check pawns first
    const pawnMeshes = this.state.pawns.filter(p => p.mesh).map(p => p.mesh);
    const pawnIntersects = this.raycaster.intersectObjects(pawnMeshes);
    if (pawnIntersects.length > 0) {
      const mesh = pawnIntersects[0].object;
      return this.state.pawns.find(p => p.mesh === mesh);
    }

    // Check buildings
    if (this.state.buildingRenderer) {
      const buildingMeshes = [];
      for (const [id, meshes] of this.state.buildingRenderer.buildingMeshes) {
        buildingMeshes.push(meshes.mesh);
      }
      const buildingIntersects = this.raycaster.intersectObjects(buildingMeshes);
      if (buildingIntersects.length > 0) {
        const mesh = buildingIntersects[0].object;
        return this.state.buildings.find(b => b.mesh === mesh);
      }
    }

    // TODO: Check other entities (ores, berry bushes)

    return null;
  }

  setMode(mode, buildingType = null) {
    this.modeHandler.setMode(mode, buildingType);
  }

  toggleFollowMode() {
    // TODO: Implement camera follow
    console.log('Toggle follow mode');
  }

  togglePause() {
    // TODO: Implement pause
    console.log('Toggle pause');
  }

  /**
   * Start building preview for the specified building type
   * @param {string} buildingType - The type of building to preview
   */
  startBuildingPreview(buildingType) {
    if (!this.scene) {
      console.error('Scene not available for building preview');
      return;
    }

    // Clean up any existing preview
    this.endBuildingPreview();

    // Create new preview
    this.buildingPreview = new BuildingPreview(this.scene, buildingType);
    console.log(`Building preview started for: ${buildingType}`);
  }

  /**
   * End the current building preview and clean up resources
   */
  endBuildingPreview() {
    if (this.buildingPreview) {
      this.buildingPreview.destroy();
      this.buildingPreview = null;
      console.log('Building preview ended');
    }
  }
}
