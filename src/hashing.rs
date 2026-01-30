use sha2::{Digest, Sha256};

pub fn sha256_hex(payload: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(payload);
    let digest = hasher.finalize();
    format!("sha256:{}", hex::encode(digest))
}
