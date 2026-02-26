import * as THREE from "three";
import { TILE_SIZE, HALF } from '../config.js';
import { gridToWorld } from '../utils/geometry.js';

export class TileHighlight {
  constructor(scene) {
    this.scene = scene;
    this.highlightMesh = null;
    this.currentPosition = null;

    // Create corner meshes for selection highlight (RimWorld style - 4 corners)
    this.createCornerHighlight();
  }

  createCornerHighlight() {
    const group = new THREE.Group();

    // Create a rectangle outline that matches the tile size (TILE_SIZE = 2)
    // The border should cover exactly one tile
    const points = [
      new THREE.Vector3(-1, 0, -1),  // Top-left corner
      new THREE.Vector3(1, 0, -1),   // Top-right corner
      new THREE.Vector3(1, 0, 1),    // Bottom-right corner
      new THREE.Vector3(-1, 0, 1),   // Bottom-left corner
      new THREE.Vector3(-1, 0, -1),  // Back to start (close the loop)
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00, // Green for selected
      transparent: true,
      opacity: 0.8,
      depthTest: false,
    });

    const line = new THREE.Line(geometry, material);
    line.position.y = 0.05; // Slightly above ground
    group.add(line);

    this.scene.add(group);
    this.highlightMesh = group;
    this.hide();
  }

  createCorner(size, color, lineWidth) {
    // This method is no longer used, keeping for backwards compatibility
    return new THREE.Group();
  }

  /**
   * Show highlight at the specified grid position
   * @param {Object} gridPos - Grid position {x, z}
   * @param {string} type - Highlight type ('select', 'hover', 'invalid')
   */
  show(gridPos, type = 'select') {
    if (!gridPos) {
      this.hide();
      return;
    }

    this.currentPosition = { ...gridPos };

    // Convert grid to world coordinates
    const worldPos = gridToWorld(gridPos.x, gridPos.z);

    // Update position
    this.highlightMesh.position.set(worldPos.x, 0, worldPos.z);

    // Update color based on type
    const color = this.getColorForType(type);
    this.updateColor(color);

    // Show the highlight
    this.highlightMesh.visible = true;
    this.highlightMesh.renderOrder = 100; // Render on top
  }

  getColorForType(type) {
    const colors = {
      select: 0x00ff00,    // Green - selected
      hover: 0xffff00,     // Yellow - hover
      invalid: 0xff0000,   // Red - invalid placement
      build: 0x00ffff,     // Cyan - build mode
      inspect: 0xffa500,   // Orange - inspect mode
    };
    return colors[type] || colors.select;
  }

  updateColor(color) {
    this.highlightMesh.traverse(child => {
      if (child.isGroup) {
        child.traverse(line => {
          if (line.isLine && line.material) {
            line.material.color.setHex(color);
          }
        });
      }
    });
  }

  hide() {
    if (this.highlightMesh) {
      this.highlightMesh.visible = false;
    }
  }

  /**
   * Update highlight position (for following moving entities)
   * @param {Object} gridPos - New grid position {x, z}
   */
  updatePosition(gridPos) {
    if (!gridPos) {
      this.hide();
      return;
    }

    this.show(gridPos, 'select');
  }

  dispose() {
    if (this.highlightMesh) {
      this.scene.remove(this.highlightMesh);

      // Dispose of all geometries and materials
      this.highlightMesh.traverse(child => {
        if (child.isGroup) {
          child.traverse(line => {
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
          });
        }
      });

      this.highlightMesh = null;
    }
  }
}
