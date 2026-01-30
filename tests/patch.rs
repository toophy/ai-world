use ai_world::{
    AssetMetadata, Breakpoint, DebugOptions, Node, PatchEnvelope, PatchOp, Phase, ScheduleAsset,
};
use serde_json::json;

fn sample_schedule() -> ScheduleAsset {
    ScheduleAsset {
        schema_version: "1.0".to_string(),
        catalog_hash: "sha256:test".to_string(),
        mode: "sequential".to_string(),
        debug_options: DebugOptions {
            deterministic: true,
            default_step_unit: "node".to_string(),
        },
        asset: AssetMetadata {
            asset_id: "asset-1".to_string(),
            name: "main".to_string(),
            author: "tester".to_string(),
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
    }
}

#[test]
fn apply_patch_adds_node_and_breakpoint() {
    let mut schedule = sample_schedule();
    let base_hash = schedule.schedule_hash().expect("hash schedule");

    let patch = PatchEnvelope {
        schema_version: "1.0".to_string(),
        patch_id: "patch-1".to_string(),
        world_id: "default".to_string(),
        base_schedule_hash: base_hash,
        policy_mode: "enforce".to_string(),
        client_context: json!({}),
        ops: vec![
            PatchOp::AddNode {
                op_id: Some("op1".to_string()),
                node: Node {
                    node_id: "n.move".to_string(),
                    system_id: "com.example::move".to_string(),
                    enabled: true,
                    params: json!({"speed": 1.0}),
                    tags: vec!["gameplay".to_string()],
                },
            },
            PatchOp::MoveNodeToPhase {
                op_id: Some("op2".to_string()),
                node_id: "n.move".to_string(),
                phase_id: "p.update".to_string(),
                position: 1,
            },
            PatchOp::AddBreakpoint {
                op_id: Some("op3".to_string()),
                breakpoint: Breakpoint {
                    breakpoint_id: "bp-1".to_string(),
                    node_id: "n.move".to_string(),
                    position: "enter_node".to_string(),
                },
            },
        ],
    };

    let result = patch.apply_to(&mut schedule);
    assert!(result.ok, "patch should apply: {result:?}");
    assert!(schedule
        .phases
        .iter()
        .any(|phase| phase.nodes.contains(&"n.move".to_string())));
    assert!(schedule
        .breakpoints
        .iter()
        .any(|bp| bp.breakpoint_id == "bp-1"));
}
