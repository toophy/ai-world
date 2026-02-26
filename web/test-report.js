#!/usr/bin/env node

/**
 * Final comprehensive test verification for Building Preview System
 * Task 19: Complete functionality verification
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS = {
    tasks: [],
    passed: 0,
    failed: 0,
    warnings: 0
};

function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        error: '\x1b[31m',
        warning: '\x1b[33m',
        reset: '\x1b[0m',
        bold: '\x1b[1m'
    };
    const color = colors[type] || colors.info;
    console.log(`${color}${message}${colors.reset}`);
}

function recordTask(taskNum, name, status, details = '') {
    RESULTS.tasks.push({ taskNum, name, status, details });
    if (status === 'PASS') RESULTS.passed++;
    else if (status === 'FAIL') RESULTS.failed++;
    else RESULTS.warnings++;
}

function verifyFileExists(filePath, taskNum, taskName) {
    const exists = fs.existsSync(filePath);
    if (exists) {
        recordTask(taskNum, taskName, 'PASS', `File found: ${path.basename(filePath)}`);
        log(`✓ Task ${taskNum}: ${taskName}`, 'success');
    } else {
        recordTask(taskNum, taskName, 'FAIL', `File missing: ${filePath}`);
        log(`✗ Task ${taskNum}: ${taskName} - File not found`, 'error');
    }
    return exists;
}

function verifyCodeContains(filePath, patterns, taskNum, taskName) {
    const code = fs.readFileSync(filePath, 'utf-8');
    const missing = patterns.filter(p => !code.includes(p));

    if (missing.length === 0) {
        recordTask(taskNum, taskName, 'PASS', 'All patterns found');
        log(`✓ Task ${taskNum}: ${taskName}`, 'success');
        return true;
    } else {
        recordTask(taskNum, taskName, 'FAIL', `Missing: ${missing.join(', ')}`);
        log(`✗ Task ${taskNum}: ${taskName}`, 'error');
        log(`  Missing patterns: ${missing.join(', ')}`, 'error');
        return false;
    }
}

function verifyImports(filePath, imports, taskNum, taskName) {
    const code = fs.readFileSync(filePath, 'utf-8');
    const missing = imports.filter(imp => !code.includes(imp));

    if (missing.length === 0) {
        recordTask(taskNum, taskName, 'PASS', 'All imports present');
        log(`✓ Task ${taskNum}: ${taskName}`, 'success');
        return true;
    } else {
        recordTask(taskNum, taskName, 'FAIL', `Missing imports: ${missing.join(', ')}`);
        log(`✗ Task ${taskNum}: ${taskName}`, 'error');
        return false;
    }
}

// Main test execution
function runVerification() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'bold');
    log('║   BUILDING PREVIEW SYSTEM - FINAL VERIFICATION REPORT    ║', 'bold');
    log('║                    Task 19: Testing                       ║', 'bold');
    log('╚════════════════════════════════════════════════════════════╝\n', 'bold');

    const jsDir = path.join(__dirname, 'js');

    // Task 1: Project Structure
    log('--- Core System Files ---', 'info');
    verifyFileExists(path.join(jsDir, 'systems', 'BuildingPreview.js'), 1, 'BuildingPreview System');
    verifyFileExists(path.join(jsDir, 'systems', 'PlacementValidator.js'), 2, 'PlacementValidator System');

    // Task 3-4: Integration
    log('\n--- Integration Tests ---', 'info');
    verifyImports(
        path.join(jsDir, 'input', 'InputManager.js'),
        [
            "from '../systems/BuildingPreview.js'",
            "from '../systems/PlacementValidator.js'"
        ],
        3,
        'InputManager imports building systems'
    );

    verifyCodeContains(
        path.join(jsDir, 'input', 'InputManager.js'),
        ['startBuildingPreview', 'endBuildingPreview', '_updateBuildingPreview'],
        4,
        'InputManager building preview methods'
    );

    // Task 5: ModeHandler
    verifyCodeContains(
        path.join(jsDir, 'input', 'ModeHandler.js'),
        ['inputManager.startBuildingPreview', 'inputManager.endBuildingPreview'],
        5,
        'ModeHandler preview lifecycle control'
    );

    // Task 6-8: BuildingPreview Features
    log('\n--- BuildingPreview Features ---', 'info');
    verifyCodeContains(
        path.join(jsDir, 'systems', 'BuildingPreview.js'),
        [
            'constructor(scene, buildingType',
            'createMeshes()',
            'updatePosition(gridPos, isValid)',
            'rotate()',
            'destroy()'
        ],
        6,
        'BuildingPreview core methods'
    );

    verifyCodeContains(
        path.join(jsDir, 'systems', 'BuildingPreview.js'),
        ['0x00ff00', '0xff0000', 'outlineColor'],
        7,
        'Green/Red outline colors'
    );

    verifyCodeContains(
        path.join(jsDir, 'systems', 'BuildingPreview.js'),
        ['renderOrder = 100', 'depthTest: false'],
        8,
        'Preview render on top'
    );

    // Task 9-11: PlacementValidator
    log('\n--- PlacementValidator Features ---', 'info');
    verifyCodeContains(
        path.join(jsDir, 'systems', 'PlacementValidator.js'),
        [
            'static validate(',
            'getOccupiedTiles',
            'checkBounds',
            'checkTerrain',
            'checkOverlap'
        ],
        9,
        'PlacementValidator validation methods'
    );

    verifyCodeContains(
        path.join(jsDir, 'systems', 'PlacementValidator.js'),
        ['out_of_bounds', 'invalid_terrain', 'building_overlap', 'task_overlap'],
        10,
        'All validation failure cases'
    );

    verifyCodeContains(
        path.join(jsDir, 'systems', 'PlacementValidator.js'),
        ['placementRules?.allowedTerrain', 'requiresRoof', 'minNeighbors'],
        11,
        'Building-specific placement rules'
    );

    // Task 12-14: Input Features
    log('\n--- Input Features ---', 'info');
    verifyCodeContains(
        path.join(jsDir, 'input', 'InputManager.js'),
        ["e.key === 'r'", "e.key === 'R'", 'buildingPreview.rotate()'],
        12,
        'R key rotation'
    );

    verifyCodeContains(
        path.join(jsDir, 'input', 'InputManager.js'),
        ['e.button === 2', 'buildingPreview.rotate()'],
        13,
        'Right-click rotation'
    );

    verifyCodeContains(
        path.join(jsDir, 'input', 'InputManager.js'),
        ["e.key === 'Escape'", "modeHandler?.currentMode === 'build'", 'setMode(\'inspect\')'],
        14,
        'ESC key cancel'
    );

    // Task 15-17: Building Placement
    log('\n--- Building Placement ---', 'info');
    verifyCodeContains(
        path.join(jsDir, 'input', 'InputManager.js'),
        ['_tryPlaceBuilding()', 'buildingPreview.isValid', 'PlacementValidator.validate'],
        15,
        'Valid placement check'
    );

    verifyCodeContains(
        path.join(jsDir, 'input', 'InputManager.js'),
        ['_checkAndDeductResources', 'config.resources', 'state.resources'],
        16,
        'Resource deduction'
    );

    verifyCodeContains(
        path.join(jsDir, 'input', 'InputManager.js'),
        ['new Building(', 'new Task(`build_', 'task.buildingId', 'building.taskId'],
        17,
        'Building and task creation'
    );

    // Task 18-19: Configuration
    log('\n--- Configuration ---', 'info');
    const configCode = fs.readFileSync(path.join(jsDir, 'config.js'), 'utf-8');
    const hasAllBuildings = ['wall', 'door', 'bed', 'storage', 'workbench', 'medical_bed']
        .every(b => configCode.includes(`${b}: {`));

    if (hasAllBuildings) {
        recordTask(18, 'Building types configuration', 'PASS', 'All 6 building types defined');
        log('✓ Task 18: Building types configuration', 'success');
    } else {
        recordTask(18, 'Building types configuration', 'FAIL', 'Missing building types');
        log('✗ Task 18: Building types configuration', 'error');
    }

    verifyCodeContains(
        path.join(jsDir, 'config.js'),
        ['width:', 'height:', 'color:', 'resources:', 'placementRules:'],
        19,
        'Building config properties'
    );

    // Generate Final Report
    log('\n╔════════════════════════════════════════════════════════════╗', 'bold');
    log('║                   FINAL TEST SUMMARY                       ║', 'bold');
    log('╚════════════════════════════════════════════════════════════╝\n', 'bold');

    const total = RESULTS.tasks.length;
    const passRate = ((RESULTS.passed / total) * 100).toFixed(1);

    log(`Total Tasks Verified: ${total}`, 'info');
    log(`Passed: ${RESULTS.passed}`, 'success');
    log(`Failed: ${RESULTS.failed}`, RESULTS.failed > 0 ? 'error' : 'info');
    log(`Warnings: ${RESULTS.warnings}`, 'warning');
    log(`Pass Rate: ${passRate}%\n`, passRate >= 95 ? 'success' : 'warning');

    // Detailed results
    if (RESULTS.failed > 0) {
        log('Failed Tasks:', 'error');
        RESULTS.tasks.filter(t => t.status === 'FAIL').forEach(t => {
            log(`  ✗ Task ${t.taskNum}: ${t.name}`, 'error');
            log(`    ${t.details}`, 'error');
        });
    }

    // Manual testing checklist
    log('\n--- Manual Testing Checklist ---', 'info');
    log('The following features require manual testing in the browser:', 'warning');
    const manualTests = [
        '1. Click building button → preview appears and follows mouse',
        '2. Move to valid tile → green outline shows',
        '3. Move to water/invalid → red outline shows',
        '4. Press R → preview rotates 90°',
        '5. Right-click → preview rotates 90°',
        '6. Click on valid tile → building placed',
        '7. Placed building shows construction progress (semi-transparent)',
        '8. Press ESC → build mode exits, preview disappears',
        '9. Click demolish button → click building → red outline',
        '10. Demolished building disappears when complete'
    ];

    manualTests.forEach(test => log(`  ${test}`, 'warning'));

    log('\n--- Open Test Suite ---', 'info');
    log('Interactive test suite available at:', 'info');
    log('  http://localhost:8000/test-building-preview.html\n', 'info');

    // Final verdict
    if (RESULTS.failed === 0) {
        log('✓ ALL AUTOMATED TESTS PASSED!', 'success');
        log('  System is ready for manual browser testing.\n', 'success');
        return 0;
    } else {
        log('✗ SOME TESTS FAILED - Please review above', 'error');
        return 1;
    }
}

// Run verification
const exitCode = runVerification();
process.exit(exitCode);
