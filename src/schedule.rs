use crate::diagnostics::{Diagnostic, Severity};
use crate::hashing::sha256_hex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ScheduleAsset {
    pub schema_version: String,
    pub catalog_hash: String,
    pub mode: String,
    pub debug_options: DebugOptions,
    pub asset: AssetMetadata,
    pub phases: Vec<Phase>,
    pub nodes: Vec<Node>,
    #[serde(default)]
    pub breakpoints: Vec<Breakpoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DebugOptions {
    pub deterministic: bool,
    pub default_step_unit: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AssetMetadata {
    pub asset_id: String,
    pub name: String,
    pub author: String,
    pub created_at_utc: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Phase {
    pub phase_id: String,
    pub name: String,
    pub nodes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Node {
    pub node_id: String,
    pub system_id: String,
    pub enabled: bool,
    #[serde(default)]
    pub params: Value,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Breakpoint {
    pub breakpoint_id: String,
    pub node_id: String,
    pub position: String,
}

impl ScheduleAsset {
    pub fn schedule_hash(&self) -> Result<String, serde_json::Error> {
        let payload = serde_json::to_vec(self)?;
        Ok(sha256_hex(&payload))
    }

    pub fn validate(&self) -> Vec<Diagnostic> {
        let mut diagnostics = Vec::new();
        let mut node_ids = HashSet::new();
        for node in &self.nodes {
            if !node_ids.insert(node.node_id.clone()) {
                diagnostics.push(
                    Diagnostic::error(
                        "DUPLICATE_ID",
                        format!("duplicate node_id {}", node.node_id),
                    )
                    .with_details(json_details([("node_id", node.node_id.clone())])),
                );
            }
        }

        let mut phase_ids = HashSet::new();
        for phase in &self.phases {
            if !phase_ids.insert(phase.phase_id.clone()) {
                diagnostics.push(
                    Diagnostic::error(
                        "DUPLICATE_ID",
                        format!("duplicate phase_id {}", phase.phase_id),
                    )
                    .with_details(json_details([("phase_id", phase.phase_id.clone())])),
                );
            }
        }

        let node_lookup: HashSet<_> = self.nodes.iter().map(|n| n.node_id.as_str()).collect();
        let mut node_phase_map: HashMap<&str, usize> = HashMap::new();
        for phase in &self.phases {
            for node_id in &phase.nodes {
                if !node_lookup.contains(node_id.as_str()) {
                    diagnostics.push(
                        Diagnostic::error(
                            "INVALID_REFERENCE",
                            format!("phase references missing node {}", node_id),
                        )
                        .with_details(json_details([
                            ("phase_id", phase.phase_id.clone()),
                            ("node_id", node_id.clone()),
                        ])),
                    );
                    continue;
                }

                if node_phase_map.contains_key(node_id.as_str()) {
                    diagnostics.push(
                        Diagnostic::error(
                            "NODE_IN_MULTIPLE_PHASES",
                            format!("node {} appears in multiple phases", node_id),
                        )
                        .with_details(json_details([
                            ("node_id", node_id.clone()),
                            ("phase_id", phase.phase_id.clone()),
                        ])),
                    );
                } else {
                    node_phase_map.insert(node_id.as_str(), 1);
                }
            }
        }

        diagnostics
    }
}

fn json_details<const N: usize>(pairs: [(impl Into<String>, impl Into<String>); N]) -> Value {
    let map: serde_json::Map<String, Value> = pairs
        .into_iter()
        .map(|(k, v)| (k.into(), Value::String(v.into())))
        .collect();
    Value::Object(map)
}

pub fn apply_validation_gate(diagnostics: &[Diagnostic]) -> bool {
    !diagnostics
        .iter()
        .any(|diag| diag.severity == Severity::Error)
}
