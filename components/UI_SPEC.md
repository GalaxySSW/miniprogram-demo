# 判判 UI 公共层 Spec

## 视觉基础

- 页面底色 `#FFF9F1`，纸张表面 `#F4E9DE`。
- Cocoa `#5B4636`，主文字/主操作 `#2B2118`。
- Peach `#F6B59D`，Honey `#DDBB7A`，Sage `#A8B89A`，Danger `#D9785B`，边框 `#E8D9C8`。
- 设计值换算：Display `32/40` → `64/80rpx`；Heading `24/32` → `48/64rpx`；Body `16/26` → `32/52rpx`；Label `13/20` → `26/40rpx`；Caption `11/16` → `22/32rpx`。
- 不用渐变和厚投影；公共卡片使用柔和描边和暖纸色表面。

## 组件契约

| 组件 | 核心 props | 事件 | 结构化选择器 |
| --- | --- | --- | --- |
| `PageScaffold` | `title`, `eyebrow`, `subtitle`, `showBack`, `compact`, `centered`, `qaId` | `back` | `data-qa="{qaId}"`、`{qaId}-back` |
| `BottomActionBar` | `primaryText`, `secondaryText`, `loading`, `primaryDisabled`, `fixed`, `safeArea`, `qaId` | `primary`, `secondary` | `{qaId}`、`{qaId}-primary`、`{qaId}-secondary` |
| `AsyncStatePanel` | `state`, `title`, `description`, `showRetry`, `retryText`, `qaId` | `retry` | `data-state`、`{qaId}`、`{qaId}-retry` |
| `PrivacyNotice` | `scope`, `label`, `text`, `detail`, `quiet`, `qaId` | — | `data-scope`、`{qaId}`、`{qaId}-scope` |
| `CaseStatus` | `status`, `text`, `compact`, `qaId` | — | `data-status`、`{qaId}` |
| `ActorProgress` | `actor`, `current`, `steps`, `orientation`, `compact`, `qaId` | `select` | `data-actor`、`{qaId}`、`{qaId}-step-*` |
| `RecoveryPanel` | `state`, `title`, `description`, `primaryText`, `secondaryText`, `showSecondary`, `qaId` | `retry`, `secondary` | `data-state`、`{qaId}-retry`、`{qaId}-secondary` |
| `InviteStatePanel` | `state`, `title`, `description`, `inviteCode`, `primaryText`, `showCopy`, `qaId` | `send`, `copy` | `data-state`、`{qaId}-primary`、`{qaId}-copy` |

状态只由页面持有和持久化；公共组件负责展示、轻量交互和事件通知，不访问业务数据层。
