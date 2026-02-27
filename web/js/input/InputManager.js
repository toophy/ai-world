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
      keyDown: this.handleKeyDown.bind(this),
      wheel: this._handleWheel.bind(this)
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

    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', this._boundHandlers.wheel, { passive: false });
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

      // Update highlights based on what was clicked
      this._updateHighlights(clickedEntity, e);

      const targetEntity = clickedEntity?.entity || clickedEntity;
      this.modeHandler.handleInteraction(selectedTiles, targetEntity);
    }
  }

  _handleWheel(e) {
    e.preventDefault();

    const zoomStep = 1.5;
    const direction = e.deltaY > 0 ? 1 : -1;
    const offset = this.camera.position.clone();
    const distance = offset.length();
    const nextDistance = Math.min(90, Math.max(16, distance + direction * zoomStep));

    if (distance > 0.001) {
      offset.normalize().multiplyScalar(nextDistance);
      this.camera.position.copy(offset);
      this.camera.lookAt(0, 0, 0);
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
   * Get world position from pointer event using raycasting
   * @param {PointerEvent} e - The pointer event
   * @returns {THREE.Vector3|null} World position or null if raycast failed
   */
  _getWorldPosition(e) {
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      ),
      this.camera
    );

    const point = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, point)) {
      return point;
    }
    return null;
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
      this.uiManager?.showNotification?.('当前位置无法建造，请移动到绿色预览区域', 'warning');
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

    // Check resources first
    const resources = config.resources || {};
    const resourceCheck = this._checkResources(resources);
    if (!resourceCheck.ok) {
      this.uiManager?.showNotification?.(resourceCheck.message, 'warning');
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
      const reason = this._translatePlacementReason(validationResult);
      console.warn('Placement validation failed:', reason);
      this.uiManager?.showNotification?.(`建造失败: ${reason}`, 'warning');
      return false;
    }

    this._deductResources(resources);

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
   * Check if required resources are available
   */

  _translatePlacementReason(validationResult) {
    const reason = validationResult?.reason;
    const map = {
      out_of_bounds: '超出地图边界',
      building_overlap: '与现有建筑重叠',
      task_overlap: '与已有任务冲突',
      requires_indoors: '需要靠近墙体（室内）',
      invalid_terrain: '地形不满足建造要求',
      unknown_building_type: '未知建筑类型',
      needs_neighbors: `需要更多相邻建筑（至少 ${validationResult?.required ?? 0}）`,
    };
    return map[reason] || reason || '无法在该位置建造';
  }

  _checkResources(resources) {
    for (const [resource, amount] of Object.entries(resources)) {
      const have = this.state.resources[resource] || 0;
      if (have < amount) {
        console.warn(`Insufficient ${resource}: need ${amount}, have ${have}`);
        return { ok: false, message: `资源不足: ${resource} 需要 ${amount}，当前 ${have}` };
      }
    }

    return { ok: true, message: '' };
  }

  _deductResources(resources) {
    for (const [resource, amount] of Object.entries(resources)) {
      this.state.resources[resource] = (this.state.resources[resource] || 0) - amount;
    }
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
    // Use ray.intersectPlane() since groundPlane is a THREE.Plane (mathematical plane), not an Object3D
    const point = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, point)) {
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
    this.canvas.removeEventListener('wheel', this._boundHandlers.wheel);

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
      const pawn = this.state.pawns.find(p => p.mesh === mesh);
      return pawn ? { kind: 'pawn', entity: pawn, object: mesh } : null;
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
        const building = this.state.buildings.find(b => b.mesh === mesh);
        return building ? { kind: 'building', entity: building, object: mesh } : null;
      }
    }

    const oreMeshes = this.state.ores?.filter(o => o.mesh).map(o => o.mesh) || [];
    const oreIntersects = this.raycaster.intersectObjects(oreMeshes);
    if (oreIntersects.length > 0) {
      const mesh = oreIntersects[0].object;
      const ore = this.state.ores.find(o => o.mesh === mesh);
      return ore ? { kind: 'ore', entity: { ...ore, entityType: 'ore', type: 'ore' }, object: mesh } : null;
    }

    const berryMeshes = this.state.berryBushes?.filter(b => b.mesh).map(b => b.mesh) || [];
    const berryIntersects = this.raycaster.intersectObjects(berryMeshes);
    if (berryIntersects.length > 0) {
      const mesh = berryIntersects[0].object;
      const bush = this.state.berryBushes.find(b => b.mesh === mesh);
      return bush ? { kind: 'berry_bush', entity: { ...bush, entityType: 'berry_bush', type: 'berry_bush' }, object: mesh } : null;
    }

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

  /**
   * Update tile and entity highlights based on click
   * @param {Object} clickedEntity - The entity that was clicked, if any
   * @param {PointerEvent} e - The pointer event
   */
  _updateHighlights(clickedEntity, e) {
    if (!this.state.tileHighlight || !this.state.entityHighlight) {
      return;
    }

    if (clickedEntity && clickedEntity.entity) {
      // An entity was clicked - show entity highlight
      const entity = clickedEntity.entity;
      const entityMesh = clickedEntity.object;

      // Clear tile highlight
      this.state.tileHighlight.hide();

      // Show entity highlight
      this.state.entityHighlight.show(entity, entityMesh);
    } else {
      // No entity was clicked - show tile highlight at click position
      this.state.entityHighlight.clear();

      const worldPos = this._getWorldPosition(e);
      if (worldPos) {
        const gridPos = worldToGrid(worldPos.x, worldPos.z);
        this.state.tileHighlight.show(gridPos, 'select');
      } else {
        this.state.tileHighlight.hide();
      }
    }
  }
}
