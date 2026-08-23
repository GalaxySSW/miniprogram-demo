# Verification：Figma UI 对齐与交互结构 Spec

- 日期：2026-08-23
- 环境：本地仓库、微信开发者工具连接（自动化端口 9420）；未调用 Figma 写入能力
- 结论阶段：Spec/Plan、Foundation 和 P0 首轮代码已落地；真实 DevTools 编译通过；Home/创建案件首段 MCP 冒烟和首轮视觉截图通过；P0 全链路与 P1 仍待继续验证

## 本轮修改范围

本轮新增/修改：

- `docs/specs/active/2026-08-23-figma-ui-alignment/context.md`
- `docs/specs/active/2026-08-23-figma-ui-alignment/spec.md`
- `docs/specs/active/2026-08-23-figma-ui-alignment/design.md`
- `docs/specs/active/2026-08-23-figma-ui-alignment/plan.md`
- `docs/specs/active/2026-08-23-figma-ui-alignment/tasks.md`
- `docs/specs/active/2026-08-23-figma-ui-alignment/verification.md`
- `components/recovery-panel/recovery-panel.wxml`（修复真实编译错误）
- `assets/brand/panpan-mascot.svg`、`assets/brand/panpan-logo-lockup.svg`、`assets/brand/panpan-logo-lockup-full.svg`（本地固定品牌资产）
- `pages/home/home.wxml/.wxss/.js/.json`（Home 首轮视觉与交互结构）
- `visual-gap-matrix.md`（逐页差异与资产策略）
- 默认导航页与两个 custom navigation 页的返回/系统胶囊校对。

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
| WXML 结构 | 页面/组件标签成对闭合 | 归一化模板表达式后静态标签栈检查通过；DevTools 又发现并修复 `wx:else"` 属性错误 | 通过 |
| diff 检查 | 无尾随空格/冲突标记 | `git diff --check` 通过 | 通过 |

## 20 route 验收矩阵（实现阶段）

| 场景组 | 覆盖范围 | 证据要求 | 当前状态 |
|---|---|---|---|
| Route/Screen | 20 route | `app.json`、Figma Screen、页面契约逐项对照 | Spec 已定义，首段已验证 |
| Home 三态 | `first-use/action-center/relationship-home` | 页面数据、主 CTA、路由和截图 | Home 当前 mock 状态已验证；其余状态待验证 |
| P0 立案链路 | `home → evidence → statement → accept → preview → share` | Mock 路由/数据断言、草稿、隐私提示 | `home → evidence → statement` 已验证；后续页面待验证 |
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

- 本轮已完成 Home 和 Statement 的模拟器视觉初检，但还没有完成 20 route 的逐页视觉对照；Spec 不是全量实现完成证明。
- 本轮已运行微信开发者工具、MCP 和本地 mock 首段；真机、双设备、云函数和真实权限流程仍未执行。
- 当前 `app.globalData`、mock fallback、Promise/固定延时和 `casedb` null 结果协议可能造成旧案串案、卡 loading 或假成功；实现阶段必须按 Plan 修正或明确隔离。
- 真机相册、麦克风、Canvas、保存相册和订阅权限仍需独立验证。
- `expired/revoked/bound` 邀请状态和完整安全转介不在当前实现承诺内。

## 本轮实际运行时验证

| 场景 | 预期 | 实际结果 | 状态 |
|---|---|---|---|
| `mp_ensureConnection` | 连接当前项目，端口 9420 | 重启后恢复；`projectPath` 正确，`currentPage=pages/home/home` | 通过 |
| `mp_healthCheck` | DevTools/WS/automator 全部可用 | `devtoolsOnline=true`、`wsReachable=true`、`automatorConnected=true`、`currentRoute=pages/home/home`、无 errors | 通过 |
| DevTools 编译 | WXML/WXSS/JS 编译无错误并显示模拟器 | 首次发现 `components/recovery-panel/recovery-panel.wxml:2:146` 的 `wx:else"`；修复后模拟器成功显示 Home，错误计数为 0 | 通过（含修复） |
| Home smoke | Home 路由和主入口可定位 | `#qa-home-primary`、`#qa-home-history`、`#qa-home-summons` 均可见；snapshot 读取文字/尺寸和 mock 数据 | 通过 |
| Home → Evidence | 主 CTA 进入证据页 | `pages/evidence/evidence`，`#qa-evidence-picker`、`#qa-evidence-skip`、`#qa-evidence-privacy` 均可见 | 通过 |
| Evidence → Statement | 跳过截图进入陈述页 | `pages/statement/statement`；`#qa-statement-field-what`、隐私提示、提交按钮可见 | 通过 |
| Statement input | 输入写入页面状态并渐进披露 | 输入后 `answers.what` 等于测试文本，`#qa-statement-field-hurt` 出现 | 通过 |
| 串行截图 | 获取真实模拟器视觉证据 | Home 桌面截图与 Statement MCP 截图成功；Statement 截图显示问题卡、隐私提示、CTA、语音 dock | 通过 |
| Home 二轮截图 | 主 CTA 满宽、长案情不撑破、进行中案件隐藏次级入口 | `#qa-home-primary` 为 `386×59px`；案件标题单行省略；`/tmp/home-figma-compare-v2.png` 已生成 | 通过 |
| 导航双返回扫描 | 默认导航页不再出现页面内返回；custom 页只有一套固定返回 | 静态 `navigation-back-scan: ok (20 routes)`；MCP `accept/evidence/statement` 抽查通过；custom 页无 `.page-capsule` | 通过 |
| 20 route 导航回归 | 20 个 route 均可 reLaunch，最终路由可断言 | `mp_runScenario` 21/21 steps passed；最终 `pages/profile/profile` 断言通过，随后单独 `reLaunch pages/home/home` 稳定返回 Home | 通过 |
| DevTools 健康检查 | 连接、WS、automator 正常且无新增错误 | `devtoolsOnline=true`、`wsReachable=true`、`automatorConnected=true`、`needsRecovery=false`、warnings/errors 为空 | 通过 |
| Statement 溢出修复 | 渐进按钮、提交按钮、语音按钮不撑破内容区；长输入可滚动 | MCP 结构化尺寸：提交/渐进按钮 `376px`，语音 dock `430px`；`node --check` 和 `git diff --check` 通过 | 通过（截图需单独人工复核） |

阻塞/边界：P0 后续页面、P1 页面、真机/双设备和真实云端能力仍未验证；本轮没有发送新的外部 AI 请求，也没有把模拟器结果表述为真实敏感数据可用。

## 结论

`Spec documented` / `Figma read-only checked` / `Foundation implemented` / `P0 first slice implemented` / `Static checked` / `DevTools compiled` / `Mock first slice verified` / `Visual first pass verified` / `P0 full flow pending` / `Real not verified` / `Figma not modified`。
