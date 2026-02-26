import * as THREE from "three";
import { TILE_SIZE, MAP_SIZE, HALF } from '../config.js';

// Convert grid coordinates to world coordinates (returns THREE.Vector3)
export function gridToWorld(gx, gz) {
  return new THREE.Vector3((gx - HALF) * TILE_SIZE + TILE_SIZE * 0.5, 0, (gz - HALF) * TILE_SIZE + TILE_SIZE * 0.5);
}

// Convert world coordinates to grid coordinates
export function worldToGrid(wx, wz) {
  // Handle undefined input (can happen when raycast fails)
  if (wx === undefined || wx === null) {
    console.warn('worldToGrid called with undefined wx');
    return { x: 0, z: 0 };
  }

  // Handle both Vector3 and individual coordinates
  const x = wx.x !== undefined ? wx.x : wx;
  // Check if wz is provided (Vector3 mode) or use wx.z (single object mode)
  const zValue = (wz !== undefined && wz.z !== undefined) ? wz.z : (wx.z !== undefined ? wx.z : wz);
  const z = zValue;

  return {
    x: Math.floor(x / TILE_SIZE + HALF),
    z: Math.floor(z / TILE_SIZE + HALF)
  };
}

// Check if grid position is valid (alias for inBounds)
export function isValidGrid(x, z) {
  return x >= 0 && x < MAP_SIZE && z >= 0 && z < MAP_SIZE;
}

// Check if grid position is valid (original name for backward compatibility)
export function inBounds(x, z) {
  return x >= 0 && x < MAP_SIZE && z >= 0 && z < MAP_SIZE;
}

// Calculate Manhattan distance between two grid positions
export function gridDistance(x1, z1, x2, z2) {
  return Math.abs(x1 - x2) + Math.abs(z1 - z2);
}

// Convert color number to CSS hex string
export function colorToHex(colorNumber) {
  return '#' + colorNumber.toString(16).padStart(6, '0');
}
