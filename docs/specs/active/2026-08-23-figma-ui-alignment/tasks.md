# Tasks：Figma UI 对齐与交互结构落地

本清单是本轮及后续代码实现 TODO。Spec/Plan 已完成，当前代码实现已完成 Foundation 与 P0 首轮切片；每个任务必须有单一结果、明确文件范围和可复现验证。

## Spec 阶段

- [x] T0 冻结只读边界；文件：本目录六份文档；验收：不改 Figma、不覆盖既有文档；验证：检查新增文件、代码 dirty 状态和 Figma 工具调用记录。
- [x] T0.1 核对 route 基线；文件：`app.json`、`context.md`、`spec.md`；验收：以当前 20 个 route 为准并标明旧 19 页口径；验证：逐项核对页面目录。
- [x] T0.2 提炼 Figma 证据；文件：`design.md`、`verification.md`；验收：区分运行时 UI Token 与 handoff-board 文档 Token；验证：回溯用户附件。

## 实现前冻结

- [ ] T1 建立 20 页 route ↔ Figma Screen 映射；文件：`app.json`、页面契约、Figma 只读证据；验收：每页具备入口、角色、隐私、主操作、返回、保存、失败和优先级；验证：静态 route 表。
- [ ] T2 完成 Token/Typography 审计；文件：`app.wxss`、页面 WXSS、`design.md`；验收：运行时 Token、文档 Token、旧变量有明确映射；验证：Token 对照表和 390×844 截图。
- [ ] T3 冻结状态和数据协议；文件：状态模块、`utils/casedb.js`、`utils/case-router.js`；验收：统一 Request/Persistence/Runtime/Privacy/Invite/Safety/Recovery/Deletion/Permission/ActorProgress；验证：Mock 状态矩阵。
- [ ] T4 冻结 qa 选择器；文件：20 页 WXML、`verification.md`；验收：主 CTA、输入、状态、retry、返回出口都有语义 `qa-*`；验证：MCP 可定位，不依赖坐标/索引。

## 公共组件

- [ ] T5 抽取 `PageScaffold`；文件：`components/page-scaffold/`、页面；验收：home/detail/chat 三种 TopBar、安全区、返回兜底一致；验证：三页编译和路由断言。
- [ ] T6 抽取 `Button`、`Chip`、`Field`、`BottomActionBar`；文件：`components/`、app.wxss；验收：primary/secondary/destructive/disabled/loading 和 field 四态与 Figma 对齐；验证：重复点击、键盘、安全区。
- [ ] T7 抽取 `AsyncStatePanel`、`PrivacyNotice`、`RecoveryPanel`、`PermissionPrompt`、`InviteStatePanel`；文件：`components/`；验收：状态不伪成功，权限/隐私/恢复出口完整；验证：失败、离线、权限拒绝和邀请异常。
- [ ] T8 统一 `CaseStatus`、`ActorProgress`、`CaseCard`、`ChatBubble`、`CatJudge`；文件：`components/`、相关页面；验收：props/state 与本 Spec 一致，私密范围不越界；验证：Home、Case Detail、Interview、Verdict。

## 页面与流程

- [ ] T9 改造 Home 三态；文件：`pages/home/`、数据 View Model；验收：first-use/action-center/relationship-home 只显示一个主任务；验证：空、待办、历史、云失败、Mock 五态。
- [ ] T10 改造 History → Case Detail；文件：`pages/history/`、`pages/case-detail/`；验收：以 `docId` 打开正确案件，缺失/无权/冲突走恢复态；验证：A/B 连续打开不串案。
- [ ] T11 落地 P0 立案主链路；文件：`evidence/statement/accept/preview/share/`；验收：隐私提示、草稿保留、AI/云失败和邀请输出完整；验证：本地 Mock 闭环。
- [ ] T12 落地 P0 应诉与审理链路；文件：`waiting/respond/their-statement/interview/trial/verdict/pact/`；验收：双方进度、私密隔离、超时、暂停和约定冲突完整；验证：单设备演示与独立双设备待验证。
- [ ] T13 落地 P1 页面；文件：`reply/poster/pebble/review/profile/`；验收：生成、权限、删除、额度和复盘状态可恢复；验证：P1 短场景。

## 验证与交付

- [ ] T14 静态检查；证据：全量 `node --check`、JSON 解析、20 route 文件存在、无新增控制台错误。
- [ ] T15 Mock 冒烟；证据：Home 三态、P0 主流程、失败重试、草稿保留、返回 Home、Case Detail 不串案。
- [ ] T16 MCP 行为验证；证据：按 AGENTS 规定记录入口、操作、预期路由/数据、实际结果和截图；截图串行。
- [ ] T17 视觉 QA；证据：Token/Typography/组件/390×844 页面截图与 Figma 只读导出对照。
- [ ] T18 真机/双设备/云端分层验证；证据：单独标记 `Real verified` 或 `Blocked`，不从 Mock 推导真实能力。
- [x] T14 静态检查；证据：全量 `node --check`、JSON 解析、WXML 标签检查、`git diff --check` 已通过。
- [ ] T15 Mock 冒烟；当前阻塞：DevTools 无活动页面，需先手动编译/启动。
- [ ] T16 MCP 行为验证；当前阻塞：`mp_ensureConnection` 健康但 `currentRoute=null`，导航返回 automator undefined 错误。
- [ ] T17 视觉 QA；等待 DevTools 页面和串行截图。
- [ ] T18 真机/双设备/云端分层验证；未授权且未执行。
- [x] T19 更新本 Spec 的 `verification.md`；已记录真实静态结果、DevTools 连接状态和阻塞证据。

## 本轮实现进度

- [x] Foundation：运行时 Token、Typography alias、安全区和旧 class 兼容层。
- [x] 公共组件初版：`PageScaffold`、`BottomActionBar`、`AsyncStatePanel`、`PrivacyNotice`、`CaseStatus`、`ActorProgress`、`RecoveryPanel`、`InviteStatePanel`。
- [x] Home / evidence / statement：视觉结构、loading/disabled、隐私提示、`qa-*` 选择器。
- [x] P0 主流程：accept、preview、share、waiting、respond、their-statement、interview、trial、verdict、pact、history、case-detail。
- [ ] P1 页面：reply、poster、pebble、review、profile 的完整 QA selector 和系统状态仍待后续切片。
- [ ] 公共组件尚未逐页注册接入；当前页面保留兼容的页面级结构。

## 当前阻塞

- 运行时 Token 与 handoff-board Token 需要实现前冻结映射。
- 真机权限、双设备、云端数据和 `expired/revoked/bound` 邀请状态不在本轮可假设范围。
- DevTools 当前没有活动页面，导致 MCP 导航和 Mock 冒烟未闭环；不能把静态检查或连接健康表述为编译/运行时通过。

## 下一步

从 T1–T4 开始；任何代码修改前先报告具体文件范围，并再次确认 Figma 保持只读。
