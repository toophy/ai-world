# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Rust library for modeling, hashing, validating, and patching sequential schedule assets for AI-driven debugging workflows. The crate also includes a RimWorld-style colony simulation demo.

**Key capabilities:**
- Schedule asset model with phases, nodes, and breakpoints
- Deterministic SHA-256 hashing of schedule assets
- Validation diagnostics for duplicate IDs, invalid references, and multi-phase node placement
- Patch application with optimistic concurrency via `base_schedule_hash`

## Common Commands

### Testing
```bash
cargo test              # Run all tests
cargo test --           # Run tests with output
cargo test test_name    # Run a specific test
```

### Running the Colony Demo
```bash
cargo run              # Run the RimWorld-style colony simulation demo
```

### Linting/Formatting
```bash
cargo fmt              # Format code
cargo clippy           # Run linter
```

## Architecture

### Module Structure
- **lib.rs** - Public API exports (ScheduleAsset, PatchEnvelope, PatchOp, Diagnostic, Severity)
- **schedule.rs** - Core data models (ScheduleAsset, Phase, Node, Breakpoint, DebugOptions, AssetMetadata) and validation
- **patch.rs** - PatchEnvelope, PatchOp enum (tagged with `op` field), and patch application logic
- **diagnostics.rs** - Diagnostic and Severity types for validation feedback
- **hashing.rs** - SHA-256 hashing utilities
- **colony.rs** - Colony simulation demo (Position, Pawn, BerryBush, Task, Colony types)
- **main.rs** - Entry point for the colony demo

### Key Design Patterns

**Patch Operations**: The `PatchOp` enum uses serde's `tag = "op"` for externally-tagged deserialization. Each variant represents a mutation:
- Node operations: AddNode, RemoveNode, SetNodeEnabled, SetNodeParams
- Phase operations: AddPhase, RemovePhase, ReorderPhases, SetPhaseNodes, MoveNodeToPhase
- Breakpoint operations: AddBreakpoint, RemoveBreakpoint

**Optimistic Concurrency**: Patches include `base_schedule_hash` which is validated before application. The hash is computed via `ScheduleAsset::schedule_hash()` using JSON serialization + SHA-256.

**Validation**: `ScheduleAsset::validate()` returns `Vec<Diagnostic>` checking for:
- Duplicate node/phase IDs
- Invalid node references in phases
- Nodes appearing in multiple phases

Use `apply_validation_gate()` to check if diagnostics contain errors.

### Colony Demo (game/index.html and colony.rs)

The demo is a console-playable colony simulation with:
- Automated task dispatch with priority-based assignment
- Autonomous pawn movement and resource gathering
- Text-based HUD panel showing resources, tasks, and logs

The simulation runs in a loop rendering ASCII art of the game world.

### Web UI (web/ directory)

The web-based UI features a modern component architecture built with vanilla JavaScript and styled with Tailwind CSS + DaisyUI.

#### UI Component Architecture

**BaseComponent System**: All UI components extend `BaseComponent` which provides:
- Lifecycle hooks: `componentWillMount`, `componentDidMount`, `componentWillUpdate`, `componentDidUpdate`, `componentWillUnmount`
- State management via `setState()` and `shouldUpdate()`
- Automatic event binding/cleanup via `on()` and `unbindEvents()`
- Mount/unmount lifecycle for proper resource cleanup

**Component Hierarchy**:
```
UIManager
├── TopBar (header with game controls)
│   ├── ResourcePanel (resource badges)
│   ├── Button (pause/speed controls)
│   └── Time display
├── BuildPanel (construction & actions)
│   ├── Button (building types)
│   ├── Button (action modes)
│   └── Button (priority levels)
├── PawnList (colonist cards)
├── TaskList (task queue with progress)
├── Inspector (entity details)
└── EventLog (game events)

Reusable Components:
├── Button (variant, size, icon, state)
├── Badge (resource/status indicators)
├── ProgressBar (health, progress bars)
└── Icon (SVG icon renderer)
```

**Key Design Patterns**:
- **Composition**: Components compose other components (e.g., TopBar contains ResourcePanel and Buttons)
- **Props-based rendering**: Components render based on props passed from parent
- **Update optimization**: Components can override `shouldUpdate()` to prevent unnecessary re-renders
- **Event delegation**: Events bound via `on()` are automatically cleaned up on unmount

**UI Manager**: Centralized UI controller that:
- Initializes all panels on startup
- Provides update methods for each panel type (`updatePawns`, `updateTasks`, `showInspector`, etc.)
- Handles mode changes, speed control, pause state
- Manages selected entity state and shows notifications

**Styling**: Uses Tailwind CSS with custom game color tokens:
- `game-bg`, `game-panel` - Dark background colors
- `game-border`, `game-accent` - Blue-tinted borders
- `game-text`, `game-text-dim` - Text colors
- `wood`, `ore`, `berry`, `food` - Resource-specific colors

**File Structure**:
- `web/index.html` - Main HTML entry point
- `web/game.js` - Game loop and Three.js rendering
- `web/styles.css` - Custom CSS overrides
- `web/js/ui/components/` - Reusable components
- `web/js/ui/panels/` - Game-specific panels
- `web/js/ui/UIManager.js` - Central UI controller
- `web/js/entities/` - Game entity classes
- `web/js/systems/` - Game systems (TaskSystem, TimeSystem, etc.)
- `web/js/input/` - Input handling
- `web/js/utils/` - Utility functions

## brpctl CLI Tool

`tools/brpctl` is a Python-based JSON-RPC client for DevApi endpoints (when running against a DevApi server):

```bash
tools/brpctl handshake
tools/brpctl get-skills --scope combined
tools/brpctl apply-patch ./patch.json
```

Uses `BRP_ENDPOINT` environment variable or defaults to `http://127.0.0.1:3000/jsonrpc`.
