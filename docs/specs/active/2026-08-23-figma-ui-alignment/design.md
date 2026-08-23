# Design：Figma 视觉、组件与交互设计

## 设计原则

1. 暖纸张背景、深可可文字、低对比描边、克制的状态色。
2. 组件先于页面；同一状态只保留一套视觉表达。
3. 移动端运行时以 390×844 参考画布和可滚动安全区为基线。
4. 私密内容通过范围标签和安全投影表达，不通过装饰掩盖数据边界。
5. Loading、失败、草稿保留和 Mock/Fallback 必须可理解、可恢复、不可伪成功。

## Token 分层

### 移动端运行时 Token（优先用于小程序页面）

这些值来自 `UI Design System / v2`、Home、Evidence、Reply 和 Button 导出。

| Token | 值 | 用途 |
|---|---|---|
| `runtime.bg.page` | `#FAF7F2` | 页面背景、底部操作区 |
| `runtime.surface.paper` | `#FFFDF9` | 卡片、输入框、按钮次级底 |
| `runtime.ink.primary` | `#1A1918` | 主标题、正文、图标线稿 |
| `runtime.brand.cocoa` | `#3B2919` | 主按钮、品牌强调、焦点边框 |
| `runtime.text.secondary` | `#6E685F` | 说明和次级文字 |
| `runtime.text.placeholder` | `#9C958A` | 占位、禁用辅助文案 |
| `runtime.border.soft` | `#E1DACE` | 描边、分隔线 |
| `runtime.accent.peach` | `#FFD9C7` | 情绪/柔和提示标签 |
| `runtime.status.honey` | `#B0793F` | 审理中、待处理 |
| `runtime.status.sage` | `#7E9B72` | 已完成、安全/正向 |
| `runtime.status.terra` | `#C9573F` | 错误、删除、危险 |
| `runtime.status.disabled` | `#E1DACE` | 禁用背景 |

### Handoff 文档画布 Token（不直接覆盖运行时）

`handoff-board` 使用 `#FFF9F1 / #F4E9DE / #5B4636 / #2B2118 / #D9785B / #E8D9C8` 等值，服务于交付表格和开发说明。它们可以作为现有 `app.wxss` 历史变量的参考，但实现前必须完成运行时/文档画布逐项审计，不能凭文件名直接替换页面颜色。

### 尺寸、间距与圆角

| 设计对象 | Figma 参考 | 实现约定 |
|---|---:|---|
| 页面横向内边距 | 20–24px | 40–48rpx，按页面密度选择 |
| 页面 section 间距 | 20px | 40rpx |
| 卡片内边距 | 16–24px | 32–48rpx |
| 卡片圆角 | 16–24px | 32–48rpx |
| 输入框圆角 | 12px | 24rpx |
| 胶囊圆角 | 999px | `999rpx` |
| 主按钮 | 16px/24px 文本，14×24px 内边距 | 最小高度 96rpx，支持安全区 |
| 屏幕展示框 | 390×844、40px 外框圆角 | 仅用于视觉参考，不能硬编码页面高度 |

## Typography

产品页面普通中文统一使用 `Noto Sans SC`，英文技术词可保留原文；Figma Foundations/Handoff 文档里的 Inter 只属于文档画布。

| Style | 字体 | 字号/行高 | 前端语义 |
|---|---|---|---|
| Display | Noto Sans SC Medium | 32/40px | 页面主标题、Home hero |
| Heading | Noto Sans SC Medium | 24/32px | section/卡片标题 |
| Body | Noto Sans SC Regular | 16/26px | 正文、输入内容 |
| Label | Noto Sans SC Medium | 13/20px | 按钮、状态、标签 |
| Caption | Noto Sans SC Regular | 11/16px | 辅助说明、保存状态 |
| Field | Noto Sans SC Regular | 15/24px | 文本域/输入框 |

前端使用 rpx 时以设计参考比例换算，但不得因换算造成正文过小、按钮不可点或安全区被遮挡；最终以微信开发者工具视觉校验为准。

## 公共组件契约

| 组件 | 必要 props/state | 视觉变体 | 行为约束 |
|---|---|---|---|
| `PageScaffold` | `variant=home/detail/chat`、`title`、`backable`、`stateSlot` | Home/Detail/Chat TopBar | 处理安全区、返回和页面状态槽位；栈为空回 Home |
| `Button` | `variant`、`loading`、`disabled`、`qa` | primary/secondary/destructive/disabled | loading 时幂等锁；禁用不触发写入 |
| `Chip` | `tone`、`selected`、`text` | default/honey/matcha/terra/peach | 只承载标签或选择，不承担隐式导航 |
| `PrivacyNotice` | `scope`、`consent`、`redacted` | private-me/private-ta/joint/public-redacted | 在上传、外部 AI、分享前明确可见范围 |
| `CaseStatus` | `status`、`label` | draft/waiting/in-progress/verdict-ready/closed | 状态文案与案件路由同源 |
| `CaseCard` | `status`、`privacyScope`、`docId`、`onTap` | draft/waiting/interviewing/verdict-ready/closed | 只显示安全投影；点击必须携带 docId |
| `ActorProgress` | `me`、`ta`、`joint`、`progress` | pending/done/absent | 不泄露另一方私密内容，仅展示完成度 |
| `Field` / `Textarea` | `value`、`state`、`draftPreserved`、`maxLength` | default/focus/filled/error | 失败时保留输入；错误文案靠近字段 |
| `BottomActionBar` | `primary`、`secondary`、`variant` | default/disabled/loading | 兼容键盘和 safe-area；主 CTA 唯一 |
| `AsyncStatePanel` | `requestState`、`persistenceState`、`runtimeMode`、`retryable` | loading/empty/error/success | 不把空数据、请求失败、Mock 和成功混为一谈 |
| `InviteStatePanel` | `inviteState` | valid/invalid/self/unauthorized/closed | 错误态不得泄露案件存在性 |
| `RecoveryPanel` | `recoveryState`、`retry`、`backTarget` | restoring/missing/unauthorized/conflict/deleted | 提供重试、回卷宗、回 Home 的明确出口 |
| `PermissionPrompt` | `permission`、`retryable`、`skipable` | unknown/denied/blocked | 解释用途，允许重试或跳过，不强迫授权 |
| `CatJudge` | `mood`、`motion`、`size` | calm/thinking/happy/alert/sleep；static/breathe/blink；avatar/inline/hero/poster | 保留旧 `breathe` 兼容，但新页面统一使用三属性 |
| `ChatBubble` | `role`、`scope`、`text` | judge/user/system | 私密范围与角色同时可校验 |

## 交互时序

以下是实现阶段的默认时序，除非微信平台能力或可访问性要求覆盖它：

| 交互 | 时序 | 约束 |
|---|---:|---|
| 页面转场 | 300ms ease-out | 不阻塞业务状态更新 |
| 按钮按下反馈 | 150ms ease-in | 只做视觉反馈，不能重复提交 |
| 卡片点击高亮 | 200ms | 完成后进入目标页或恢复态 |
| Toast 出现 | 约 200ms；约 2s 自动消失 | 关键错误不能只依赖 Toast |
| CatJudge 呼吸 | 3000ms 循环 | 不影响输入和低端设备性能 |
| 开庭进度步进 | 每步 800ms | 真实异步未完成时显示处理中，不跳假结果 |
| 安全暂停 | 立即 | 中止普通流程，给出退出/求助入口 |
| 判决分段揭晓 | 约 550–700ms/段 | 仅增强已保存结果的阅读，不替代请求状态 |

## 页面布局模板

- Home：状态栏/TopBar → 猫咪与标题 → 唯一主任务 → 次级案件卡/提醒 → 底部安全区。
- 表单页：返回栏 → 标题和说明 → 隐私提示 → Field/Evidence → AsyncStatePanel → BottomActionBar。
- 详情页：返回栏 → CaseStatus → 案件安全投影 → ActorProgress/时间轴 → 唯一主操作 → 恢复入口。
- 对话/问话页：Chat TopBar → 私密范围提示 → ChatBubble/Field → 进度或保存状态 → 提交/暂停。
- 结果页：共同可见摘要 → 判决/约定内容 → PrivacyNotice → 下一步 CTA；不回显私密原话。

## 视觉验收重点

- 背景、卡片、边框、主按钮、状态标签和正文颜色来源明确且未混用两套 Token。
- Noto Sans SC、字号、行高、字重和按钮对齐符合移动端参考稿。
- 390×844 参考尺寸下无横向溢出、CTA 不被底部安全区遮挡、长内容可滚动。
- Home 三态的主操作层级稳定；状态卡不会把敏感原文当摘要。
- Loading/failed/empty/saved/draft-preserved/mock-fallback 具备稳定布局，状态切换不导致页面跳动或假成功。
