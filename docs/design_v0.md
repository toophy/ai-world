# 综合设计文档 v0

**主题：AI 驱动的可调试流水线宿主（多宿主 + 单宿主单 World + 顺序执行 + JSON-RPC DevApi）**

## 0. 设计目标

构建一个“**二进制程序浏览器**”式宿主：

- 程序在运行时对外提供 **DevApi**，外部（AI 工具）通过受控 API 操作一个对象模型（ECS World）与调度图（Schedule）。
- AI 不直接“调试二进制”，而是：
  - **编排流水线（schedule）**、**断点暂停（pause）**、**单步（step）**、**快照读值（snapshot/value-copy）**、**写入受控修改（可选）**
  - 调试成功后可将 schedule 固化为可发布资产（ScheduleAsset）。

## 1. 总体架构

### 1.1 多宿主（多进程）

- **AI Orchestrator**（外部工具）负责：
  - 选择/编译插件集合（plugin set）
  - 启动/关闭宿主进程（Host）
  - 通过 DevApi 执行调试、收集快照、导出资产
- **Host（宿主进程）**是调试沙盒：
  - 宿主异常或需要换插件版本时，直接重启/新启宿主即可
  - 避免 Rust 动态库卸载/热重载复杂性

### 1.2 单宿主内：单 World（但保留多 World 架构）

- 策略：`max_worlds = 1`，默认 `world_id = "default"`
- 架构上保留 `WorldManager/world_id` 便于未来扩展，但 v0 只暴露一个 world。

### 1.3 World 不销毁，只暂停/归档/重置

- 避免复杂 teardown/drop 顺序带来的崩溃
- 世界生命周期建议：
  - `CREATED(PAUSED)` → `RUNNING` → `PAUSED` → `ARCHIVED`（可选） → `PAUSED`
  - 异常：`FAULTED`（系统 panic/trap 后进入，便于取证）
- 不对外暴露 destroy；提供 `world.reset`（清空重置）替代。

## 2. 两阶段生命周期：Bootstrap + Frozen Runtime

### 2.1 Bootstrap Phase（启动期一次性加载）

宿主启动后、world 运行前：

1. 加载插件（System 实现 + PluginDescriptor 元信息）
2. 加载动态组件 schema（如保留；但运行期不新增）
3. 构建并冻结：
   - `SystemCatalog`（系统清单与读写/权限/互斥/参数 schema）
   - `ComponentCatalog`（组件 schema、反射/序列化策略）
   - `PolicyBundle`（硬约束校验器/规则）
   - `SkillBundle`（给 AI 的 markdown skills）
4. 生成 `catalog_hash` 并 `freeze()`

### 2.2 Frozen Runtime Phase（运行期冻结）

运行期**禁止**：

- 新增/替换/卸载插件
- 新增/修改组件 schema

运行期允许：

- 通过 DevApi 编排 schedule（仅引用冻结 catalog）
- pause/step/snapshot/query（值拷贝）
- （可选）受控写入/命令缓冲
- schedule 固化为资产

## 3. 核心技术组合（推荐）

- ECS/调度：`bevy_ecs`（独立使用 `World`/`Schedule` 能力）
- 值拷贝/反射：`bevy_reflect`（用于快照与 schema 导出）
- DevApi 传输：JSON-RPC（建议 `jsonrpsee`）
- 可选参考：Bevy Remote / BRP 的 JSON-RPC 风格与字段组织

> v0 的关键不是“引擎整合”，而是 **冻结 catalog + 顺序可调试 schedule + 稳定 DevApi**。

## 4. ID 与哈希规范

### 4.1 稳定 ID

- `plugin_id`: 反向域名形式（例 `com.yourorg.sim.physics`）
- `system_id`: `{plugin_id}::{system_name}`
- `component_id`: `{plugin_id}::{component_name}`
- `world_id`: `"default"`（v0 固定）

### 4.2 哈希

- `catalog_hash`：冻结内容的 sha256（canonical json）
- `schedule_hash`：当前激活 schedule 视图的 sha256（canonical json）
- Domain patch 采用 `base_schedule_hash` 乐观并发控制

## 5. 文件规格：PluginDescriptor / Catalog / Skills（启动期）

### 5.1 `plugin_descriptor.json`（每插件一份）

字段要点：

- `plugin.plugin_id/name/version/build`
- `components[]`：组件 schema（或为空）
- `systems[]`：系统描述（reads/writes/requires/mutex/permissions/params_schema）
- `skills[]`：插件级 skills markdown 片段
- `policies[]`：规则入口（可选）

> 运行期不新增插件/组件 ⇒ 描述只在启动期采集并冻结。

### 5.2 宿主冻结输出（建议落盘）

- `catalog_manifest.json`：`catalog_hash`、plugin_set、计数、policy_hash、skills_hash
- `system_catalog.json`
- `component_catalog.json`
- `skills_bundle/`：插件级 + 组合级 markdown
- `policy_bundle/`：规则文件（可选）

## 6. ScheduleAsset v0（顺序执行版）

### 6.1 设计原则

- **顺序执行**：不并行、不做并行冲突校验
- 调试语义清晰：`step=node` 像断点调试
- 执行结构明确：**phases（有序）+ phase 内 nodes（有序）**
- v0 不需要 edges（未来可扩展）

### 6.2 `schedule_asset.json`

```json
{
  "schema_version": "1.0",
  "catalog_hash": "sha256:....",
  "mode": "sequential",
  "debug_options": { "deterministic": true, "default_step_unit": "node" },

  "asset": { "asset_id":"...", "name":"...", "author":"ai", "created_at_utc":"..." },

  "phases": [
    { "phase_id":"p.init", "name":"init", "nodes":["n.spawn","n.load"] },
    { "phase_id":"p.update", "name":"update", "nodes":["n.tick","n.integrate"] }
  ],
  "nodes": [
    { "node_id":"n.integrate", "system_id":"com.x::integrate", "enabled":true, "params":{}, "tags":[] }
  ],

  "breakpoints": []
}
```

### 6.3 v0 约束

- `catalog_hash` 必须与宿主 handshake 一致，否则拒绝运行/应用
- node_id/phase_id 唯一
- 每 node 在整个 schedule 中最多属于一个 phase（建议强制）
- `system_id` 必须存在于 `SystemCatalog`
- `params` 必须通过 `params_schema`

## 7. Domain Patch v0（顺序版）

### 7.1 Patch 概念

- patch = 一组语义化 op（增删/重排/修改），以事务方式应用
- **全成功才提交**，失败则零修改并返回 diagnostics
- 通过 `base_schedule_hash` 做乐观并发控制（防止基于旧版本补丁）

### 7.2 PatchEnvelope

```json
{
  "schema_version": "1.0",
  "patch_id": "p-uuid",
  "world_id": "default",
  "base_schedule_hash": "sha256:....",
  "policy_mode": "enforce",
  "ops": [ ... ],
  "client_context": { "actor":"ai", "trace_id":"..." }
}
```

### 7.3 v0 操作集合（推荐最小闭环）

**Node**

- `add_node`
- `remove_node`
- `set_node_enabled`
- `set_node_params`

**Phase**

- `add_phase`
- `remove_phase`
- `reorder_phases`（一次性设定顺序）

**Phase ↔ Node 组织**

- `set_phase_nodes`（一次性设定 phase 内节点顺序）
- `move_node_to_phase`（移动到 phase 的指定位置）

**Breakpoint**

- `add_breakpoint`
- `remove_breakpoint`

> 顺序版不需要 `parallel` 字段，不需要并行冲突类错误码。

### 7.4 全局校验（apply_patch 必做）

- `SCHEDULE_VERSION_MISMATCH`：base hash 不匹配
- `DUPLICATE_ID`
- `INVALID_REFERENCE`
- `INVALID_PARAMS`
- `POLICY_VIOLATION` / `MISSING_PERMISSION`
- `NODE_IN_MULTIPLE_PHASES`（如强制“一 node 一 phase”）

## 8. DevApi（JSON-RPC）v0

### 8.1 目标

- 面向 AI 工具：稳定、可脚本化、可诊断、自修复友好
- 强一致读写/快照通过 `pause_token` 保障

### 8.2 Handshake 与 Catalog

- `dev.handshake() -> {host_id, run_id, api_version, catalog_hash, capabilities}`
- `catalog.list_systems(...)`
- `catalog.list_components(...)`
- `catalog.get_skills({scope:"plugin|combined", id?})`

### 8.3 Schedule 操作

- `schedule.get_active({world_id, include}) -> ActiveScheduleView`
- `schedule.apply_patch({patch}) -> {ok, new_schedule_hash?, diagnostics[]}`
- `schedule.commit_asset({world_id, name, metadata}) -> {asset_id, hash}`
- `schedule.set_active({world_id, asset_id}) -> {ok}`（可选）

### 8.4 World 与运行控制

- `world.get_state({world_id})`
- `world.reset({world_id, mode:"clean"|"from_seed", seed?})`
- `run.pause({world_id, reason?}) -> {pause_token, at_cursor}`
- `run.step({world_id, pause_token, steps, unit:"node"|"phase"}) -> {at_cursor}`
- `run.resume({world_id, pause_token})`

> 运行期强建议默认 world 初始为 `PAUSED`。

### 8.5 数据面与快照（值拷贝）

- `data.query_entities({world_id, pause_token, query, limit, cursor})`
- `data.read_components({world_id, pause_token, entity_ids, component_ids, fields?})`
- `snapshot.begin({world_id, pause_token, spec}) -> {snapshot_id}`
- `snapshot.get({snapshot_id, cursor, limit}) -> {values, next_cursor}`
- `snapshot.end({snapshot_id})`

## 9. `schedule.get_active()` v0（顺序版对齐）

### 9.1 目的

- 给 AI 一个最小上下文：当前 `schedule_hash` + phases/nodes 顺序视图
- 用于生成 domain patch 的 `base_schedule_hash`

### 9.2 Response（要点）

```json
{
  "ok": true,
  "catalog_hash": "sha256:....",
  "schedule": {
    "schedule_id": "active",
    "schedule_hash": "sha256:....",
    "mode": "sequential",
    "default_step_unit": "node",
    "name": "main_pipeline_v1"
  },
  "graph": {
    "phases": [ ...ordered... ],
    "nodes": [ { node_id, system_id, enabled, params, system_summary? } ],
    "breakpoints": [ ... ]
  },
  "diagnostics": [ ...optional warnings... ]
}
```

**建议 include：**

- `node_params: inline`
- `system_io_summary: true`（即使不并行，也利于 AI 理解系统影响与规则）

## 10. Snapshot Spec DSL v0（暂停后选择性快照）

```json
{
  "entities": {
    "query": { "with": ["com.x::RigidBody"], "without": [] },
    "limit": 1000,
    "cursor": null
  },
  "components": [
    { "component_id":"com.y::Transform", "fields":["pos","rot"] },
    { "component_id":"com.x::RigidBody", "fields":["vel","mass"] }
  ]
}
```

- v0 可先忽略 `fields` 裁剪，返回全字段（后续优化）
- 强一致：必须持有 `pause_token`

## 11. 调试语义（顺序世界的核心优势）

- `step(unit="node")`：执行下一个节点，停在 safe point（enter/exit node 之间可设置断点）
- `step(unit="phase")`：执行一个 phase（按 nodes 顺序执行 enabled 节点），停在 safe point
- 断点触发点：
  - `enter_node`
  - `exit_node`

> 顺序执行让 step 语义完全确定，极适合 AI 迭代调试。

## 12. Policy / Skills：红线必须可执行

### 12.1 强制点

- `schedule.apply_patch`：静态校验（permissions、禁止组合、阶段约束、requires 等）
- `snapshot.begin` / `data.read` / `data.write(可选)`：运行时门禁（必须 paused、capability tokens 等）

### 12.2 Skills 生成策略

- 插件级 skills：列系统/组件、参数规则、常见用法、禁用组合说明
- 组合级 skills：跨插件红线、推荐 phase 模板、推荐调试脚本（get_active→patch→pause→snapshot→step→commit）

## 13. 错误码与诊断格式（统一）

### 13.1 JSON-RPC error（或 result diagnostics）

- `SCHEDULE_VERSION_MISMATCH`
- `INVALID_REFERENCE`
- `DUPLICATE_ID`
- `INVALID_PARAMS`
- `POLICY_VIOLATION`
- `MISSING_PERMISSION`
- `WORLD_NOT_PAUSED`
- `INVALID_TOKEN`
- `CATALOG_HASH_MISMATCH`
- `WORLD_FAULTED`

### 13.2 diagnostics 结构

```json
{
  "op_id": "op21",
  "code": "INVALID_PARAMS",
  "message": "dt_scale must be >= 0",
  "severity": "error",
  "details": { ... }
}
```

- `op_id` 可为空表示全局校验
- diagnostics 应尽量一次返回多条，便于 AI 一次修复

## 14. AI 标准工作流（推荐写进 skills）

1. `handshake`
2. `get_active`
3. 生成 domain patch（base= schedule_hash）
4. `apply_patch`
   - 失败：读取 diagnostics → `get_active`（rebase）→ 重试（有限次数）
5. `pause`
6. `snapshot`（只取关键组件）
7. `step(node/phase)` 循环 + 断点取证
8. 通过：`commit_asset`（记录 invariants、元数据）

## 附录 A：最小 MVP 范围（建议先做）

- Bootstrap + freeze（生成 `catalog_hash`）
- `dev.handshake`
- `schedule.get_active`
- 顺序 schedule 表达（phases+nodes）
- Domain patch：`add_node/add_phase/set_phase_nodes/reorder_phases/set_node_params`
- `run.pause/step(node)/resume`
- `snapshot.begin/get/end`（值拷贝）

这就足以让 AI 形成“编排—调试—固化”的闭环。

## 附录 B：建议的后续演进（不破坏 v0）

- edges（作为额外约束/诊断，而非必需）
- snapshot fields 裁剪、diff watch
- `world.archive/unarchive`
- `FAULTED` 取证接口（fault.get_info）
- 恢复并行：保留 `system_summary.reads/writes/mutex` 为升级基础（但你当前明确不并行，v0 不做）
