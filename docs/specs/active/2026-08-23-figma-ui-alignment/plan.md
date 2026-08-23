# 技术 Plan：Figma UI 对齐与 Spec 驱动实现

## 计划边界

本文件描述后续代码落地方式；本轮只写文档，不执行下列代码修改。

### 允许后续修改的范围

- `07-代码/miniprogram-demo/app.wxss`：Token/Typography 和兼容 class。
- `components/`：公共 UI 组件与 `components/cat/` 契约。
- 20 个 `pages/*` 的 WXML/WXSS/JS/JSON：只做视觉、交互、状态投影和稳定选择器接入。
- 必要的 `utils/navigation.js`、`utils/case-router.js`、`utils/casedb.js`：只为 route、状态和结果协议提供支撑。
- 相关 `docs/specs/active/2026-08-23-figma-ui-alignment/` 验证记录。

### 明确不修改

- Figma 文件及其节点、组件、变量和 Prototype。
- `cases`、`pebbles`、`patterns` 数据结构。
- AI Prompt、模型供应商、真实外部 AI 调用。
- 账户、情侣绑定、支付、发布和生产云权限。
- 与本功能无关的既有文档；如需补充，只新增链接或另开 Spec。

## 实现分层

```text
Figma 只读证据
  → Token/Typography 审计
  → 公共组件契约
  → 页面 View Model / 状态投影
  → route / back / recovery
  → mock-first 验证
  → 视觉与行为验收
```

### 阶段 0：冻结契约

1. 以 `app.json` 核对 20 个 route，并修正旧文档中的 19 页历史口径。
2. 对运行时 Token、handoff-board Token、现有 `app.wxss` 变量做逐项审计；先冻结最终映射，再批量改样式。
3. 冻结状态枚举、隐私范围、QA 选择器命名和返回兜底规则。

### 阶段 1：公共视觉基础

1. 在不破坏旧 class 的前提下，对齐 `page`、文字、卡片、按钮、chip、field、底部操作栏和 safe-area。
2. 抽取 `PageScaffold`、`BottomActionBar`、`AsyncStatePanel`、`PrivacyNotice`、`RecoveryPanel`、`CaseStatus`、`ActorProgress`。
3. 统一 `CatJudge` 的 `mood / motion / size`，清理页面内联 thinking 猫脸的重复实现。

### 阶段 2：P0 页面和主流程

按 `home → evidence → statement → accept → preview → share → waiting/respond → their-statement → interview → trial → verdict → pact` 推进。每页先完成正常态和失败/保存态，再接下一页，避免只做静态截图。

### 阶段 3：Home/History/Case Detail

- Home 使用 `first-use / action-center / relationship-home` View Model，只呈现一个主任务。
- History 点击案件必须携带 `docId` 进入 `case-detail`。
- Case Detail 只读安全投影，由 `case-router` 计算状态和唯一主操作；案件缺失、无权限、版本冲突走 `RecoveryPanel`。

### 阶段 4：P1 与系统状态

补齐 `reply / poster / pebble / review / profile`，并覆盖权限、邀请、删除、安全暂停、离线、超时、Mock/Fallback 和约定冲突。

## 状态与数据流

- 页面请求统一输出 `{ ok, data, source, error }`，页面通过 `RequestState` 和 `RuntimeMode` 表达结果来源。
- 写入流程先显示 `unsaved/saving`，成功后才进入 `saved`；失败时保留 `draft-preserved` 或 `save-failed`，不跳转伪成功页。
- 本地 mock 与 fallback 必须有可识别但克制的演示标记；不得伪造真实云端时间线、双设备或对方行为。
- 读取历史案件必须以 `docId` 为主键，不能从 `app.globalData.caseData` 猜测当前案件。
- 所有主 CTA 需要幂等锁；网络错误、超时和 AI 格式错误都必须释放锁并提供 retry/back。

## 依赖与实施顺序

```text
T1 route/页面契约
  ↓
T2 Token/Typography 审计
  ↓
T3 状态与隐私枚举
  ↓
T4 公共组件
  ↓
T5 Home/History/Case Detail
  ↓
T6 P0 主流程
  ↓
T7 P1 与系统状态
  ↓
T8 mock-first / MCP / 视觉验收
```

任何阶段如果发现 Figma 与业务/隐私契约冲突，以用户当前边界、AGENTS.md、数据权限和本 Spec 为准，并在 `verification.md` 记录偏差；不要通过修改 Figma 来“修正”实现。

## 验证方案

- 静态：`node --check` 全量 JS；定向解析 JSON；校验 `app.json` 的 20 个 route 和文件存在；检查 `qa-*` 选择器字符串。
- 微信开发者工具：编译、控制台无新增错误；逐页检查 390×844 参考下的溢出、安全区和字体。
- MCP：`mp_ensureConnection` → 失败时 `mp_healthCheck` → 仅 `needsRecovery=true` 时 recover → 结构化读取/点击 → `page_waitRoute` 或数据断言；截图串行。
- Mock 场景：Home 三态、P0 主链路、失败重试、草稿保留、邀请异常、Case Detail 不串案、返回 Home。
- 真机/双设备/云端/权限：独立标记为未验证或 Real verified，不能从 Mock 证据推导。

## 回滚方式

- 代码阶段仅允许回滚本 Spec 明确的文件；保留用户已有未提交改动，不使用破坏性 git 命令。
- Token 迁移采用兼容变量和分阶段页面切换，若视觉回归失败可恢复页面级引用，不改数据和路由。
- Figma 始终不需要回滚，因为本计划不允许写入 Figma。

## 可直接使用的 Goal Prompt

```text
你负责将判判原生微信小程序的 UI 与 Figma 设计稿对齐。开始前必须阅读：
1. /Users/chenbuyu/Documents/Codex/20260822_panpan/AGENTS.md
2. /Users/chenbuyu/Documents/Codex/20260822_panpan/07-代码/miniprogram-demo/AGENTS.md
3. 本目录 context.md、spec.md、design.md、plan.md、tasks.md、verification.md
4. 既有 docs/specs/active/2026-08-23-home-entry-experience/ 全套文档

硬边界：Figma 只读，绝不创建/移动/删除/修改 Figma 节点；默认本地 mock-first；不接生产云、真实外部 AI、支付、真实用户数据、上传、提审或发布；保留用户已有未提交改动；修改前先报告代码文件范围。

按 Spec 模式执行：先核对 app.json 的 20 个 route，再冻结运行时 Token/Typography、状态枚举、组件 props/state 和 qa-* 选择器；然后按公共组件 → Home 三态/History/Case Detail → P0 主流程 → P1 页面 → 系统状态的顺序落地。不得把 handoff-board 文档画布颜色直接当作小程序运行时颜色，先完成 Token 审计。

每个页面必须实现/记录：默认态、loading、failed/timeout/offline、draft-preserved/save-failed、privacyScope、runtimeMode、back/cancel、retry、唯一主 CTA 和稳定 qa-* 选择器。Home/History/Case Detail 不得显示对方原话、截图原图、语音原文或未经脱敏的模型输入；邀请异常不得泄露案件存在性；安全风险必须优先进入暂停/退出/求助状态。

每完成一个阶段都做相称验证：node --check、JSON/route 校验、微信开发者工具编译；MCP 按 mp_ensureConnection → mp_healthCheck（需要时 recover）→ 结构化操作 → 路由/数据断言执行。截图串行。最终在 verification.md 记录修改范围、入口、操作、预期、实际、证据和是否需要人工真机确认。不要把 Code implemented、Static checked、Mock verified、Real verified 混写。
```
