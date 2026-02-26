import * as THREE from "three";
import { SelectionHandler } from './SelectionHandler.js';
import { ModeHandler } from './ModeHandler.js';

export class InputManager {
  constructor(canvas, camera, raycaster, groundPlane, state, taskSystem, pathSystem, uiManager) {
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

    this.selectionHandler = new SelectionHandler(camera, raycaster, groundPlane);
    this.modeHandler = new ModeHandler(state, taskSystem, pathSystem);

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
    } else if (e.button === 2) { // Right click - cancel tasks
      this.handleRightClick(e);
    }
  }

  _handlePointerMove(e) {
    this.selectionHandler.onMove({ x: e.clientX, y: e.clientY });
  }

  _handlePointerUp(e) {
    if (e.button === 0) {
      const selectedTiles = this.selectionHandler.onEnd();
      const clickedEntity = this.getClickedEntity(e);
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

    // Escape - cancel current mode
    if (e.key === 'Escape') {
      this.modeHandler.setMode('inspect');
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

    // TODO: Check other entities (ores, berry bushes, buildings)

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
}
