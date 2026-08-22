# 最终三层方案：关系首页、案件回访与 UI 系统交付

## 方案定位

本文件是本功能的最终方案摘要，汇总产品、技术和设计三层决策。详细执行内容分别见：

- [产品 Spec](spec.md)
- [技术 Plan](plan.md)
- [设计方案](design.md)
- [任务清单](tasks.md)
- [上下文与决策](context.md)
- [验证矩阵](verification.md)
- [19 页 UI Contract](page-contracts.md)

## 一、评审后的总判断

当前小程序已经覆盖 19 个业务页面和完整主流程。下一步重点不是继续增加页面，而是把以下三件事做成可执行系统：

```text
页面入口
   ↓
状态 / 权限 / 隐私组件
   ↓
失败 / 恢复 / 安全边界
```

最终方案保留三个产品判断：

1. 现有 `home` 升级为关系首页，不新增独立 Landing Page。
2. 现有 19 页继续作为业务路由边界；独立案件详情页暂降为 P2，先由卷宗状态卡和目标页面承载。
3. Figma 从品牌系统进入 UI Contract、System States、Prototype 和 Handoff 阶段。

## 二、产品方案

### 2.1 Home 的三态

| 状态 | 判断依据 | 用户看到什么 | 首要动作 |
|---|---|---|---|
| 新用户 | 无案件、无草稿、无传票上下文 | 产品解释、隐私承诺、两个入口 | 我要立案 |
| 有待办老用户 | 有 `inbox` 或未完成案件 | 当前最重要的一件事 | 继续下一步 |
| 有历史老用户 | 有案件但无高优先级待办 | 最近案件、卷宗、关系记忆 | 查看卷宗/再立案 |

传票或分享上下文直接进入应诉，不经过泛化介绍。

### 2.2 案件生命周期

```text
发起 → 陈述 → 受理 → 传票 → 应诉 → 问话 → 开庭 → 判决 → 约定 → 复盘
```

关系价值在“约定与复盘”完成闭环；因此 `verdict → pact` 是核心路径，不是可选扩展。

### 2.3 产品优先级

#### P0：双设备正式流程

- `home / evidence / statement / accept / preview / share`
- `respond / their-statement / interview / trial / verdict / pact`
- `waiting` 的双设备等待、打开、应诉、完成、异常网络和缺席入口

#### P0：本地 Mock 演示

- 主流程可以快速跑通。
- `waiting` 可以被演示态推进，但必须标识演示，不冒充真实同步。

#### P1：增强体验

- `reply / poster / pebble / history / review / profile`
- 站内提醒、订阅消息、权限拒绝和更完整的异常恢复。

#### P2：后续评估

- 独立案件详情页。
- 无障碍、大字号、深色模式和扩展关系生命周期工具。

### 2.4 产品必须覆盖的系统态

- 隐私同意和 AI 数据处理说明。
- 安全风险干预、停止普通审理和求助入口。
- 邀请无效、过期、撤销、自己邀请自己、无权限、已关闭。
- 冷启动恢复、案件不存在、版本冲突。
- 离线、云端失败、AI 超时、可重试、Mock 回退、草稿保留。
- 相册、麦克风、保存相册权限拒绝。
- 删除案件、删除关系模式及其进行中/失败/完成状态。
- 空卷宗、无通知、无判决、判决字段缺失。
- 双方约定冲突和重新选择。

## 三、技术方案

### 3.1 数据与入口

```text
普通打开 ───────────────→ Home View Model
传票/分享上下文 ─────────→ 应诉入口

Home View Model = myCases() + inbox() + 本地草稿/已进入标记
当前流程上下文 = app.globalData.caseData + docId
历史案件主键 = docId；不能只依赖全局案件
```

- 云端 `myCases()` 和 `inbox()` 是 Home/History 的主要来源。
- `app.globalData.caseData` 只负责当前流程，不负责历史真相。
- 首轮不新增数据库字段和云函数 action；允许补齐现有 action 的成员权限校验。
- 用 `case-router.js` 集中推导下一步，用 `navigation.js` 集中处理返回。

### 3.2 安全与数据适配前置

- `get`、`patterns`、`timeline` 只向案件成员返回安全投影。
- `saveNote`、`saveVerdict`、`savePact`、`confirmPact`、`saveReview`、`destroy` 先校验案件成员/所有者。
- `receivePebble` 校验当前用户是该石子的接收方。
- `utils/casedb.js` 统一返回 `{ ok, data, source, error }`，不再用 `null` 混淆空数据、失败和 Mock。
- 无权限场景返回统一 `UNAUTHORIZED`，不泄露案件存在性。

### 3.2 跨页面状态契约

```js
RequestState = idle | loading | success | failed | offline | timeout
PersistenceState = unsaved | saving | saved | draft-preserved | save-failed
RuntimeMode = cloud | mock | fallback

PrivacyScope = private-me | private-ta | joint | public-redacted

InviteState = valid | invalid | self | unauthorized | closed
// expired / revoked / bound 为设计预留，待后端提供独立可验证状态
```

补充：

- `SafetyState`：`none / caution / intervene / help`
- `DeletionState`：`idle / confirming / deleting / failed-retryable / deleted`
- `PermissionState`：`unknown / granted / denied / blocked`
- `ActorProgress`：`me-pending / me-done / ta-pending / ta-done / joint-done`

### 3.3 组件工程化

当前真实复用组件只有 `components/cat/`。首轮需要形成以下公共契约：

- `PageScaffold`
- `BottomActionBar`
- `RequestState` / `PersistenceState` / `RuntimeMode`
- `PrivacyScope`
- `SafetyIntervention`
- `InviteState`
- `PermissionPrompt`
- `RecoveryPanel`
- `CaseStatus`
- `ActorProgress`
- `DeletionFlow`
- `EvidencePicker`

`CatJudge` 统一支持：

```ini
mood = calm / happy / sleep / thinking / alert
motion = static / breathe / blink
size = avatar / inline / hero / poster
```

### 3.4 返回和恢复

- 流程内：`navigateBack`，保留输入上下文。
- 顶层页面：回 Home。
- 完成节点：`回到首页` + `查看卷宗`。
- 页面栈为空：`reLaunch('/pages/home/home')` 兜底。
- 失败：说明数据是否保存，提供重试或安全离开。
- 不用静默 Mock 结果掩盖 AI/云端失败。

## 四、设计方案

### 4.1 Figma 目标结构

品牌视觉与产品 UI 使用两个独立 Figma 文件：品牌文件只维护品牌定义与规范；产品 UI 文件维护 UI 交付：

```text
品牌 Figma：20260822_panpan_brand_design
  00 Cover / 01 Brand Strategy / 02 Foundations / 03 Logo & Mascot

UI Figma：20260822_panpan_UI_design
UI/
  Contract / Foundations / Components / Core Flow Screens
  Extended Screens / System States / Prototype / Handoff
```

### 4.2 每个页面的交付字段

```text
route
entry condition
actor：我 / TA / 双方
privacy scope
async state
failure / retry
back / cancel
data saved or not
对应 qa-* selector
priority：P0 / P1 / P2
```

### 4.3 视觉原则

- 奶油纸背景、炭黑正文、陶土/蜜色/抹茶状态色。
- 简体无衬线中文、大留白、低噪音、无科技蓝紫渐变。
- 每页一个主判断、一个主 CTA。
- 状态用颜色和文案表达，避免用颜色制造恐慌。
- 隐私、AI 生成、失败、安全干预不能只画正常态。
- Cat Symbol、Mascot、Chat Avatar 保持层级关系，共享线宽和情绪语义。

### 4.4 Prototype 验证

至少完成三条：

1. 正常双人主流程。
2. AI/云端失败后保留草稿并重试。
3. 隐私或安全风险触发暂停和求助。

## 五、实施顺序

```text
补齐案件成员权限与数据结果协议
          ↓
冻结 19 页契约与状态枚举
          ↓
建立 P0 公共组件和 CatJudge
          ↓
实现 Home 三态与 History 状态路由
          ↓
补齐 P0 页面系统态
          ↓
同步 Figma Screens / Prototype / Handoff
          ↓
微信开发者工具、Mock、双设备验证
          ↓
再决定 P1 与 P2
```

## 六、完成定义

- 19 个页面都有页面契约。
- P0 双设备流程和 P0 Mock 流程边界清楚。
- `waiting`、`pact` 的正式流程优先级已确认。
- 请求、保存、运行来源三类状态可跨页面复用，避免把失败误当空数据。
- 案件成员权限和石子接收方权限有云函数验证记录。
- Figma 有 UI Contract、Components、System States、Prototype、Handoff。
- Home 能区分新用户、待办老用户、历史老用户。
- History 能按案件状态进入正确目标页。
- 返回、失败、恢复、删除、权限和安全边界都有验证记录。
