import { worldToGrid, isValidGrid } from '../utils/geometry.js';

export class SelectionHandler {
  constructor(camera, raycaster, groundPlane) {
    if (!camera || !raycaster || !groundPlane) {
      throw new Error('SelectionHandler requires camera, raycaster, and groundPlane');
    }
    this.camera = camera;
    this.raycaster = raycaster;
    this.groundPlane = groundPlane;
    this.isSelecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.selectionBoxElement = null;
  }

  onStart(screenPos) {
    this.isSelecting = true;
    this.selectionStart = screenPos;
    this.showSelectionBox();
  }

  onMove(screenPos) {
    if (!this.isSelecting) return;
    this.selectionEnd = screenPos;
    this.updateSelectionBox();
  }

  onEnd() {
    this.isSelecting = false;
    const selected = this.calculateSelectedTiles();
    this.hideSelectionBox();
    return selected;
  }

  showSelectionBox() {
    if (this.selectionBoxElement) return;
    const box = document.createElement('div');
    box.className = 'selection-box';
    document.body.appendChild(box);
    this.selectionBoxElement = box;
  }

  updateSelectionBox() {
    if (!this.selectionBoxElement || !this.selectionStart || !this.selectionEnd) return;

    const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
    const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);

    this.selectionBoxElement.style.left = left + 'px';
    this.selectionBoxElement.style.top = top + 'px';
    this.selectionBoxElement.style.width = width + 'px';
    this.selectionBoxElement.style.height = height + 'px';
  }

  hideSelectionBox() {
    if (this.selectionBoxElement) {
      this.selectionBoxElement.remove();
      this.selectionBoxElement = null;
    }
  }

  calculateSelectedTiles() {
    if (!this.selectionStart || !this.selectionEnd) return [];

    const tiles = [];
    const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const right = Math.max(this.selectionStart.x, this.selectionEnd.x);
    const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const bottom = Math.max(this.selectionStart.y, this.selectionEnd.y);

    // Convert screen corners to world coordinates
    const topLeft = this.screenToWorld(left, top);
    const bottomRight = this.screenToWorld(right, bottom);

    if (!topLeft || !bottomRight) return [];

    // Get grid coordinates
    const gridMin = worldToGrid(topLeft.x, topLeft.z);
    const gridMax = worldToGrid(bottomRight.x, bottomRight.z);

    // Generate all tiles in the selection rectangle
    const minX = Math.min(gridMin.x, gridMax.x);
    const maxX = Math.max(gridMin.x, gridMax.x);
    const minZ = Math.min(gridMin.z, gridMax.z);
    const maxZ = Math.max(gridMin.z, gridMax.z);

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        tiles.push({ x, z });
      }
    }

    return tiles.filter(tile => isValidGrid(tile.x, tile.z));
  }

  screenToWorld(screenX, screenY) {
    // Convert to normalized device coordinates (-1 to +1)
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        (screenX / window.innerWidth) * 2 - 1,
        -(screenY / window.innerHeight) * 2 + 1
      ),
      this.camera
    );
    const intersects = this.raycaster.intersectObject(this.groundPlane);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  }

  getTileAt(screenX, screenY) {
    const worldPos = this.screenToWorld(screenX, screenY);
    if (!worldPos) return null;
    return worldToGrid(worldPos.x, worldPos.z);
  }

  dispose() {
    this.hideSelectionBox();
    this.selectionStart = null;
    this.selectionEnd = null;
  }
}
