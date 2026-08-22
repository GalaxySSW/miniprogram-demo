# Context：关系首页与案件回访入口

## 当前基线

- 项目：原生微信小程序 MVP。
- 分支：`rainno`。
- 基线提交：`bb582bf`。
- 默认演示入口：`pages/home/home`。
- 当前已注册页面：19 个。
- 当前数据层：`utils/casedb.js` + `cloudfunctions/casedb`。
- 当前本地回退：`app.globalData.caseData`、`app.globalData.verdict` 和本地 Mock。

## 已确认的现状

1. Home 已经存在，包含立案、输入传票、站内提醒和未发传票案件。
2. History 已经存在，云端通过 `myCases()` 查询案件，失败时保留本地 Mock。
3. `casedb.myCases()` 已返回状态、双方身份、判决、约定、复盘和案件编号等安全投影。
4. `casedb.inbox()` 已返回应诉、判决、约定、复盘和石子提醒。
5. History 当前点击案件后基本直接进入 Verdict，未形成统一的案件状态详情页。
6. 页面间同时使用 `navigateTo`、`redirectTo` 和 `reLaunch`，返回行为还没有统一抽象。
7. `app.globalData.caseData` 适合保存当前流程上下文，不适合成为历史案件的唯一数据源。
8. `app.json` 和 UI TODO 都覆盖 19 个页面，当前主要缺口是系统态和交付契约，不是业务页面数量。
9. 最新 Figma 只读评审显示：品牌页面、变量和基础组件已有；19 个小程序 UI Screens、完整 Prototype、系统状态和 Handoff 尚未完整落地。

## 已做出的产品决策

- 不新增独立 Landing Page；升级现有 Home 为关系首页。
- 新用户、待办用户、历史用户采用同一页面的三态 View Model。
- 带有传票/分享上下文时绕过泛化新用户介绍，优先进入应诉。
- 最新决策：暂不把独立案件详情页纳入当前 P0；由卷宗状态卡和现有目标页面承载，独立详情页降为 P2 评估。
- 不新增情侣绑定、付费和数据库字段。
- 关系记忆展示行为模式，不展示对个人的性格判断。
- `waiting` 和 `pact` 纳入双设备正式流程 P0；本地 Mock 可跳过 waiting。
- `reply` 和 `poster` 调整为 P1 增强能力。
- 19 个页面之外，异常、权限、隐私和恢复状态使用系统组件/页面状态承载。

## 技术决策

- 首轮通过前端 `case-router.js` 推导下一步，不立即把 `nextAction` 下沉数据库。
- 使用 `docId` 作为状态目标页和历史打开的主键。
- Home 同时消费 `myCases()` 和 `inbox()`，生成页面 View Model。
- 流程内返回使用 `navigateBack`，顶层和完成节点使用 Home 兜底。
- 不引入新的 UI 框架或全局状态管理依赖。
- 分离 `RequestState`、`PersistenceState`、`RuntimeMode`，再与 `PrivacyScope`、`InviteState`、`SafetyState`、`DeletionState`、`PermissionState`、`ActorProgress` 组合。
- 在云函数层补齐案件成员、案件所有者和石子接收方校验；在 `utils/casedb.js` 统一 `{ ok, data, source, error }` 结果协议。
- `components/cat/` 升级为 CatJudge 的 `mood / motion / size` 契约，收拢问话页内联 thinking 猫脸。
- 品牌视觉与产品 UI 使用两个独立 Figma 文件：`20260822_panpan_brand_design` 只维护品牌定义与规范；`20260822_panpan_UI_design` 维护 `UI/Contract`、`UI/Foundations`、`UI/Components`、`UI/Core Flow Screens`、`UI/Extended Screens`、`UI/System States`、`UI/Prototype`、`UI/Handoff`。

## 风险与注意事项

- 云端状态组合需要真实样本核对，尤其是 `responded`、`tried`、`closed`、`pactMine` 和 `review` 的组合。
- 当前 `cloudfunctions/casedb/index.js` 的部分 action 尚未完成案件成员权限校验，代码实现必须先完成 T0。
- 当前 `utils/casedb.js` 用 `null` 表达多种运行结果，代码实现必须先完成 T0.1。
- 当前本地 Mock 与云端案件可能出现状态语义不完全一致，必须在路由规则里显式区分。
- 分享/传票深链入口的参数协议还未冻结。
- 敏感关系数据不能因为首页或历史页改造而扩大展示范围。
- “可以复盘”必须来自用户主动选择过复盘提醒，不能自动将所有约定变成考核。
- 安全风险、隐私同意、外部 AI 数据处理说明、删除和邀请异常必须有明确的系统态设计，不能只依赖普通 toast。

## 会话交接

下一位执行者应先阅读：

1. `final-solution.md`
2. `spec.md`
3. `plan.md`
4. `design.md`
5. `tasks.md`
6. `docs/technical-architecture.md`

代码修改前先完成 T1–T3，并把状态、权限和隐私映射写入本文件、`case-router.js` 或组件契约中。
