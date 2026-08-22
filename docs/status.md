# 项目当前状态

> Last verified: 2026-08-23

## 基线

- 当前分支：`rainno`
- 当前提交：`bb582bf`
- 远端：`origin/rainno`（`rainnochen/miniprogram-demo`）
- 上游：`GalaxySSW/miniprogram-demo`
- 分支策略：日常迭代统一直接在 `rainno`，不再为功能创建新分支
- 本地演示入口：`pages/home/home`

## 当前范围

- 原生微信小程序，共 19 个已注册页面。
- 本地 mock 主链路：首页 → 立案 → 证据 → 陈述 → 受理 → 传票 → 应诉 → 问话 → 判决 → 约定/石子。
- 云函数目录：`cloudfunctions/casedb`、`cloudfunctions/judge`。
- 已有等待进度、站内提醒、复盘、重审、海报和双向石子页面。
- 当前默认仍以本地 mock 演示为首轮基线。

## 能力状态

| 能力 | 状态 | 说明 |
|---|---|---|
| 页面和路由 | Code implemented | 19 个页面已注册，主流程已有界面 |
| JavaScript/JSON 静态检查 | Static checked | 最近一次源码同步后通过 `node --check` 和 `jq` |
| 本地 mock 主流程 | Mock verified | 作为默认演示基线；需按场景持续回归 |
| 微信开发者工具编译 | Pending | 每次涉及页面代码后需记录实际编译结果 |
| MCP 运行时冒烟 | Pending | 需记录路由和关键数据断言 |
| 云函数/数据库 | Real pending | 依赖环境配置和云端验收 |
| 双账号/双设备 | Real pending | 尚未作为本地 mock 通过的替代证明 |
| 真实 AI、隐私和数据销毁 | Real pending | 需要专项人工评审，不能由 mock 结果代替 |

## 当前风险

1. 案件成员鉴权、双方数据可见范围和状态一致性仍需专项验证。
2. 外部 AI、截图、语音和关系陈述涉及敏感数据，禁止把本地演示描述为生产可用。
3. 云函数、订阅消息、真机权限和双设备流程尚未形成自动化回归。
4. `project.config.json` 的 AppID 属于本地配置，不应提交真实密钥或凭据。

## 下一步

- 为每个新功能建立 `docs/specs/active/<feature>/`。
- 先完成 Spec、Plan、Tasks，再修改业务代码。
- 每个功能至少留下静态检查和运行时验证记录。
- 在 `rainno` 完成本地验证和人工确认后，再考虑向上游仓库发起 PR。
