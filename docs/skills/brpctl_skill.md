# brpctl 本地命令技能（非 MCP）

该技能用于在不依赖 MCP 的情况下，通过本地命令 `tools/brpctl` 访问 AI World 的 DevApi JSON-RPC。
适用于需要把“浏览器式/工具式调用”变成命令行调用的场景，以便绕开 MCP 调用限制。

## 前置条件

- 宿主进程已启动并暴露 JSON-RPC（默认 `http://127.0.0.1:3000/jsonrpc`）。
- CLI 通过 `BRP_ENDPOINT` 或 `--endpoint` 指定目标地址。

## 常用命令

```bash
# 1) handshake
tools/brpctl handshake

# 2) 获取 skills
tools/brpctl get-skills --scope combined

# 3) 获取激活 schedule 视图
tools/brpctl get-active --world-id default

# 4) 暂停/单步/继续
tools/brpctl pause --world-id default
tools/brpctl step --world-id default <pause_token> --steps 1 --unit node
tools/brpctl resume --world-id default <pause_token>

# 5) 通过 patch 文件应用变更
tools/brpctl apply-patch ./patch.json
```

## Patch 文件格式

`apply-patch` 期望传入完整的 PatchEnvelope JSON，并会自动包裹为 `{ "patch": ... }` 调用
`schedule.apply_patch`。

```json
{
  "schema_version": "1.0",
  "patch_id": "patch-1",
  "world_id": "default",
  "base_schedule_hash": "sha256:....",
  "policy_mode": "enforce",
  "client_context": {},
  "ops": []
}
```

## Raw 调用（应急）

如需直接调用任意 JSON-RPC 方法，可使用：

```bash
tools/brpctl raw dev.handshake
tools/brpctl raw schedule.apply_patch --params '{"patch":{...}}'
```
