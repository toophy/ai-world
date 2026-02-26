import * as THREE from "three";

export class EntityHighlight {
  constructor(scene) {
    this.scene = scene;
    this.highlightMesh = null;
    this.currentEntity = null;

    // Follow update reference
    this.updateCallback = null;
  }

  /**
   * Show highlight around an entity
   * @param {Object} entity - The entity to highlight (Pawn, Building, etc.)
   * @param {THREE.Object3D} entityMesh - The mesh of the entity
   */
  show(entity, entityMesh) {
    this.clear();

    if (!entity || !entityMesh) {
      return;
    }

    this.currentEntity = entity;

    // Create bracket-style highlight around the entity
    this.highlightMesh = this.createBracketHighlight(entityMesh);
    this.scene.add(this.highlightMesh);

    // Set up position follow
    this.setupFollow(entity, entityMesh);
  }

  createBracketHighlight(entityMesh) {
    const group = new THREE.Group();
    const box = new THREE.Box3().setFromObject(entityMesh);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Slightly larger than the entity
    const padding = 0.3;
    const width = size.x + padding;
    const height = size.y + padding;
    const depth = size.z + padding;

    const color = 0x00ff00; // Green for selected
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
    });

    // Create 4 corner posts at the bottom
    const postHeight = 2;
    const postPositions = [
      { x: -width/2, z: -depth/2 },
      { x: width/2, z: -depth/2 },
      { x: width/2, z: depth/2 },
      { x: -width/2, z: depth/2 },
    ];

    postPositions.forEach((pos, index) => {
      // Vertical line
      const vPoints = [
        new THREE.Vector3(pos.x, 0, pos.z),
        new THREE.Vector3(pos.x, postHeight, pos.z),
      ];
      const vGeom = new THREE.BufferGeometry().setFromPoints(vPoints);
      const vLine = new THREE.Line(vGeom, material);
      group.add(vLine);

      // Top bracket (L-shape at top of post)
      const tPoints = [
        new THREE.Vector3(pos.x, postHeight, pos.z),
        new THREE.Vector3(pos.x * 0.7, postHeight, pos.z),  // Toward center
        new THREE.Vector3(pos.x * 0.7, postHeight, pos.z * 0.7), // Turn
      ];

      // Adjust for corners
      if (index === 0) { // Top-left
        tPoints[1].set(-width/2 * 0.3, postHeight, pos.z);
        tPoints[2].set(-width/2 * 0.3, postHeight, -depth/2 * 0.3);
      } else if (index === 1) { // Top-right
        tPoints[1].set(width/2 * 0.3, postHeight, pos.z);
        tPoints[2].set(width/2 * 0.3, postHeight, -depth/2 * 0.3);
      } else if (index === 2) { // Bottom-right
        tPoints[1].set(width/2 * 0.3, postHeight, pos.z);
        tPoints[2].set(width/2 * 0.3, postHeight, depth/2 * 0.3);
      } else if (index === 3) { // Bottom-left
        tPoints[1].set(-width/2 * 0.3, postHeight, pos.z);
        tPoints[2].set(-width/2 * 0.3, postHeight, depth/2 * 0.3);
      }

      const tGeom = new THREE.BufferGeometry().setFromPoints(tPoints);
      const tLine = new THREE.Line(tGeom, material);
      group.add(tLine);
    });

    group.renderOrder = 100;
    return group;
  }

  setupFollow(entity, entityMesh) {
    // Store reference for position updates
    this._followMesh = entityMesh;
    this._entityBaseY = entityMesh.position.y;

    // Create update callback
    this.updateCallback = () => {
      if (this.highlightMesh && this._followMesh) {
        this.highlightMesh.position.copy(this._followMesh.position);
        this.highlightMesh.position.y = this._entityBaseY;
      }
    };
  }

  update() {
    if (this.updateCallback) {
      this.updateCallback();
    }
  }

  /**
   * Update highlight color
   * @param {number} color - Hex color value
   */
  setColor(color) {
    if (this.highlightMesh) {
      this.highlightMesh.traverse(child => {
        if (child.isLine && child.material) {
          child.material.color.setHex(color);
        }
      });
    }
  }

  clear() {
    if (this.highlightMesh) {
      this.scene.remove(this.highlightMesh);

      // Dispose resources
      this.highlightMesh.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });

      this.highlightMesh = null;
    }

    this.currentEntity = null;
    this._followMesh = null;
    this.updateCallback = null;
  }

  dispose() {
    this.clear();
  }
}
