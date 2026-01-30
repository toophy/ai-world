use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Diagnostic {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub op_id: Option<String>,
    pub code: String,
    pub message: String,
    #[serde(default = "default_severity")]
    pub severity: Severity,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Value>,
}

fn default_severity() -> Severity {
    Severity::Error
}

impl Diagnostic {
    pub fn error(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            op_id: None,
            code: code.into(),
            message: message.into(),
            severity: Severity::Error,
            details: None,
        }
    }

    pub fn with_op(mut self, op_id: impl Into<String>) -> Self {
        self.op_id = Some(op_id.into());
        self
    }

    pub fn with_details(mut self, details: Value) -> Self {
        self.details = Some(details);
        self
    }
}
