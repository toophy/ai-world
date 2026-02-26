import * as THREE from "three";

export class GameCursor {
  constructor(scene) {
    this.scene = scene;
    this.currentCursor = 'default';

    // Cursor mesh - will be created when needed
    this.cursorMesh = null;
    this.hideTimer = null;

    // Cursor types with their visual properties
    this.cursorTypes = {
      default: { visible: false },
      build: { visible: true, color: 0xffff00, size: 8 },  // Yellow crosshair
      select: { visible: true, color: 0x00ff00, size: 6 }, // Green circle
      demolish: { visible: true, color: 0xff0000, size: 8 }, // Red X
      inspect: { visible: true, color: 0x00ffff, size: 5 }, // Cyan target
    };
  }

  setCursor(type) {
    if (this.currentCursor === type) return;

    this.currentCursor = type;
    this.updateCursorMesh();
  }

  updatePosition(worldPos) {
    if (!this.cursorMesh || !worldPos) return;

    this.cursorMesh.position.set(worldPos.x, 2, worldPos.z); // Float above ground

    // Auto-hide cursor after inactivity
    clearTimeout(this.hideTimer);
    this.showCursor();
  }

  updateCursorMesh() {
    const config = this.cursorTypes[this.currentCursor] || this.cursorTypes.default;

    // Remove existing cursor mesh
    this.removeCursorMesh();

    if (config.visible) {
      this.createCursorMesh(config);
    }
  }

  createCursorMesh(config) {
    const group = new THREE.Group();

    switch (this.currentCursor) {
      case 'build':
        // Create crosshair for build mode
        this.createCrosshair(group, config.color, config.size);
        break;
      case 'select':
        // Create circle for select mode
        this.createCircle(group, config.color, config.size);
        break;
      case 'demolish':
        // Create X for demolish mode
        this.createXCursor(group, config.color, config.size);
        break;
      case 'inspect':
        // Create target for inspect mode
        this.createTarget(group, config.color, config.size);
        break;
    }

    this.scene.add(group);
    this.cursorMesh = group;
    this.showCursor();
  }

  createCrosshair(group, color, size) {
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      depthTest: false
    });

    const halfSize = size / 2;

    // Horizontal line
    const hGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-halfSize, 0, 0),
      new THREE.Vector3(halfSize, 0, 0)
    ]);
    const hLine = new THREE.Line(hGeom, material);
    group.add(hLine);

    // Vertical line
    const vGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -halfSize),
      new THREE.Vector3(0, 0, halfSize)
    ]);
    const vLine = new THREE.Line(vGeom, material);
    group.add(vLine);
  }

  createCircle(group, color, size) {
    const geometry = new THREE.RingGeometry(size - 1, size, 32);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const circle = new THREE.Mesh(geometry, material);
    circle.rotation.x = -Math.PI / 2;
    group.add(circle);
  }

  createXCursor(group, color, size) {
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      depthTest: false
    });

    const halfSize = size / 2;

    // Diagonal 1
    const d1Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-halfSize, 0, -halfSize),
      new THREE.Vector3(halfSize, 0, halfSize)
    ]);
    const d1 = new THREE.Line(d1Geom, material);
    group.add(d1);

    // Diagonal 2
    const d2Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-halfSize, 0, halfSize),
      new THREE.Vector3(halfSize, 0, -halfSize)
    ]);
    const d2 = new THREE.Line(d2Geom, material);
    group.add(d2);
  }

  createTarget(group, color, size) {
    // Outer circle
    const outerGeom = new THREE.RingGeometry(size - 0.5, size, 32);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const outer = new THREE.Mesh(outerGeom, material);
    outer.rotation.x = -Math.PI / 2;
    group.add(outer);

    // Center dot
    const dotGeom = new THREE.CircleGeometry(size / 4, 16);
    const dot = new THREE.Mesh(dotGeom, material);
    dot.rotation.x = -Math.PI / 2;
    group.add(dot);
  }

  showCursor() {
    if (this.cursorMesh) {
      this.cursorMesh.visible = true;

      // Auto-hide after 3 seconds of inactivity
      clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => {
        if (this.cursorMesh) {
          this.cursorMesh.visible = false;
        }
      }, 3000);
    }
  }

  hideCursor() {
    if (this.cursorMesh) {
      this.cursorMesh.visible = false;
    }
  }

  removeCursorMesh() {
    if (this.cursorMesh) {
      this.scene.remove(this.cursorMesh);

      // Dispose of all geometries and materials
      this.cursorMesh.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });

      this.cursorMesh = null;
    }
  }

  dispose() {
    clearTimeout(this.hideTimer);
    this.removeCursorMesh();
  }
}
