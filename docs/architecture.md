# 当前架构概览

> 本文记录当前代码事实，不代替单次功能的技术方案。

## 技术形态

- 原生微信小程序：WXML、WXSS、JavaScript、JSON。
- 入口配置：`app.json`、`app.js`、`app.wxss`。
- 页面状态主要由页面 JS、全局 mock 数据和工具模块共同驱动。
- 云端能力集中在 `cloudfunctions/casedb` 和 `cloudfunctions/judge`。

## 页面流程

```text
home
  → evidence
  → statement
  → accept
  → reply / preview / share
  → waiting / respond / their-statement
  → interview / trial / verdict
  → poster / pact / pebble
  → history / review / profile
```

中段流程使用页面跳转控制页面栈；修改路由时必须同时检查 `app.json`、入口参数、返回路径和页面栈限制。

## 云函数边界

### `casedb`

负责案件及关系数据的持久化入口，包括创建、读取、更新陈述、应诉、判决、约定、复盘、石子、时间线、站内收件箱和销毁等 action。新增 action 前先确认调用方、成员身份、幂等性和可见范围。

### `judge`

负责 AI 相关能力入口，包括案由/摘要、先回一句、判决、深度判决、问话、补充视角、截图理解和语音转写等 action。任何新增外部 AI 数据流都必须写入对应 Spec 和风险评审。

## 验证分层

```text
静态检查
  → 微信开发者工具编译
  → 本地 mock 短场景
  → MCP 路由/数据断言
  → 真机/双设备/云端专项验收
```

前一层通过不代表后一层通过。尤其不能把本地 mock 结果当作云端、双设备或真实 AI 已验证。

## 修改影响检查

涉及页面流程时，至少检查：

- `app.json` 页面注册和路由参数。
- 相关页面的 JS/WXML/WXSS/JSON。
- `app.js` 或工具模块中的状态初始化。
- 云函数 action、数据字段和权限边界。
- 空状态、超时、重复点击、回退和返回路径。
- 对应 `docs/qa/scenarios/` 和 `verification.md`。
