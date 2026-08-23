# 20 页 UI Contract：关系首页与案件回访入口

> 状态：方案阶段，待代码与 Figma 实现后逐项补充 `qa-*` 运行时证据。
>
> 规则：当前代码有 20 个注册页面，包含 P0 `case-detail`。异常、权限、隐私和恢复状态仍通过页面状态或公共组件承载。

## 字段定义

| 字段 | 含义 |
|---|---|
| 入口 | 用户从哪里进入 |
| 角色 | `我`、`TA`、`双方` |
| 隐私范围 | `private-me`、`private-ta`、`joint`、`public-redacted` |
| 数据读取 | 页面进入或刷新时读取的数据 |
| 数据写入 | 用户提交后产生的写入 |
| 下一步 | 正常完成后的目标页面 |
| 失败恢复 | 失败时保留什么、重试什么、回到哪里 |
| 返回/取消 | 用户主动退出的路径 |
| 契约选择器 | 计划使用的稳定 `qa-*` 选择器 |
| 优先级 | `P0`、`P1`、`P2` |

## 页面总表

| 页面 | 入口 | 角色 | 隐私范围 | 数据读取 | 数据写入 | 下一步 | 失败恢复 | 返回/取消 | 契约选择器 | 优先级 |
|---|---|---|---|---|---|---|---|---|---|---|
| `home` | 普通打开 | 我 | `public-redacted` | `myCases`、`inbox`、本地草稿 | `hasEntered`、已读提醒 | `evidence` / `respond` / 状态目标页 | 保留立案和传票入口；区分空数据、失败、Mock | 入口页，无上一步 | `qa-home-primary`、`qa-home-summons` | P0 |
| `evidence` | Home 立案 | 我 | `private-me` | 本地草稿、相册权限 | 图片选择、删除、上传、草稿 | `statement` | 保留已选图片；权限/上传可重试 | 回 Home；放弃前确认 | `qa-evidence-picker`、`qa-evidence-next` | P0 |
| `statement` | evidence 跳转/跳过证据 | 我 | `private-me` | 草稿、语音权限、既有陈述 | 陈述草稿、语音转写结果 | `accept` | 转写失败保留文字；提交失败保留草稿 | 回 evidence 或 Home | `qa-statement-field`、`qa-statement-submit` | P0 |
| `accept` | statement 提交 | 我 | `private-me` / `public-redacted` | AI 受理复述、案由摘要 | `updateStatement`、补充陈述 | `preview` / `reply` / Home | AI 失败显示待处理并允许重试；不伪造受理结果 | 返回修改或稍后 | `qa-accept-confirm`、`qa-accept-edit` | P0 |
| `reply` | accept 的可选分支 | 我 | `private-me` | AI 话术或本地安全话术 | 复制动作，不默认写入案件 | `preview` 或回 Home | AI 失败使用固定低风险话术；允许跳过 | 回 accept | `qa-reply-copy`、`qa-reply-skip` | P1 |
| `preview` | accept / reply | 我 | `private-me`、`public-redacted` | 案由、附言、可见范围 | 附言、发送确认 | `share` | 保存失败保留草稿；重新生成可重试 | 返回修改 | `qa-preview-privacy`、`qa-preview-send` | P0 |
| `share` | preview 确认 | 我 | `public-redacted` | 案号、口令、脱敏邀请语 | 发送/复制邀请动作 | `waiting` | 无法分享时保留复制口令；明确演示态 | 回 Home 或进入 waiting | `qa-share-send`、`qa-share-code` | P0 |
| `waiting` | share / Home 待办 | 我 | `public-redacted` | `timeline`、案件安全投影 | 订阅授权、递石子旁路 | `trial` / `verdict` / `pebble` | 轮询超时显示当前已知状态和重试 | 回 Home；缺席入口需确认 | `qa-waiting-stepper`、`qa-waiting-retry` | P0 |
| `respond` | 传票/分享上下文 | TA | `private-ta`、`public-redacted` | 口令案件的脱敏案由和承诺 | 应诉开始、暂缓选择 | `their-statement` / Home | `InviteState` 错误不泄露案件存在性 | 暂缓并回 Home | `qa-invite-state`、`qa-respond-start` | P0 |
| `their-statement` | respond 开始 | TA | `private-ta` | TA 草稿、语音权限、情绪选项 | B 方陈述、情绪标签 | `interview` | 转写/保存失败保留草稿 | 返回 respond 或稍后 | `qa-their-statement`、`qa-their-submit` | P0 |
| `interview` | 双方陈述完成 | 我 / TA | `private-me` 或 `private-ta` | 当前 side、追问、历史轮次 | 私密回答、语音转写 | `trial` | AI 失败使用固定追问或允许跳过；保留草稿 | 暂停并回到安全位置 | `qa-interview-answer`、`qa-interview-skip` | P0 |
| `trial` | interview 完成 / waiting 应诉 | 双方 | `joint` | 双方安全投影、案件状态 | `saveVerdict`、审理状态 | `verdict` | AI 超时显示审理中、可重试，不生成假判决 | 回 Home；不可回到私密原话 | `qa-trial-step`、`qa-trial-retry` | P0 |
| `verdict` | trial 完成 / Home 待办 | 双方 | `joint` | `getCase(docId)`、判决安全投影 | 补充视角、查看/复制动作 | `pact` / `poster` / `interview` | 字段缺失显示不完整判决并重试；缺席态单独表达 | 回 Home 或卷宗 | `qa-verdict-section`、`qa-verdict-pact` | P0 |
| `poster` | verdict 分享 | 双方 | `public-redacted` | 判决金句、脱敏案号 | Canvas 生成、保存相册 | Home / History | 生成失败可重试；保存权限拒绝可跳过 | 返回 verdict | `qa-poster-generate`、`qa-poster-save` | P1 |
| `pact` | verdict | 双方 | `joint` | 判决、约定选项、双方选择 | `savePact`、`confirmPact` | `pebble` / `review` / Home | 双方选择冲突时重新选择；保存失败可重试 | 回 verdict | `qa-pact-choice`、`qa-pact-confirm` | P0 |
| `pebble` | pact / Home / waiting | 双方 | `joint` | `pebbleFeed`、每日额度 | `pebble`、`receivePebble` | Home / 重新开庭 | 图片上传/权限失败可重试；额度上限明确 | 回 Home | `qa-pebble-send`、`qa-pebble-receive` | P1 |
| `history` | Home 卷宗 | 我 / 双方 | `public-redacted` | `myCases`、安全投影、复盘状态 | 删除/打开/复盘入口 | `waiting` / `trial` / `verdict` / `pact` / `review` | 加载失败显示恢复态，不显示旧全局案件 | 回 Home | `qa-history-card`、`qa-history-empty` | P0 基础入口 / P1 完整能力 |
| `case-detail` | Home / History / inbox / share，携带 `docId` | 我 / TA / 双方 | `public-redacted` / `joint` | `getCase(docId)`、案件安全投影、状态与进度 | 仅导航；目标页负责业务写入 | `evidence` / `preview` / `share` / `waiting` / `trial` / `verdict` / `pact` / `review` / `pebble` | 案件不存在、无权限、版本冲突、字段缺失 → `RecoveryPanel`，重试/回卷宗/Home | 按 `source` 回 Home 或 History；栈为空回 Home | `qa-case-detail-status`、`qa-case-detail-primary`、`qa-case-detail-retry` | P0 |
| `review` | Home / History / inbox | 双方 | `joint` | 约定、提醒、复盘状态 | `saveReview` | Home / History | 保存失败保留选择；允许重试 | 回 Home | `qa-review-choice`、`qa-review-submit` | P1 |
| `profile` | Home 我的 | 我 / 双方 | `joint` / `public-redacted` | `myPatterns`、案件约定统计 | `forgetPatterns`、删除确认 | Home | 删除失败可重试；区分原文删除与模式清空 | 回 Home | `qa-profile-patterns`、`qa-profile-forget` | P1 |

## 统一页面状态

每个页面至少根据功能需要选择以下状态；不要求每页复制全部状态：

```text
RequestState: idle / loading / success / failed / timeout / offline
PersistenceState: unsaved / saving / saved / draft-preserved / save-failed
RuntimeMode: cloud / mock / fallback
PrivacyScope: private-me / private-ta / joint / public-redacted
```

## 当前技术边界

- `expired`、`revoked`、`bound` 邀请状态先作为设计预留；当前后端没有足够字段可靠判断。
- 20 页页面契约不等于代码已实现；所有“待验证”项目必须在 `verification.md` 补证据。
- `qa-*` 选择器是设计与研发约定，接入代码前不得假设它们已经存在。
- P0/P1 描述的是交付优先级，不代表当前页面能力已经完成。
