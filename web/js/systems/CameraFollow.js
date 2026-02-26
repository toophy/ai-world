import { gridToWorld } from '../utils/geometry.js';

export class CameraFollow {
  constructor(camera) {
    this.camera = camera;
    this.isFollowing = false;
    this.targetPawn = null;
    this.baseOffset = new THREE.Vector3(0, 42, 34);
    this.smoothness = 0.05;
  }

  toggleFollow(pawn) {
    if (this.isFollowing && this.targetPawn === pawn) {
      this.stopFollow();
      return false;
    } else {
      this.startFollow(pawn);
      return true;
    }
  }

  startFollow(pawn) {
    this.isFollowing = true;
    this.targetPawn = pawn;
    console.log(`Following ${pawn.name}`);
  }

  stopFollow() {
    this.isFollowing = false;
    this.targetPawn = null;
    console.log('Stopped following');
  }

  update(dt) {
    if (!this.isFollowing || !this.targetPawn) return;

    const worldPos = gridToWorld(this.targetPawn.pos.x, this.targetPawn.pos.z);
    const targetPos = new THREE.Vector3(
      worldPos.x + this.baseOffset.x,
      this.baseOffset.y,
      worldPos.z + this.baseOffset.z
    );

    // Smooth camera movement
    this.camera.position.lerp(targetPos, this.smoothness);
    this.camera.lookAt(worldPos.x, 0, worldPos.z);
  }

  setOffset(x, y, z) {
    this.baseOffset.set(x, y, z);
  }

  setSmoothness(value) {
    this.smoothness = Math.max(0.01, Math.min(1, value));
  }
}
