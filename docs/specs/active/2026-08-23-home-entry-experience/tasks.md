# Tasks：关系首页与案件回访入口

每个任务应有单一结果、明确文件范围和可执行验证。

> 当前执行口径：品牌视觉与产品 UI 使用两个独立 Figma 文件。品牌文件只维护品牌定义与规范；`20260822_panpan_UI_design` 维护 UI 基础、组件、页面、状态、Prototype 和前端 Handoff。

> 执行原则：先基于现有代码完成页面与组件盘点，再结合品牌视觉形成最终 UI 稿；设计盘点与技术前置可以并行，最终页面契约、状态和 Handoff 合并后再进入前端改造。

## 并行工作分组

以下任务之间依赖较少，可以并行推进：

- **A｜代码页面盘点**：核对 `app.json`、页面路由、现有页面结构，建立代码页面 ↔ Figma 页面映射；重点包含 Home 三态。
- **B｜代码组件盘点**：核对 `components/`、页面内联结构和重复样式，形成现有组件 ↔ UI 组件映射。
- **C｜UI 基础准备**：基于品牌视觉整理 UI Token、字体、间距、圆角、页面骨架和组件视觉方向。
- **D｜技术前置**：推进 T0/T0.1 权限校验和统一数据结果协议；为页面状态和前端 Handoff 提供边界。

合并依赖：A/B/C 完成初版盘点后，冻结 T1–T3，才能把页面、组件和状态合并为最终 UI 设计稿；D 不阻塞第一版视觉盘点，但阻塞最终交互和前端实现验收。

## P0 技术前置

- [ ] T0 案件云函数成员权限校验；文件：`cloudfunctions/casedb/index.js`；验收：`get`、`patterns`、`timeline`、写入类 action、`destroy` 均有成员/所有者校验，`receivePebble` 校验接收方；验证：案件成员、非成员、石子发送方三类账号/Mock 场景。
- [ ] T0.1 统一前端数据结果协议；文件：`utils/casedb.js`、Home/History 消费层；验收：区分云端空数据、业务失败、网络失败、Mock、fallback 和草稿保留；验证：`{ ok, data, source, error }` 五类结果。

- [ ] T1 冻结 19 页路由与案件状态到用户动作的映射；文件：`utils/case-router.js`、本功能 `context.md`；验收：覆盖 created/responded/tried/closed、pact、review、hasB、inbox；验证：本地 Mock 和至少一份云端投影样本逐条核对。
- [ ] T2 建立页面契约表；文件：本功能 `context.md`、`verification.md`、设计 Figma UI Contract；验收：19 个页面均记录 route、entry、actor、privacy、async、failure、back、saved、qa-selector、priority。
- [ ] T3 建立跨页面状态枚举；文件：`utils/case-router.js` 或公共状态模块、组件契约文档；验收：统一 `RequestState`、`PersistenceState`、`RuntimeMode`、`PrivacyScope`、`InviteState`、`SafetyState`、`DeletionState`、`PermissionState`、`ActorProgress`。
- [ ] T4 建立 Home View Model 和三态切换；文件：`pages/home/home.js`、`pages/home/home.wxml`、`pages/home/home.wxss`；验收：first-use/action-center/relationship-home 均可进入；验证：本地切换数据后截图和路由断言。
- [ ] T5 调整 Home 读取策略；文件：`pages/home/home.js`、`utils/casedb.js`；验收：并行读取 `myCases()`、`inbox()`，区分空数据、失败、Mock 回退和草稿保留；验证：云端成功、空数据、失败三种场景。
- [ ] T6 改造卷宗列表与状态摘要；文件：`pages/history/history.js`、`pages/history/history.wxml`、`pages/history/history.wxss`；验收：19 页范围内的历史入口按状态进入正确目标页；验证：未发传票、等待应诉、已判决、待复盘、已复盘、约定冲突。
- [ ] T7 抽取工程化系统组件；文件：`components/`、相关页面；验收：`PageScaffold`、`BottomActionBar`、`AsyncStatePanel`、`PrivacyNotice`、`InviteStatePanel`、`RecoveryPanel`、`CaseStatus`、`ActorProgress`、`PermissionPrompt` 等至少形成可复用契约。
- [ ] T8 统一 CatJudge；文件：`components/cat/`、问话页内联结构；验收：支持 `mood / motion / size`，thinking 猫脸不再单独维护；验证：Home、Interview、Waiting、Poster 至少四处复用。
- [ ] T9 统一返回与完成节点；文件：`utils/navigation.js`、相关流程页；验收：流程内返回上一步，顶层页和完成页回 Home，空页面栈能兜底；验证：Home→流程、History→目标页、分享直达三条路径。
- [ ] T10 补齐系统状态和安全边界；文件：相关 WXML/WXSS、组件；验收：隐私同意、AI/云端失败、权限拒绝、邀请异常、删除流程、冷启动恢复、安全干预和约定冲突都有表达；验证：至少覆盖失败重试、草稿保留和安全暂停。
- [ ] T11.1 完成代码页面 ↔ Figma 页面映射；文件：`app.json`、本功能 `page-contracts.md`、`09-UI设计需求.md`、独立 UI Figma；验收：19 个注册页面均有对应 Figma 页面、route、priority 和状态入口，Home 三态单独标记。
- [ ] T11.2 完成现有组件 ↔ UI 组件映射；文件：`components/`、相关页面、独立 UI Figma；验收：现有组件、内联结构和重复样式均标记为复用、抽取、替换或暂不处理。
- [ ] T11.3 完成 UI Foundation 与组件图；文件：独立 UI Figma 的 `01 UI Foundations`、`02 Components`；验收：Token、Typography、Button、Card、Chip、Field、Navigation、状态组件和 CatJudge 具备可复用 Variant。
- [ ] T11.4 完成 Home 与 P0 Screens；文件：独立 UI Figma 的 `03 Home`、`04 P0 Screens`；验收：Home 三态、P0 主流程、关键系统态和页面契约字段齐全。
- [ ] T11.5 完成 Prototype 与前端 Handoff；文件：独立 UI Figma 的 `06 System States`、`07 Prototype`、`08 Handoff`、`verification.md`；验收：三条 Prototype、qa 标注、组件/Token 映射和前端实现约束齐全。
- [ ] T12 完成 Home / History 视觉实现；文件：相关 WXML/WXSS、公共样式或组件；验收：遵守奶油纸、黑色主按钮、陶土/蜜色/抹茶状态规范；验证：微信开发者工具截图检查无溢出和重叠。
- [ ] T13 静态检查和运行时验证；文件：本功能 `verification.md`、`docs/status.md`；验收：记录命令输出、入口、操作、预期和实际结果；验证：`node --check`、`jq`、开发者工具编译、MCP 冒烟。
- [ ] T14 更新项目技术文档；文件：`docs/technical-architecture.md`、`docs/status.md`；验收：补充 Home View Model、19 页契约、状态组件、路由工具和数据流；验证：链接和 Mermaid/代码块可读。

## 当前阻塞

- 尚未确认分享入口最终传递 `docId`、案件口令还是微信场景值。
- 尚未确认真实云端案件样本是否覆盖所有状态组合。
- 尚未确认隐私同意、AI 数据处理说明和安全干预的最终文案与渠道。
- 品牌 Figma 基础已存在；独立 UI Figma 的页面映射、UI Foundation、19 页 Screens、系统态和 Prototype 尚未完整交付。
- 尚未进行微信开发者工具和双设备运行时验证。
- 本功能尚未开始代码实现。

## 下一步

1. 并行完成 A/B/C/D 四组盘点与技术前置。
2. 汇总 A/B/C 结果，冻结 T1–T3 的路由、页面契约和状态枚举。
3. 在独立 UI Figma 中先完成 UI Foundation、组件图和 Home 三态。
4. 继续完成 P0 Screens、系统状态和三条 Prototype。
5. 检查 Figma 组件与前端组件、Token、状态 props 的可实现映射。
6. 再进入前端组件和页面改造；每完成一页或一个系统态，立即补充验证证据。
