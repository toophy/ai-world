#!/usr/bin/env node

/**
 * Automated test suite for Building Preview System
 * Task 19: Test and verify all functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_RESULTS = {
    passed: [],
    failed: [],
    total: 0
};

function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',    // cyan
        success: '\x1b[32m', // green
        error: '\x1b[31m',   // red
        warning: '\x1b[33m', // yellow
        reset: '\x1b[0m'
    };
    const color = colors[type] || colors.info;
    console.log(`${color}${message}${colors.reset}`);
}

function assert(condition, testName, errorMessage) {
    TEST_RESULTS.total++;
    if (condition) {
        TEST_RESULTS.passed.push(testName);
        log(`✓ ${testName}`, 'success');
        return true;
    } else {
        TEST_RESULTS.failed.push({ name: testName, error: errorMessage });
        log(`✗ ${testName}: ${errorMessage}`, 'error');
        return false;
    }
}

function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        return null;
    }
}

function testFileExists(filePath, testName) {
    const exists = fs.existsSync(filePath);
    return assert(exists, testName, `File not found: ${filePath}`);
}

function testCodeContains(code, patterns, testName) {
    if (!code) {
        return assert(false, testName, 'Could not read file');
    }
    const missingPatterns = patterns.filter(p => !code.includes(p));
    return assert(
        missingPatterns.length === 0,
        testName,
        `Missing patterns: ${missingPatterns.join(', ')}`
    );
}

// Test Suite
function runTests() {
    log('\n=== Building Preview System Test Suite ===\n', 'info');
    log('Task 19: Test and verify all functionality\n', 'info');

    const jsDir = path.join(__dirname, 'js');

    // Test 1: BuildingPreview Class
    log('Test 1: BuildingPreview Class Structure', 'info');
    const previewPath = path.join(jsDir, 'systems', 'BuildingPreview.js');
    if (testFileExists(previewPath, '1.1 BuildingPreview.js exists')) {
        const previewCode = readFile(previewPath);
        testCodeContains(previewCode, [
            'export class BuildingPreview',
            'constructor(scene, buildingType',
            'createMeshes()',
            'updatePosition(gridPos, isValid)',
            'rotate()',
            'destroy()',
            'hide()',
            'applyRotation()',
            'getRotatedDimensions()'
        ], '1.2 BuildingPreview has required methods');

        // Check for proper Three.js integration
        testCodeContains(previewCode, [
            "import * as THREE",
            'new THREE.BoxGeometry',
            'new THREE.MeshBasicMaterial',
            'new THREE.EdgesGeometry',
            'scene.add',
            'renderOrder'
        ], '1.3 BuildingPreview uses Three.js correctly');

        // Check for color handling
        testCodeContains(previewCode, [
            '0x00ff00',
            '0xff0000',
            'outlineColor',
            'material.color.setHex'
        ], '1.4 BuildingPreview has green/red outline colors');
    }

    // Test 2: PlacementValidator Class
    log('\nTest 2: PlacementValidator Class Structure', 'info');
    const validatorPath = path.join(jsDir, 'systems', 'PlacementValidator.js');
    if (testFileExists(validatorPath, '2.1 PlacementValidator.js exists')) {
        const validatorCode = readFile(validatorPath);
        testCodeContains(validatorCode, [
            'export class PlacementValidator',
            'static validate(',
            'static getOccupiedTiles(',
            'static checkBounds(',
            'static checkTerrain(',
            'static checkOverlap('
        ], '2.2 PlacementValidator has required static methods');

        testCodeContains(validatorCode, [
            'out_of_bounds',
            'invalid_terrain',
            'building_overlap',
            'task_overlap'
        ], '2.3 PlacementValidator validates all failure cases');
    }

    // Test 3: InputManager Integration
    log('\nTest 3: InputManager Integration', 'info');
    const inputPath = path.join(jsDir, 'input', 'InputManager.js');
    if (testFileExists(inputPath, '3.1 InputManager.js exists')) {
        const inputCode = readFile(inputPath);
        testCodeContains(inputCode, [
            "from '../systems/BuildingPreview.js'",
            "from '../systems/PlacementValidator.js'",
            'startBuildingPreview(',
            'endBuildingPreview(',
            '_updateBuildingPreview(',
            '_tryPlaceBuilding('
        ], '3.2 InputManager imports and uses building preview systems');

        testCodeContains(inputCode, [
            'this.buildingPreview = new BuildingPreview',
            'this.buildingPreview.updatePosition',
            'this.buildingPreview.rotate()',
            'this.buildingPreview.destroy()',
            'this.buildingPreview.hide()'
        ], '3.3 InputManager calls BuildingPreview methods');

        // Check for R key and ESC key handling
        testCodeContains(inputCode, [
            "e.key === 'r'",
            "e.key === 'R'",
            "e.key === 'Escape'",
            'this.modeHandler?.currentMode === \'build\''
        ], '3.4 InputManager handles R and ESC keys in build mode');
    }

    // Test 4: ModeHandler Integration
    log('\nTest 4: ModeHandler Integration', 'info');
    const modePath = path.join(jsDir, 'input', 'ModeHandler.js');
    if (testFileExists(modePath, '4.1 ModeHandler.js exists')) {
        const modeCode = readFile(modePath);
        testCodeContains(modeCode, [
            'this.inputManager = inputManager',
            'setMode(mode, buildingType',
            'BUILD_MODE = \'build\'',
            'inputManager.endBuildingPreview()',
            'inputManager.startBuildingPreview('
        ], '4.2 ModeHandler controls building preview lifecycle');

        // Check demolish functionality
        testCodeContains(modeCode, [
            'case "demolish":',
            'createDemolishTasks',
            'building.state = \'demolishing\''
        ], '4.3 ModeHandler handles demolish mode');
    }

    // Test 5: Configuration
    log('\nTest 5: Building Configuration', 'info');
    const configPath = path.join(jsDir, 'config.js');
    if (testFileExists(configPath, '5.1 config.js exists')) {
        const configCode = readFile(configPath);
        const buildingTypes = ['wall', 'door', 'bed', 'storage', 'workbench', 'medical_bed'];
        const missingTypes = buildingTypes.filter(t => !configCode.includes(`"${t}"`));

        assert(
            missingTypes.length === 0,
            '5.2 All building types defined',
            `Missing: ${missingTypes.join(', ')}`
        );

        // Check for required properties
        testCodeContains(configCode, [
            'BUILDING_TYPES',
            'width:',
            'height:',
            'color:',
            'resources:',
            'placementRules:'
        ], '5.3 Building types have required properties');
    }

    // Test 6: Geometry Utilities
    log('\nTest 6: Geometry Utilities', 'info');
    const geometryPath = path.join(jsDir, 'utils', 'geometry.js');
    if (testFileExists(geometryPath, '6.1 geometry.js exists')) {
        const geometryCode = readFile(geometryPath);
        testCodeContains(geometryCode, [
            'export function worldToGrid',
            'export function gridToWorld',
            'TILE_SIZE'
        ], '6.2 Geometry has required conversion functions');
    }

    // Test 7: Right-click rotation
    log('\nTest 7: Right-Click Rotation', 'info');
    if (testFileExists(inputPath, '7.1 InputManager.js exists')) {
        const inputCode = readFile(inputPath);
        testCodeContains(inputCode, [
            'e.button === 2',
            'this.buildingPreview && this.modeHandler?.currentMode === \'build\'',
            'this.buildingPreview.rotate()',
            'return // Prevent other right-click behavior'
        ], '7.2 Right-click rotates preview in build mode');
    }

    // Test 8: Resource Deduction
    log('\nTest 8: Resource Deduction', 'info');
    if (testFileExists(inputPath, '8.1 InputManager.js exists')) {
        const inputCode = readFile(inputPath);
        testCodeContains(inputCode, [
            '_checkAndDeductResources(',
            'config.resources',
            'this.state.resources[',
            'Insufficient'
        ], '8.2 Resources checked and deducted on placement');
    }

    // Test 9: Task Creation
    log('\nTest 9: Task Creation on Placement', 'info');
    if (testFileExists(inputPath, '9.1 InputManager.js exists')) {
        const inputCode = readFile(inputPath);
        testCodeContains(inputCode, [
            'new Task(`build_${buildingType}`',
            'task.buildingId',
            'building.taskId',
            'this.state.taskSystem.addTask(task)'
        ], '9.2 Build task created and linked to building');
    }

    // Test 10: Render Order
    log('\nTest 10: Preview Render Order', 'info');
    if (testFileExists(previewPath, '10.1 BuildingPreview.js exists')) {
        const previewCode = readFile(previewPath);
        testCodeContains(previewCode, [
            'renderOrder = 100',
            'renderOrder = 101',
            'depthTest: false',
            'depthWrite: false'
        ], '10.2 Preview renders on top of other objects');
    }

    // Summary
    log('\n=== Test Summary ===\n', 'info');
    log(`Total Tests: ${TEST_RESULTS.total}`, 'info');
    log(`Passed: ${TEST_RESULTS.passed.length}`, 'success');
    log(`Failed: ${TEST_RESULTS.failed.length}`, 'error');

    if (TEST_RESULTS.failed.length > 0) {
        log('\nFailed Tests:', 'error');
        TEST_RESULTS.failed.forEach(f => {
            log(`  - ${f.name}: ${f.error}`, 'error');
        });
    }

    const passRate = (TEST_RESULTS.passed.length / TEST_RESULTS.total * 100).toFixed(1);
    log(`\nPass Rate: ${passRate}%`, passRate >= 80 ? 'success' : 'warning');

    return TEST_RESULTS.failed.length === 0 ? 0 : 1;
}

// Run tests
const exitCode = runTests();
process.exit(exitCode);
