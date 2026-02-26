import { SelectionHandler } from './SelectionHandler.js';
import { ModeHandler } from './ModeHandler.js';

export class InputManager {
  constructor(canvas, camera, raycaster, groundPlane, state, taskSystem, pathSystem, uiManager) {
    this.canvas = canvas;
    this.camera = camera;
    this.raycaster = raycaster;
    this.groundPlane = groundPlane;
    this.state = state;
    this.uiManager = uiManager;

    this.selectionHandler = new SelectionHandler(camera, raycaster, groundPlane);
    this.modeHandler = new ModeHandler(state, taskSystem, pathSystem);

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse down - start box selection
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button === 0) { // Left click
        this.selectionHandler.onStart({ x: e.clientX, y: e.clientY });
      } else if (e.button === 2) { // Right click - cancel tasks
        this.handleRightClick(e);
      }
    });

    // Mouse move - update selection
    this.canvas.addEventListener('pointermove', (e) => {
      this.selectionHandler.onMove({ x: e.clientX, y: e.clientY });
    });

    // Mouse up - complete selection
    this.canvas.addEventListener('pointerup', (e) => {
      if (e.button === 0) {
        const selectedTiles = this.selectionHandler.onEnd();
        const clickedEntity = this.getClickedEntity(e);
        this.modeHandler.handleInteraction(selectedTiles, clickedEntity);
      }
    });

    // Disable context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
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

    // 1-3 - set priority
    if (e.key >= '1' && e.key <= '3') {
      this.modeHandler.setPriority(parseInt(e.key) * 3);
    }

    // Escape - cancel current mode
    if (e.key === 'Escape') {
      this.modeHandler.setMode('inspect');
    }
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
