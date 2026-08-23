# 技术 Plan：关系首页与案件回访入口

## 影响范围

### 允许修改的文件

- `app.json`：新增 P0 页面 `pages/case-detail/case-detail`。
- `pages/home/home.js`、`pages/home/home.wxml`、`pages/home/home.wxss`：首页三态和任务中心。
- `pages/history/history.js`、`pages/history/history.wxml`、`pages/history/history.wxss`：卷宗列表和状态展示。
- `pages/case-detail/case-detail.js`、`pages/case-detail/case-detail.wxml`、`pages/case-detail/case-detail.wxss`、`pages/case-detail/case-detail.json`：单案件状态中枢、下一步和恢复态。
- `utils/case-router.js`：案件状态到用户动作、页面和文案的映射。
- `utils/navigation.js`：Home、流程内返回和页面栈兜底。
- `utils/casedb.js`：统一云函数结果协议，区分云端成功、业务失败、网络失败、Mock 和本地草稿。
- `cloudfunctions/casedb/index.js`：补齐案件成员、案件所有者和石子接收方校验；不改数据库结构。
- `components/`：状态组件、隐私组件、权限组件和 CatJudge 能力升级。
- `docs/specs/active/2026-08-23-home-entry-experience/`：本功能文档和验证证据。
- `docs/status.md`：实现完成后更新项目状态。
- `09-UI设计需求.md`、`08-品牌视觉系统/品牌视觉评审与Figma执行方案.md`：同步最终 UI / Figma 交付边界和当前状态。

### 首轮不做的改动

- `cloudfunctions/casedb/index.js`：不新增业务 action，不改数据库结构；只补 P0 权限边界和统一错误语义。
- `cloudfunctions/judge/`：不改 AI Prompt 和模型请求。
- `app.js` 的既有案件状态机：除非发现入口恢复必须的最小字段问题，不做全局状态重构。
- `utils/ai.js`、`utils/voice.js`、`utils/live.js`：不因 Home 功能顺带重构。
- `pages/statement/`、`pages/trial/`、`pages/verdict/` 等流程页：首轮只接入统一导航，不重写业务逻辑。

### 页面和路由

现有页面：

- Home：`/pages/home/home`
- 卷宗：`/pages/history/history`
- 我的：`/pages/profile/profile`

当前 `app.json` 已注册 20 个页面，包含本轮新增的 P0 `case-detail`。

新增 P0 路由：

- 案件详情：`/pages/case-detail/case-detail?docId=...&source=history`

`history` 负责全部案件列表，`case-detail` 负责单案状态和下一步，`waiting / verdict / pact / review` 继续承载具体任务。

### 工具模块

#### `utils/case-router.js`

建议提供：

```js
getHomeMode({ cases, inbox, draft, hasEntered })
getCaseStatusText(caseData)
getCaseNextAction(caseData)
getCaseNextRoute(caseData)
getPriorityTask({ cases, inbox })
```

规则必须以现有字段推导为主：`status`、`side`、`hasB`、`verdict`、`pact`、`pactMine`、`pactBoth`、`review`。

#### `utils/navigation.js`

建议提供：

```js
goHome()
backOrHome()
goNextForCase(caseData, source)
```

`backOrHome()` 需要处理页面栈为空、页面从分享入口直接打开、页面从 Home 进入三种情况。

### 状态契约

跨页面统一使用以下状态枚举，不能每个页面自行发明一套 loading/失败语义：

```js
RequestState = 'idle' | 'loading' | 'success' | 'failed'
  | 'offline' | 'timeout'

PersistenceState = 'unsaved' | 'saving' | 'saved'
  | 'draft-preserved' | 'save-failed'

RuntimeMode = 'cloud' | 'mock' | 'fallback'

PrivacyScope = 'private-me' | 'private-ta' | 'joint' | 'public-redacted'

InviteState = 'valid' | 'invalid' | 'self' | 'unauthorized' | 'closed'

// 设计预留：expired / revoked / bound；首轮后端尚未提供可验证的独立状态
```

补充状态：

- `SafetyState`：`none / caution / intervene / help`。
- `DeletionState`：`idle / confirming / deleting / failed-retryable / deleted`。
- `PermissionState`：`unknown / granted / denied / blocked`。
- `ActorProgress`：`me-pending / me-done / ta-pending / ta-done / joint-done`。

### P0 安全与数据适配前置

#### 云函数权限边界

`cloudfunctions/casedb/index.js` 必须在读取或写入案件前统一执行成员校验，不能只依赖前端传入的 `_id`。建议形成以下内部守卫：

```js
assertCaseMember(doc, OPENID)
assertCaseOwner(doc, OPENID)
assertPebbleRecipient(pebble, OPENID)
```

至少覆盖：

- `get`、`patterns`、`timeline`：仅案件成员可读。
- `saveNote`、`saveVerdict`、`savePact`、`confirmPact`、`saveReview`：仅案件成员可写；需要区分 A 方所有者与双方成员时使用对应守卫。
- `destroy`：仅案件成员可以发起，若产品最终要求只有 A 方删除，再收紧为 `assertCaseOwner`。
- `receivePebble`：只允许石子接收方确认，不能通过任意 `pebbleId` 修改他人状态。

校验失败统一返回可识别的业务错误码，不泄露案件是否存在给无权限用户：

```js
{ ok: false, error: { code: 'UNAUTHORIZED', message: '无权访问此案件', retryable: false } }
```

#### 前端数据结果协议

`utils/casedb.js` 不再用 `null` 同时表达空数据、业务错误、网络错误和 Mock。页面消费统一结果：

```js
{
  ok: true,
  data: [],
  source: 'cloud' | 'mock' | 'fallback',
  error: null
}
// 失败：
{
  ok: false,
  data: null,
  source: 'cloud' | 'mock' | 'fallback',
  error: { code, message, retryable }
}
```

Home 和 History 至少能区分：

1. 云端成功但为空；
2. 云端请求失败且可以重试；
3. 云端未配置或不可用，当前展示 Mock / 本地草稿；
4. 业务无权限或案件已不存在。

### 云函数 action

首轮不新增 action，复用：

- `myCases`
- `inbox`
- `get`
- `patterns` / `myPatterns`（如果首页展示关系记忆摘要）

如果前端推导规则出现多处重复，后续再考虑在 `casedb` 增加只返回安全投影的 `homeSummary` 或 `caseNextAction` action；不在本轮为方便 UI 而增加 action。

### 数据字段

首轮不新增数据库字段。前端 View Model 建议结构：

```js
{
  mode: 'first-use' | 'action-center' | 'relationship-home',
  loading: false,
  error: '',
  primaryTask: {
    kind: 'responded' | 'verdict' | 'pact' | 'review' | 'pebble' | 'draft' | 'waiting',
    docId: '',
    caseId: '',
    title: '',
    text: '',
    actionText: ''
  },
  secondaryTasks: [],
  recentCases: [],
  patterns: [],
  hasEntered: false
}
```

## 实现方案

### 1. 首页加载流程

```text
onShow
  ├── 读取本地 hasEntered / lastCaseId
  ├── 并行调用 myCases() 与 inbox()
  ├── 合并本地草稿和云端案件
  ├── case-router 计算 mode / primaryTask / recentCases
  └── setData(viewModel)
```

首页不能等待 AI 请求；AI 只在案件流程中发生，Home 只读取案件投影和提醒。

### 2. 普通入口和分享入口分流

- 普通启动：进入 Home。
- 传票/分享上下文：如果能解析有效 `docId` 或口令，直接进入 `respond` 或现有应诉入口。
- 入口上下文无效：回到 Home，并显示“传票口令无效，请重新输入”的可恢复提示。

### 3. 历史案件与 Case Detail 路由

- `history` 的卡片和入口只使用案件安全投影，不展示双方私密陈述。
- 点击案件时必须先携带 `docId` 进入 `case-detail`；详情页再由 `getCase(docId)` 读取安全投影。
- `case-detail` 由 `getCaseNextRoute()` 判断目标页，并展示案件状态、双方进度和唯一主操作。
- 进入判决页、约定页或复盘页前，显式写入当前案件 `docId`；不能只依赖上一次的 `app.globalData.caseData`。
- 目标页加载后仍需校验 `docId` 与当前案件，避免连续打开两桩案件时串用数据。

### 4. 跨页面组件契约

首轮建议补充或抽取以下组件：

| 组件 | 责任 |
|---|---|
| `PageScaffold` | 页面安全区、标题、返回、页面级状态槽位 |
| `BottomActionBar` | 主/次 CTA、loading、禁用、键盘和安全区 |
| `RequestState` / `PersistenceState` / `RuntimeMode` | 请求状态、保存状态、运行来源分别表达；组件可将三者投影成用户可读的 AsyncState |
| `PrivacyScope` | 只有我、只有 TA、双方共同、公开脱敏 |
| `SafetyIntervention` | 暂停普通流程、说明风险、退出和求助 |
| `InviteState` | 首轮支持有效、无效、自己邀请自己、无权限、已关闭；过期、撤销、已绑定为设计预留 |
| `PermissionPrompt` | 相册、麦克风、保存相册权限说明和重试 |
| `RecoveryPanel` | 冷启动恢复、案件不存在、版本冲突和恢复入口 |
| `CaseStatus` | 案件状态胶囊和状态文案 |
| `ActorProgress` | 我 / TA / 双方完成状态 |
| `DeletionFlow` | 删除确认、删除中、失败和完成 |
| `EvidencePicker` | 截图数量、上传、失败、隐私提示 |

现有 `components/cat/` 升级为 `CatJudge` 契约：

```ini
mood = calm / happy / sleep / thinking / alert
motion = static / breathe / blink
size = avatar / inline / hero / poster
```

问话页的 thinking 猫脸内联结构应归并到该组件体系，避免设计和代码出现两套猫。

### 5. 历史列表状态映射

前端需要区分“数据状态”和“用户动作”：

| 数据条件 | 状态文案 | 主操作 |
|---|---|---|
| A 方草稿且无 B | 还没发给 TA | 继续发传票 |
| 已有案件但无 B 应诉 | 等 TA 应诉 | 查看进度 |
| `status=responded` | 可以开庭 | 开始开庭 |
| 有 `verdict` 无 `pact` | 判决已出 | 一起定约定 |
| 有 `pact` 且未本人确认 | 约定等你确认 | 确认约定 |
| `status=closed` 且无 `review` | 可以复盘 | 去复盘 |
| 有 `review` | 已复盘 | 查看判决 |
| 其他 | 审理中 | 查看案件 |

最终实现前需要用实际云端样本和本地 Mock 样本逐条验证，不把表格直接当成云端事实。

### 6. 返回策略

- 流程页的上一步按钮继续使用 `navigateBack` 或原有流程替换跳转。
- 顶层页统一使用 `goHome()`。
- 结案节点优先使用 `reLaunch('/pages/home/home')` 清理失效页面栈。
- 不把 `redirectTo` 当成全局返回机制；它只用于明确的单向流程替换。

### 7. 20 页页面契约

设计和研发交接表必须为每个现有页面记录以下字段：

```text
route / entryCondition / actor / privacyScope / asyncState
failureRetry / backCancel / dataSaved / qaSelector / priority
```

页面数量以目标版 `app.json` 的 20 个注册页面为准；系统态通过组件、弹层或全屏状态覆盖，不用为了每个异常状态继续增加业务页面。

### 8. Figma 交付结构

品牌视觉与产品 UI 使用两个独立 Figma 文件。品牌文件只维护品牌定义与规范；UI 文件承载产品 UI 交付：

```text
品牌 Figma：20260822_panpan_brand_design

UI Figma：20260822_panpan_UI_design
UI/
  Contract / Foundations / Components / Core Flow Screens
  Extended Screens / System States / Prototype / Handoff
```

至少串联三条 Prototype：

1. 正常双人主流程。
2. AI / 云端失败后保留草稿并重试。
3. 隐私或安全风险触发暂停和求助流程。

## 状态、数据流与失败处理

### 重复点击

- 首页加载期间禁止重复触发同一跳转。
- 卷宗状态摘要卡主按钮进入 loading 状态，避免重复打开同一案件。
- `wx.navigateTo` 前检查 `docId`，无 ID 时不进入详情页。

### 空数据

- 新用户显示 `first-use`，不显示虚构历史。
- 云端返回空数组时，显示“还没有卷宗”，提供立案和输入传票两个入口。
- 本地 Mock 模式下明确显示“演示卷宗”或沿用项目现有的演示标识，不能与真实历史混用。

### 网络/云函数失败

- Home：保留基础新建和输入传票入口，显示可重试提示。
- History：如果无本地可靠历史，不显示云端失败数据；可显示“暂时调不出卷宗”。
- 案件状态摘要卡：显示“案件暂时无法打开”，提供重试和回 Home。
- 使用统一数据结果协议；页面不得再依赖 `null` 推断“空数据”或“请求失败”。

### AI 超时或格式错误

- 本功能不改变 AI 处理。
- Home、History 和状态目标页不直接等待 AI。
- 如果案件判决尚未生成，详情页只展示“审理中”和时间线，不伪造判决。

### 权限不足

- 由云函数投影决定可见字段。
- 客户端不直接读取 `cases` 集合。
- 不在 URL、WXML 或本地缓存中写入对方原话、截图原图和模型密钥。

### 系统状态覆盖

- 隐私同意与 AI 数据处理说明：首次触发外部模型或上传敏感素材前展示。
- 邀请异常：由 `InviteState` 驱动，不泄露其他用户的案件存在性。
- 删除流程：案件原文删除与关系模式清空分别表达，不把删除成功误认为判决撤回。
- 约定冲突：双方选择不同约定时停在重新选择，不自动合并。
- 安全干预：进入 `SafetyIntervention` 后停止普通审理，不显示轻松拟人化的结论。

## 验证方案

### 静态检查

```bash
node --check app.js
find pages utils components cloudfunctions -name '*.js' -print0 | xargs -0 -n1 node --check
find . -name '*.json' -not -path './node_modules/*' -print0 | xargs -0 -n1 jq empty
```

### 微信开发者工具

- 编译通过。
- 20 个业务页面均能被路由打开，并能映射到页面契约。
- 20 个页面均能映射到页面契约表。
- Home 三态能够通过本地 Mock 数据切换。
- 页面无 WXML 绑定错误、控制台异常和明显溢出。

### MCP/冒烟场景

1. 新用户打开 Home → 进入立案。
2. 新用户输入有效传票 → 进入应诉。
3. 老用户有待办 → Home 主卡片跳到正确下一页。
4. Home → 卷宗状态摘要卡 → 判决/约定/复盘。
5. 流程页返回上一步，完成页回 Home。
6. 云端请求失败 → 页面保留可理解的回退入口。

### 人工或真机确认

- 双账号分别确认 Home 的案件列表和提醒权限边界。
- 确认 B 方看不到 A 方原话和截图。
- 确认从分享/传票打开时不被强制带到新用户介绍。
- 确认微信开发者工具和真机的页面栈行为一致。
- 确认系统态组件在至少三个页面复用后仍保持一致文案和视觉。

## 不采用的方案

### 不新增独立 Landing Page

判判是高情绪、强任务型产品，用户进入时通常已经有具体案件或传票。独立 Landing 会增加一次点击，且分享/传票入口不需要品牌浏览流程。关系首页承担普通打开的解释和入口，案件详情承担已进入案件后的状态中枢。

### 不在首轮新增情侣绑定

绑定关系会把承诺放在价值之前，也会增加隐私和解绑成本。当前案件自然沉淀的 `coupleKey` 已能支持关系模式记忆。

### 不先改数据库增加 nextAction 字段

现有 `status`、`verdict`、`pact`、`review` 已足够支持首轮页面验证。先在前端集中推导，等真实样本证明规则稳定后再下沉云函数。

### 不把 App 全局状态做成完整状态管理框架

当前项目是原生小程序 MVP。首轮用 View Model、路由工具和明确的 `docId` 传递即可，暂不引入额外依赖。

### 不把每个异常状态做成独立页面

异常、权限、隐私和恢复状态应优先由统一组件和页面状态槽位承载。只有需要独立任务和独立返回关系的安全干预，才评估全屏页。

## 回滚方式

- Home 和 History 恢复到实现前的页面版本。
- 移除 `utils/case-router.js`、`utils/navigation.js` 的引用即可回滚逻辑。
- 移除新增的状态组件引用即可回滚系统态改造。
- 不涉及数据库迁移，因此无需数据回滚。
- 回滚后重新执行静态检查和 Home 主流程冒烟。
