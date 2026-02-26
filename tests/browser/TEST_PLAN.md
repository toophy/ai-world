# Frontier Colony - Agent Browser Test Suite

## Test Overview

Comprehensive end-to-end testing suite for the RimWorld-style colony simulation game using agent-browser.

## Test Categories

### 1. UI/Element Presence Tests (`test_01_ui_elements.sh`)
Verify all expected UI elements are present and accessible.

- [ ] Top bar with logo
- [ ] Resource indicators (wood, ore, berry, food)
- [ ] Clock display (hour, day)
- [ ] Pause button
- [ ] Speed button
- [ ] Left panel (colonists, task queue)
- [ ] Right panel (inspector, log)
- [ ] Build mode buttons (wall, door, bed, storage, workbench, medical bed)
- [ ] Resource operation buttons (mine, harvest, plant)
- [ ] Priority buttons (low, medium, high)
- [ ] Mode buttons (inspect, build, plant, harvest, mine, move, attack)
- [ ] Game canvas
- [ ] Minimap

### 2. Button Interaction Tests (`test_02_button_interactions.sh`)
Verify buttons are clickable and responsive.

- [ ] Pause button toggles pause state
- [ ] Speed button cycles through speeds (1x, 2x, 3x, pause)
- [ ] Build buttons can be selected
- [ ] Priority buttons can be selected
- [ ] Mode buttons switch modes

### 3. Game State Tests (`test_03_game_state.sh`)
Verify game state management.

- [ ] Pause stops game clock
- [ ] Resume continues game clock
- [ ] Speed changes affect time progression
- [ ] Resources display correctly

### 4. Task Creation Tests (`test_04_task_creation.sh`)
Verify task creation functionality.

- [ ] Build wall task can be created
- [ ] Build door task can be created
- [ ] Build bed task can be created
- [ ] Build storage task can be created
- [ ] Build workbench task can be created
- [ ] Mine task can be created
- [ ] Harvest task can be created
- [ ] Plant task can be created
- [ ] Tasks appear in task queue

### 5. Mode Switching Tests (`test_05_mode_switching.sh`)
Verify mode switching behavior.

- [ ] Inspect mode shows entity details
- [ ] Build mode activates building placement
- [ ] Harvest mode activates harvesting
- [ ] Mine mode activates mining
- [ ] Move mode activates move orders
- [ ] Attack mode activates combat

### 6. Canvas Interaction Tests (`test_06_canvas_interaction.sh`)
Verify 3D canvas interactions.

- [ ] Click on canvas registers
- [ ] Click on pawn selects it
- [ ] Right-click opens context menu
- [ ] Drag creates selection box (for multi-tile operations)

### 7. Pawn Behavior Tests (`test_07_pawn_behavior.sh`)
Verify pawn AI and behavior.

- [ ] Pawns spawn at correct positions
- [ ] Pawns move to task locations
- [ ] Pawns work on assigned tasks
- [ ] Pawns complete tasks
- [ ] Pawns update status display

### 8. Resource System Tests (`test_08_resources.sh`)
Verify resource management.

- [ ] Resources deduct on task creation
- [ ] Resources add on task completion
- [ ] Resource displays update in real-time

### 9. Time System Tests (`test_09_time_system.sh`)
Verify time progression.

- [ ] Clock advances during gameplay
- [ ] Day increments at midnight
- [ ] Pause stops time
- [ ] Speed multipliers work correctly

### 10. Regression Tests (`test_10_regression.sh`)
Test for previously fixed bugs.

- [ ] THREE.js imports load correctly
- [ ] No console errors on page load
- [ ] No memory leaks from event listeners

## Test Execution

Run all tests:
```bash
./tests/browser/run_all.sh
```

Run individual test:
```bash
./tests/browser/test_01_ui_elements.sh
```

## Test Results Format

```
✓ PASS: Test name
✗ FAIL: Test name - Reason
  Expected: X
  Got: Y
```

## Coverage Goals

- UI Elements: 100%
- User Interactions: 100%
- Game States: 90%+
- Task System: 100%
- Pawn AI: 80%+
