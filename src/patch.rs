use crate::diagnostics::{Diagnostic, Severity};
use crate::schedule::{apply_validation_gate, Breakpoint, Node, Phase, ScheduleAsset};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PatchEnvelope {
    pub schema_version: String,
    pub patch_id: String,
    pub world_id: String,
    pub base_schedule_hash: String,
    pub policy_mode: String,
    pub ops: Vec<PatchOp>,
    #[serde(default)]
    pub client_context: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "op", rename_all = "snake_case")]
pub enum PatchOp {
    AddNode {
        #[serde(skip_serializing_if = "Option::is_none")]
        op_id: Option<String>,
        node: Node,
    },
    RemoveNode {
        #[serde(skip_serializing_if = "Option::is_none")]
        op_id: Option<String>,
        node_id: String,
    },
    SetNodeEnabled {
        #[serde(skip_serializing_if = "Option::is_none")]
        op_id: Option<String>,
        node_id: String,
        enabled: bool,
    },
    SetNodeParams {
        #[serde(skip_serializing_if = "Option::is_none")]
        op_id: Option<String>,
        node_id: String,
        params: Value,
    },
    AddPhase {
        #[serde(skip_serializing_if = "Option::is_none")]
        op_id: Option<String>,
        phase: Phase,
    },
    RemovePhase {
        #[serde(skip_serializing_if = "Option::is_none")]
        op_id: Option<String>,
        phase_id: String,
    },
    ReorderPhases {
        #[serde(skip_serializing_if = "Option::is_none")]
        op_id: Option<String>,
        phase_ids: Vec<String>,
    },
    SetPhaseNodes {
        #[serde(skip_serializing_if = "Option::is_none")]
        op_id: Option<String>,
        phase_id: String,
        node_ids: Vec<String>,
    },
    MoveNodeToPhase {
        #[serde(skip_serializing_if = "Option::is_none")]
        op_id: Option<String>,
        node_id: String,
        phase_id: String,
        position: usize,
    },
    AddBreakpoint {
        #[serde(skip_serializing_if = "Option::is_none")]
        op_id: Option<String>,
        breakpoint: Breakpoint,
    },
    RemoveBreakpoint {
        #[serde(skip_serializing_if = "Option::is_none")]
        op_id: Option<String>,
        breakpoint_id: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PatchResult {
    pub ok: bool,
    pub new_schedule_hash: Option<String>,
    pub diagnostics: Vec<Diagnostic>,
}

impl PatchEnvelope {
    pub fn apply_to(&self, schedule: &mut ScheduleAsset) -> PatchResult {
        let mut diagnostics = Vec::new();
        let current_hash = match schedule.schedule_hash() {
            Ok(hash) => hash,
            Err(err) => {
                diagnostics.push(
                    Diagnostic::error("INTERNAL_ERROR", "failed to hash schedule")
                        .with_details(Value::String(err.to_string())),
                );
                return PatchResult {
                    ok: false,
                    new_schedule_hash: None,
                    diagnostics,
                };
            }
        };

        if current_hash != self.base_schedule_hash {
            diagnostics.push(
                Diagnostic::error(
                    "SCHEDULE_VERSION_MISMATCH",
                    "base_schedule_hash does not match active schedule",
                )
                .with_details(Value::String(current_hash)),
            );
            return PatchResult {
                ok: false,
                new_schedule_hash: None,
                diagnostics,
            };
        }

        let mut next_schedule = schedule.clone();
        for op in &self.ops {
            apply_op(&mut next_schedule, op, &mut diagnostics);
        }

        diagnostics.extend(next_schedule.validate());

        if !apply_validation_gate(&diagnostics) {
            return PatchResult {
                ok: false,
                new_schedule_hash: None,
                diagnostics,
            };
        }

        *schedule = next_schedule;
        let new_hash = schedule.schedule_hash().ok();
        PatchResult {
            ok: true,
            new_schedule_hash: new_hash,
            diagnostics,
        }
    }
}

fn apply_op(schedule: &mut ScheduleAsset, op: &PatchOp, diagnostics: &mut Vec<Diagnostic>) {
    match op {
        PatchOp::AddNode { op_id, node } => {
            if schedule.nodes.iter().any(|n| n.node_id == node.node_id) {
                diagnostics.push(
                    diagnostic_with_op(
                        "DUPLICATE_ID",
                        format!("node_id {} already exists", node.node_id),
                        op_id,
                    )
                    .with_details(Value::String(node.node_id.clone())),
                );
                return;
            }
            schedule.nodes.push(node.clone());
        }
        PatchOp::RemoveNode { op_id, node_id } => {
            let before = schedule.nodes.len();
            schedule.nodes.retain(|node| node.node_id != *node_id);
            if schedule.nodes.len() == before {
                diagnostics.push(diagnostic_with_op(
                    "INVALID_REFERENCE",
                    format!("node_id {} not found", node_id),
                    op_id,
                ));
            }
            for phase in &mut schedule.phases {
                phase.nodes.retain(|id| id != node_id);
            }
        }
        PatchOp::SetNodeEnabled {
            op_id,
            node_id,
            enabled,
        } => match schedule.nodes.iter_mut().find(|n| n.node_id == *node_id) {
            Some(node) => node.enabled = *enabled,
            None => diagnostics.push(diagnostic_with_op(
                "INVALID_REFERENCE",
                format!("node_id {} not found", node_id),
                op_id,
            )),
        },
        PatchOp::SetNodeParams {
            op_id,
            node_id,
            params,
        } => match schedule.nodes.iter_mut().find(|n| n.node_id == *node_id) {
            Some(node) => node.params = params.clone(),
            None => diagnostics.push(diagnostic_with_op(
                "INVALID_REFERENCE",
                format!("node_id {} not found", node_id),
                op_id,
            )),
        },
        PatchOp::AddPhase { op_id, phase } => {
            if schedule.phases.iter().any(|p| p.phase_id == phase.phase_id) {
                diagnostics.push(diagnostic_with_op(
                    "DUPLICATE_ID",
                    format!("phase_id {} already exists", phase.phase_id),
                    op_id,
                ));
                return;
            }
            schedule.phases.push(phase.clone());
        }
        PatchOp::RemovePhase { op_id, phase_id } => {
            let before = schedule.phases.len();
            schedule.phases.retain(|phase| phase.phase_id != *phase_id);
            if schedule.phases.len() == before {
                diagnostics.push(diagnostic_with_op(
                    "INVALID_REFERENCE",
                    format!("phase_id {} not found", phase_id),
                    op_id,
                ));
            }
        }
        PatchOp::ReorderPhases { op_id, phase_ids } => {
            let existing: HashSet<_> = schedule
                .phases
                .iter()
                .map(|phase| phase.phase_id.as_str())
                .collect();
            let mut missing = Vec::new();
            for phase_id in phase_ids {
                if !existing.contains(phase_id.as_str()) {
                    missing.push(phase_id.clone());
                }
            }
            if !missing.is_empty() {
                diagnostics.push(
                    diagnostic_with_op(
                        "INVALID_REFERENCE",
                        "phase_ids contains unknown phase",
                        op_id,
                    )
                    .with_details(Value::Array(
                        missing.into_iter().map(Value::String).collect(),
                    )),
                );
                return;
            }
            let mut order: HashMap<String, usize> = HashMap::new();
            for (index, phase_id) in phase_ids.iter().enumerate() {
                order.insert(phase_id.clone(), index);
            }
            schedule
                .phases
                .sort_by_key(|phase| order.get(&phase.phase_id).copied());
        }
        PatchOp::SetPhaseNodes {
            op_id,
            phase_id,
            node_ids,
        } => match schedule
            .phases
            .iter_mut()
            .find(|phase| phase.phase_id == *phase_id)
        {
            Some(phase) => phase.nodes = node_ids.clone(),
            None => diagnostics.push(diagnostic_with_op(
                "INVALID_REFERENCE",
                format!("phase_id {} not found", phase_id),
                op_id,
            )),
        },
        PatchOp::MoveNodeToPhase {
            op_id,
            node_id,
            phase_id,
            position,
        } => {
            if !schedule.nodes.iter().any(|node| node.node_id == *node_id) {
                diagnostics.push(diagnostic_with_op(
                    "INVALID_REFERENCE",
                    format!("node_id {} not found", node_id),
                    op_id,
                ));
                return;
            }
            let Some(phase) = schedule
                .phases
                .iter_mut()
                .find(|phase| phase.phase_id == *phase_id)
            else {
                diagnostics.push(diagnostic_with_op(
                    "INVALID_REFERENCE",
                    format!("phase_id {} not found", phase_id),
                    op_id,
                ));
                return;
            };
            for other in &mut schedule.phases {
                other.nodes.retain(|id| id != node_id);
            }
            let insert_pos = (*position).min(phase.nodes.len());
            phase.nodes.insert(insert_pos, node_id.clone());
        }
        PatchOp::AddBreakpoint { op_id, breakpoint } => {
            if schedule
                .breakpoints
                .iter()
                .any(|bp| bp.breakpoint_id == breakpoint.breakpoint_id)
            {
                diagnostics.push(diagnostic_with_op(
                    "DUPLICATE_ID",
                    format!("breakpoint_id {} already exists", breakpoint.breakpoint_id),
                    op_id,
                ));
                return;
            }
            schedule.breakpoints.push(breakpoint.clone());
        }
        PatchOp::RemoveBreakpoint {
            op_id,
            breakpoint_id,
        } => {
            let before = schedule.breakpoints.len();
            schedule
                .breakpoints
                .retain(|bp| bp.breakpoint_id != *breakpoint_id);
            if schedule.breakpoints.len() == before {
                diagnostics.push(diagnostic_with_op(
                    "INVALID_REFERENCE",
                    format!("breakpoint_id {} not found", breakpoint_id),
                    op_id,
                ));
            }
        }
    }
}

fn diagnostic_with_op(
    code: &str,
    message: impl Into<String>,
    op_id: &Option<String>,
) -> Diagnostic {
    let mut diag = Diagnostic {
        op_id: op_id.clone(),
        code: code.to_string(),
        message: message.into(),
        severity: Severity::Error,
        details: None,
    };
    if let Some(op_id) = op_id {
        diag.op_id = Some(op_id.clone());
    }
    diag
}
