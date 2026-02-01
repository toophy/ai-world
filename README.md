# ai-world

A Rust library for describing, hashing, validating, and patching sequential schedule assets intended for AI-driven debugging workflows. The crate models schedule assets (phases, nodes, breakpoints) and applies domain patches with validation and diagnostic reporting.

## Features

- **Schedule asset model** with phases, nodes, and breakpoints.
- **Deterministic hashing** of schedule assets using SHA-256.
- **Validation diagnostics** for duplicate IDs, invalid references, and multi-phase node placement.
- **Patch application** with optimistic concurrency via `base_schedule_hash` and detailed diagnostics.

## Data model

The primary types exported by the crate are:

- `ScheduleAsset`, `Phase`, `Node`, `Breakpoint` for describing a sequential schedule.
- `PatchEnvelope` and `PatchOp` for applying changes.
- `Diagnostic` and `Severity` for validation feedback.

## Usage

```rust
use ai_world::{
    AssetMetadata, DebugOptions, Node, PatchEnvelope, PatchOp, Phase, ScheduleAsset,
};
use serde_json::json;

let mut schedule = ScheduleAsset {
    schema_version: "1.0".to_string(),
    catalog_hash: "sha256:catalog".to_string(),
    mode: "sequential".to_string(),
    debug_options: DebugOptions {
        deterministic: true,
        default_step_unit: "node".to_string(),
    },
    asset: AssetMetadata {
        asset_id: "asset-1".to_string(),
        name: "main".to_string(),
        author: "ai".to_string(),
        created_at_utc: "2024-01-01T00:00:00Z".to_string(),
    },
    phases: vec![Phase {
        phase_id: "p.update".to_string(),
        name: "update".to_string(),
        nodes: vec!["n.tick".to_string()],
    }],
    nodes: vec![Node {
        node_id: "n.tick".to_string(),
        system_id: "com.example::tick".to_string(),
        enabled: true,
        params: json!({}),
        tags: vec![],
    }],
    breakpoints: vec![],
};

let base_hash = schedule.schedule_hash().expect("hash schedule");

let patch = PatchEnvelope {
    schema_version: "1.0".to_string(),
    patch_id: "patch-1".to_string(),
    world_id: "default".to_string(),
    base_schedule_hash: base_hash,
    policy_mode: "enforce".to_string(),
    client_context: json!({}),
    ops: vec![PatchOp::AddNode {
        op_id: Some("op1".to_string()),
        node: Node {
            node_id: "n.move".to_string(),
            system_id: "com.example::move".to_string(),
            enabled: true,
            params: json!({"speed": 1.0}),
            tags: vec!["gameplay".to_string()],
        },
    }],
};

let result = patch.apply_to(&mut schedule);
assert!(result.ok, "patch failed: {result:?}");
```

## Development

Run tests with:

```bash
cargo test
```

## brpctl CLI

`tools/brpctl` is a local JSON-RPC client for DevApi endpoints. It enables non-MCP,
command-based invocations for workflows that need local command execution instead of MCP calls.

```bash
tools/brpctl handshake
tools/brpctl get-skills --scope combined
tools/brpctl apply-patch ./patch.json
```

See `docs/skills/brpctl_skill.md` for the skill sheet and additional examples.
