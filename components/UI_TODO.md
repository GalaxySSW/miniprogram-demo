# 判判 UI 公共层 TODO

已完成：

- [x] 在 `app.wxss` 固化 Figma handoff 的颜色 Token、2x rpx 排版 Token 和旧 class 兼容层。
- [x] 新增 `PageScaffold`、`BottomActionBar`、`AsyncStatePanel`、`PrivacyNotice`、`CaseStatus`、`ActorProgress`、`RecoveryPanel`、`InviteStatePanel`。
- [x] 所有新组件提供稳定 `qaId` 属性和 `data-qa` 选择器。
- [x] 保留 `components/cat` 的现有 props、class 和注册路径。
- [x] 完成 JSON/JS 静态检查。

待页面接入（本次按范围未修改 pages）：

- [ ] 在各页面 JSON 注册需要的公共组件，并将页面根布局迁移到 `PageScaffold`。
- [ ] 把固定底部操作迁移到 `BottomActionBar`，同步补充内容底部留白。
- [ ] 为网络请求页接入 `AsyncStatePanel` / `RecoveryPanel`，统一 loading、empty、error、timeout、offline。
- [ ] 为案件列表、详情和流程页接入 `CaseStatus` / `ActorProgress`。
- [ ] 按实际业务权限接入 `PrivacyNotice` 和 `InviteStatePanel`，由页面负责持久化和提交校验。
- [ ] 用微信开发者工具编译，并用 `weapp-agent-mcp` 串行验证 `data-qa`、路由、状态切换和截图。
- [ ] 页面级内联样式仍需后续逐页收敛；本次没有越过用户限定范围修改 pages。

验收边界：公共组件本轮只验证静态结构、脚本语法和文件范围；未宣称已完成页面视觉回归、真机验证或真实数据链路验证。
