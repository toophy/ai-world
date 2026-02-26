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

## brpctl CLI Tool

`tools/brpctl` is a Python-based JSON-RPC client for DevApi endpoints (when running against a DevApi server):

```bash
tools/brpctl handshake
tools/brpctl get-skills --scope combined
tools/brpctl apply-patch ./patch.json
```

Uses `BRP_ENDPOINT` environment variable or defaults to `http://127.0.0.1:3000/jsonrpc`.
