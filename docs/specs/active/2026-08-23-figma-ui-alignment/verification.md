# Verification：Figma UI 对齐与交互结构 Spec

- 日期：2026-08-23
- 环境：本地仓库、微信开发者工具连接（自动化端口 9420）；未调用 Figma 写入能力
- 结论阶段：Spec/Plan、Foundation 和 P0 代码已落地；静态检查通过；DevTools 当前无活动页面，MCP 导航被阻塞

## 本轮修改范围

本轮新增/修改：

- `docs/specs/active/2026-08-23-figma-ui-alignment/context.md`
- `docs/specs/active/2026-08-23-figma-ui-alignment/spec.md`
- `docs/specs/active/2026-08-23-figma-ui-alignment/design.md`
- `docs/specs/active/2026-08-23-figma-ui-alignment/plan.md`
- `docs/specs/active/2026-08-23-figma-ui-alignment/tasks.md`
- `docs/specs/active/2026-08-23-figma-ui-alignment/verification.md`

明确没有修改：

- Figma 文件、节点、变量、组件或 Prototype。
- 云环境、真实用户数据、支付、上传、发布配置。

工作区在本轮开始前已有多处未提交代码、组件和既有文档改动；这些改动保留在工作区，没有使用破坏性命令清理。与本轮 UI 变更重叠的文件按最终工作区内容统一校验。

## 已完成的只读检查

| 检查项 | 预期 | 实际结果 | 状态 |
|---|---|---|---|
| 规则读取 | 根 `AGENTS.md` 与小程序 `AGENTS.md` 可用 | 已读取并纳入边界、mock-first、MCP 和安全规则 | 通过 |
| route 基线 | `app.json` 与页面目录一致 | 当前 20 个 route，包含 `case-detail`；旧 19 页文档标为历史口径 | 通过 |
| 既有 Spec | 不覆盖原文档 | 以 `home-entry-experience` 为输入，新建独立 Spec 目录 | 通过 |
| Figma 附件 | 只读提炼 Token、Typography、组件和页面证据 | 已读取用户提供的 Handoff、Foundations、Button、Home、Evidence、Reply、Screen、Prototype 文本 | 通过 |
| Token 解释 | 区分运行时 UI 与 handoff-board 画布 | 已在 `context.md`、`design.md`、`plan.md` 中明确 | 通过 |
| Figma 写入 | 本轮不得写入 | 未执行任何 Figma 写入操作 | 通过 |
| JS 语法 | 业务代码无语法错误 | `find pages utils components cloudfunctions ... node --check` 通过 | 通过 |
| JSON 语法 | 项目 JSON 配置可解析 | 排除依赖目录后全量 `jq empty` 通过 | 通过 |
| WXML 结构 | 页面/组件标签成对闭合 | 归一化模板表达式后静态标签栈检查通过 | 通过 |
| diff 检查 | 无尾随空格/冲突标记 | `git diff --check` 通过 | 通过 |

## 20 route 验收矩阵（实现阶段）

| 场景组 | 覆盖范围 | 证据要求 | 当前状态 |
|---|---|---|---|
| Route/Screen | 20 route | `app.json`、Figma Screen、页面契约逐项对照 | Spec 已定义，代码未验证 |
| Home 三态 | `first-use/action-center/relationship-home` | 页面数据、主 CTA、路由和截图 | 未验证 |
| P0 立案链路 | `home → evidence → statement → accept → preview → share` | Mock 路由/数据断言、草稿、隐私提示 | 未验证 |
| P0 应诉链路 | `waiting/respond/their-statement/interview/trial/verdict/pact` | 双方状态、私密隔离、超时/暂停 | 未验证 |
| Case Detail | History/Home/inbox 携带 `docId` | A/B 连续打开不串案；缺失/无权/冲突恢复 | 未验证 |
| P1 页面 | `reply/poster/pebble/review/profile` | 权限、生成失败、删除、复盘、额度 | 未验证 |
| 系统状态 | loading/empty/failed/timeout/offline/draft/mock/fallback | 状态组件和恢复入口，不显示假成功 | 未验证 |
| 返回链路 | 流程内返回、顶层返回、栈为空 | `page_waitRoute` 和上下文保持 | 未验证 |
| 隐私边界 | Home/History/Case Detail/respond/interview | 不显示原话、原图、语音原文或未脱敏输入 | 未验证 |

## 状态枚举验收

| 契约 | canonical 值 | 验收点 | 当前状态 |
|---|---|---|---|
| `RequestState` | `idle/loading/success/failed/timeout/offline` | 请求失败、超时、离线可区分且可重试 | Spec 已定义，代码未验证 |
| `PersistenceState` | `unsaved/saving/saved/draft-preserved/save-failed` | 失败保留草稿，不跳伪成功 | Spec 已定义，代码未验证 |
| `RuntimeMode` | `cloud/mock/fallback` | UI 标识来源，不把 fallback 当云端成功 | Spec 已定义，代码未验证 |
| `PrivacyScope` | `private-me/private-ta/joint/public-redacted` | 页面和组件不得越权展示 | Spec 已定义，代码未验证 |
| `InviteState` | `valid/invalid/self/unauthorized/closed` | 错误不泄露案件存在性 | Spec 已定义，代码未验证 |
| `SafetyState` | `normal/concern/blocked/support` | 安全分支优先于普通和解 UI | Spec 已定义，代码未验证 |
| `RecoveryState` | restoring/draft-preserved/missing-case/unauthorized/version-conflict/expired/deleted | 有重试、回卷宗、回 Home | Spec 已定义，代码未验证 |
| `DeletionState` | idle/confirming/deleting/failed-retryable/deleted | 不误报删除完成 | Spec 已定义，代码未验证 |
| `PermissionState` | unknown/granted/denied/blocked | 相册/麦克风/保存权限可解释、可重试或跳过 | Spec 已定义，代码未验证 |
| `ActorProgress` | me-pending/me-done/ta-pending/ta-done/both-done/absent | 只呈现进度，不泄露私密内容 | Spec 已定义，代码未验证 |

## 实现阶段验证协议

1. 修改前记录文件范围，保留用户已有未提交改动。
2. 运行 `node --check`、定向 JSON 解析和 20 route 文件校验。
3. 微信开发者工具编译；只读异常诊断不得替代编译结果。
4. MCP 按 `mp_ensureConnection` → 失败时 `mp_healthCheck` → 仅 `needsRecovery=true` 时 `mp_recoverConnection` → 结构化读取/操作 → 路由/数据断言执行。
5. 截图串行，记录：修改范围、入口页面、操作、预期路由/数据/视觉、实际结果、截图/日志、是否需要人工真机确认。
6. 将结果分为 `Code implemented`、`Static checked`、`Mock verified`、`Real verified`、`Blocked`，不混写。

## 未验证事项与风险

- 本轮没有验证代码视觉是否已对齐 Figma；Spec 不是实现完成证明。
- 本轮没有运行微信开发者工具、MCP、真机、双设备、云函数或真实权限流程。
- 当前 `app.globalData`、mock fallback、Promise/固定延时和 `casedb` null 结果协议可能造成旧案串案、卡 loading 或假成功；实现阶段必须按 Plan 修正或明确隔离。
- 真机相册、麦克风、Canvas、保存相册和订阅权限仍需独立验证。
- `expired/revoked/bound` 邀请状态和完整安全转介不在当前实现承诺内。

## 本轮实际运行时验证

| 场景 | 预期 | 实际结果 | 状态 |
|---|---|---|---|
| `mp_ensureConnection` | 连接当前项目，端口 9420 | `connected`，`projectPath` 正确，`needsRecovery=false` | 通过 |
| `mp_healthCheck` | DevTools/WS/automator 全部可用 | 三项均可用，但 `currentRoute=null`，无活动页面 | 部分通过 |
| `reLaunch pages/home/home` | 进入 Home 并定位 `#qa-home-primary` | MCP 返回 `Cannot read properties of undefined (reading 'indexOf')`；未产生路由断言 | Blocked |
| `wx.reLaunch` | 通过微信 API 进入 Home | automator 响应超时；未继续重试或触碰恢复连接 | Blocked |

阻塞证据：DevTools 连接健康，但当前模拟器没有活动页面；本轮没有把连接健康误报为编译成功，也没有发送新的外部 AI 请求。需在微信开发者工具中手动完成一次本地编译/启动后，再复跑 Home 和 P0 短场景。

## 结论

`Spec documented` / `Figma read-only checked` / `Foundation implemented` / `P0 implemented` / `Static checked` / `Mock runtime blocked` / `Real not verified` / `Figma not modified`。
