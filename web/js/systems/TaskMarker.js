import * as THREE from "three";
import { TILE_SIZE, HALF } from '../config.js';

export class TaskMarker {
  constructor(scene, taskSystem) {
    this.scene = scene;
    this.taskSystem = taskSystem;
    this.markers = new Map(); // taskId -> mesh
  }

  update() {
    // Update existing markers and remove completed tasks
    for (const task of this.taskSystem.tasks) {
      if (task.status === 'completed' || task.status === 'cancelled') {
        this.removeMarker(task.id);
        continue;
      }

      if (!this.markers.has(task.id)) {
        this.createMarker(task);
      } else {
        this.updateMarker(task);
      }
    }
  }

  createMarker(task) {
    const geometry = new THREE.RingGeometry(0.3, 0.5, 16);
    const material = new THREE.MeshBasicMaterial({
      color: this.getTaskColor(task.type),
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (task.x - HALF) * TILE_SIZE + TILE_SIZE * 0.5,
      0.15,
      (task.z - HALF) * TILE_SIZE + TILE_SIZE * 0.5
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 100; // Render on top

    this.scene.add(mesh);
    this.markers.set(task.id, mesh);
  }

  updateMarker(task) {
    const mesh = this.markers.get(task.id);
    if (!mesh) return;

    // Update opacity based on progress
    const progress = task.progress || 0;
    mesh.material.opacity = 0.7 * (1 - progress / 100);

    // Change geometry based on status
    const isAssigned = task.status === 'assigned' || task.status === 'in_progress';
    const currentGeometry = mesh.geometry;

    if (isAssigned && currentGeometry.type !== 'CircleGeometry') {
      mesh.geometry.dispose();
      mesh.geometry = new THREE.CircleGeometry(0.4, 16);
    } else if (!isAssigned && currentGeometry.type !== 'RingGeometry') {
      mesh.geometry.dispose();
      mesh.geometry = new THREE.RingGeometry(0.3, 0.5, 16);
    }
  }

  removeMarker(taskId) {
    const mesh = this.markers.get(taskId);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      this.markers.delete(taskId);
    }
  }

  getTaskColor(type) {
    const colors = {
      build_wall: 0x8b7355,
      build_door: 0x6b8e23,
      build_bed: 0xdeb887,
      build_storage: 0x654321,
      build_workbench: 0xcd853f,
      mine_ore: 0x7ec4ff,
      harvest_berry: 0x4ea43f,
      plant_berry: 0x90EE90,
      haul: 0xffa500,
      sleep: 0x9370db,
    };
    return colors[type] || 0xffffff;
  }

  cleanup() {
    for (const [taskId, mesh] of this.markers) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.markers.clear();
  }
}
