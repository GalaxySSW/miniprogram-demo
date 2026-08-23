# 判判 UI 公共层技术 Plan

## 已完成

1. 盘点并保留 `components/cat` 的公开 props、class 和调用路径。
2. 在 `app.wxss` 增加 Figma Token、排版 Token、安全区和兼容旧 class 的基础样式。
3. 使用原生 WXML/JS/WXSS/JSON 拆出 8 个公共组件。
4. 为组件补齐最小 props、事件、状态 class、`data-*` 和 `data-qa` 契约。
5. 在允许的 `components/` 范围内沉淀 Spec、TODO 和可复用 Goal Prompt。

## 页面接入顺序

1. `PageScaffold` → 所有页面根布局与标题/返回结构。
2. `BottomActionBar` → evidence、statement、accept、preview、share、respond、trial、pact 等底部操作页。
3. `AsyncStatePanel` / `RecoveryPanel` → waiting、history、case-detail 和所有网络请求状态。
4. `CaseStatus` / `ActorProgress` → history、case-detail、waiting、trial、verdict。
5. `PrivacyNotice` / `InviteStatePanel` → evidence、share、accept 和邀请相关流程。

## 验证门槛

- 静态：JSON 可解析、JS 可检查、WXML 标签/绑定可编译、WXSS 不依赖未授权目录。
- 编译：微信开发者工具本地编译通过，无 WXML/WXSS/JS 控制台错误。
- 运行：每个页面至少验证默认态、loading、空态、失败/超时/offline、重试和返回。
- 交互：逐个验证 `data-qa` 定位、事件回传、底部安全区和长文本不截断。
- 视觉：模拟器截图与 Figma handoff 对照；真机确认安全区和字体渲染差异。

本轮因为不修改 `pages/`，只完成公共层和接入契约，不宣称页面已经完成视觉回归。
