# 功能 Spec：Figma UI 对齐与交互契约落地

- 功能 ID：`2026-08-23-figma-ui-alignment`
- 产品负责人：判判项目组
- 风险等级：高（敏感关系内容、隐私投影、异步状态和安全干预）
- 基线：原生微信小程序；route 以 `app.json` 当前 20 页为准
- 本轮交付：只写 Spec；不修改代码、不修改 Figma

## 用户问题与目标

当前代码已经覆盖业务主链路，但页面视觉、组件状态、页面返回和异常反馈还没有形成一套可执行的前端契约。目标是把 Figma 的视觉稿转译为可在原生微信小程序中实现的规范：

- 统一页面 Token、Typography、间距、圆角和组件状态。
- 让 20 个 route 都能对应一个明确的 Figma Screen、入口、角色、隐私范围、主操作、失败恢复和 QA 选择器。
- 将正常态、加载、失败、离线、超时、草稿保留、权限拒绝和安全暂停纳入交互结构。
- 保持本地 mock-first；UI 对齐不扩大真实数据范围，不接入生产云、真实 AI、支付或发布。

## 范围

### 包含

- Figma 只读核对、Token/Typography 审计和前端命名映射。
- 20 个 route 的页面契约。
- 公共组件契约、props/state、交互时序和可复用边界。
- 请求、保存、运行模式、隐私、邀请、安全、删除、权限、恢复和双方进度状态枚举。
- Home 三态、P0 主流程、Case Detail 中枢和 P1 页面视觉/交互实施顺序。
- `qa-*` 选择器约定、mock-first 验证路径和验收矩阵。

### 不包含

- 修改 Figma 文件或向 Figma 回写代码、节点、组件、Prototype。
- 修改 AI Prompt、模型供应商、输出结构或云端数据结构。
- 新增账户、情侣绑定、付费墙、支付、公开社区或可搜索历史。
- 把 mock、fallback、模拟器或单设备流程表述为真实用户/双设备/生产能力。
- 在本 Spec 阶段修改任何 WXML/WXSS/JS/JSON/云函数。

## 20 route 页面契约

以下表格是视觉和交互实现的最小契约；完整状态必须和 `design.md`、`verification.md` 的矩阵同时满足。

| route | Figma Screen | 角色 / 隐私 | 主操作与下一步 | 优先级 |
|---|---|---|---|---|
| `home` | `03 Home / home` | 我 / `public-redacted` | 新建案件→`evidence`；收到传票→`respond`；待办→目标页 | P0 |
| `evidence` | `04 P0 Screens / evidence` | 我 / `private-me` | 选证据、保留草稿→`statement` | P0 |
| `statement` | `04 P0 Screens / statement` | 我 / `private-me` | 输入/转写陈述→`accept` | P0 |
| `accept` | `04 P0 Screens / accept` | 我 / `private-me` + 脱敏 | 确认受理/修改→`preview` 或 `reply` | P0 |
| `reply` | `05 P1 Screens / reply` | 我 / `private-me` | 复制低风险回应→`preview` 或返回 | P1 |
| `preview` | `04 P0 Screens / preview` | 我 / 脱敏 | 核对可见范围、附言→`share` | P0 |
| `share` | `04 P0 Screens / share` | 我 / `public-redacted` | 发送/复制口令→`waiting` | P0 |
| `waiting` | `04 P0 Screens / waiting` | 我 / `public-redacted` | 查看进度、重试或进入演示下一步 | P0 |
| `respond` | `04 P0 Screens / respond` | TA / `private-ta` + 脱敏 | 校验邀请、开始应诉→`their-statement` | P0 |
| `their-statement` | `04 P0 Screens / their-statement` | TA / `private-ta` | 输入 TA 陈述→`interview` | P0 |
| `interview` | `04 P0 Screens / interview` | 当前一方 / 私密 | 回答私密追问→`trial` | P0 |
| `trial` | `04 P0 Screens / trial` | 双方 / `joint` | 等待/开庭进度→`verdict` | P0 |
| `verdict` | `04 P0 Screens / verdict` | 双方 / `joint` | 查看判决→`pact`、`poster` 或复问 | P0 |
| `poster` | `05 P1 Screens / poster` | 双方 / `public-redacted` | 生成/保存脱敏海报→Home/History | P1 |
| `pact` | `04 P0 Screens / pact` | 双方 / `joint` | 双方选择并确认→`pebble`/`review`/Home | P0 |
| `pebble` | `05 P1 Screens / pebble` | 双方 / `joint` | 发送/接收石子→Home 或重新开庭 | P1 |
| `history` | `05 P1 Screens / history` | 我/双方 / `public-redacted` | 打开案件卡→`case-detail`；删除/复盘 | P0 入口 / P1 完整 |
| `case-detail` | `04 P0 Screens / case-detail` | 我/TA/双方 / 脱敏或共同 | 展示状态、双方进度、唯一主操作→目标页 | P0 |
| `review` | `05 P1 Screens / review` | 双方 / `joint` | 复盘选择/提交→Home/History | P1 |
| `profile` | `05 P1 Screens / profile` | 我/双方 / 脱敏或共同 | 查看模式、删除或清空→Home | P1 |

每个页面实现前必须补齐：`route / entry / actor / privacyScope / requestState / persistenceState / runtimeMode / failureRetry / backCancel / dataSaved / qaSelectors / priority`。

## 用户流程与状态变化

```text
普通打开
  ├─ 有传票/分享上下文 → respond
  └─ 无上下文 → home
       ├─ first-use → evidence → statement → accept → preview → share
       ├─ action-center → 当前唯一主任务
       └─ relationship-home → history / case-detail

share → waiting → respond → their-statement → interview → trial → verdict → pact
```

Home 只展示一个首要操作，优先级为：已应诉可开庭 → 判决待查看 → 约定待确认 → 到期复盘 → 石子提醒 → 自己已完成未发传票 → 等待 TA → 最近案件/新建入口。

## 状态枚举

```text
RequestState = idle | loading | success | failed | timeout | offline
PersistenceState = unsaved | saving | saved | draft-preserved | save-failed
RuntimeMode = cloud | mock | fallback
PrivacyScope = private-me | private-ta | joint | public-redacted
InviteState = valid | invalid | self | unauthorized | closed
DeletionState = idle | confirming | deleting | failed-retryable | deleted
PermissionState = unknown | granted | denied | blocked
ActorProgress = me-pending | me-done | ta-pending | ta-done | both-done | absent
RecoveryState = restoring | draft-preserved | missing-case | unauthorized | version-conflict | expired | deleted
```

安全状态采用本 Spec 的 canonical 命名：

```text
SafetyState = normal | concern | blocked | support
```

与既有文档的映射为：`none→normal`、`caution→concern`、`intervene→blocked`、`help→support`。`expired / revoked / bound` 邀请状态只作为后端字段具备后的设计预留，不得在当前实现中猜测。

## 完成定义

- 20 个 route 都有可追溯的 Figma Screen、主态、关键系统态、组件、隐私和 QA 选择器。
- Figma Token/Typography 与前端变量有逐项映射；运行时 Token 与 handoff-board Token 的差异已明确。
- 公共组件契约可映射到原生微信小程序 props/state，不依赖新 UI 框架。
- P0 主流程、Home 三态、Case Detail、失败重试、草稿保留、隐私隔离和返回兜底都有可执行验收场景。
- 首轮只在本地 mock/fallback 验证；任何云端、真机、双设备和真实数据结论单独标注。
- Spec-only 阶段不产生代码或 Figma 变更。
