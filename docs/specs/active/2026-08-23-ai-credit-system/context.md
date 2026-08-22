# Session Context：模型调用积分体系与账户额度

- 最后更新：2026-08-23
- 当前分支：`rainno`
- 当前提交：`4bdf528`
- 当前状态：CloudBase 适配器、后台 action 和 DevTools/MCP 冒烟已实现/通过；真实云端账务写入尚未执行

## 本次已完成

- 基于当前 `judge`、`casedb`、AI 路由和技术架构完成积分体系设计。
- 将方案拆为独立 spec，不混入现有 Home spec。
- 将实现拆成主 agent 集成轨道，以及契约、账本、事务 spike、前端、后台、验证、运行验证多条 subagent 轨道；并行 agent 只写独占文件，主 agent 收口单体入口。
- 明确第一阶段不接支付，只做账号额度、服务端扣费和后台配置。

## 实际修改文件

- 本 spec 目录下的 `spec.md`、`plan.md`、`tasks.md`、`context.md`、`verification.md`。
- `cloudfunctions/judge/index.js`：接入 billing Envelope、模式开关和 DeepSeek V4 Flash 默认标识。
- `cloudfunctions/judge/billing/index.js`：价格表、模型映射和 billing 模式接缝。
- `cloudfunctions/judge/billing/ledger.js`、`ledger.test.js`：纯内存账本状态机和本地测试。
- `cloudfunctions/judge/billing/cloudbase.js`：CloudBase Node SDK 事务适配器。
- `cloudfunctions/billing-admin/`：后台权限、账户、积分变更、套餐、冻结和审计 action。
- `utils/ai.js`：请求 requestId、并发期幂等键和 billing 调试状态。
- 本次没有执行真实数据库写入、支付、管理员 UI 或真实用户数据变更。

## 已确认决策

- 账号以服务端微信 OPENID 为主键。
- 模型费用由服务端 action 配置决定，客户端不能传费用。
- 使用预扣、结算、释放和幂等键，避免并发重复扣费。
- 文本模型标识为 `deepseek/deepseek-v4-flash`。
- 图片/语音费用按预处理 + 统一文本处理链设计，可按最终配置调整。
- 现阶段不实现支付、充值、订阅或动态 Token 计费。
- 单体入口 `judge/index.js`、`casedb/index.js` 和 `utils/ai.js` 不允许多个 agent 同时修改，由主 agent 统一集成。
- 已完成首批 `billing/index.js`、`billing/ledger.js` 和 `ledger.test.js`；默认 `BILLING_MODE=shadow`，不会真实扣费。
- `judge` 默认文本模型已统一为 `deepseek/deepseek-v4-flash`；前端请求已携带 `requestId` 和并发期幂等键。
- MVP 第一阶段按逻辑 action 独立计费；`verdictDepth` 不与 `verdict` 合并扣费，trial bundle 延后到补齐案件版本和计费组标识后。
- `casedb` 不承载积分账户；Phase 1 账本模块贴近 `judge`，后台管理 action 独立鉴权，后续可再抽成独立 billing 云函数。
- CloudBase 事务实现使用 `@cloudbase/node-sdk`；真实云函数环境必须配置环境认证后再切换 `BILLING_MODE=enforced`。

## 未决问题/阻塞

- 最终 action 价格和默认套餐数值。
- Phase 1 当前调用者/案件发起方的归属策略。
- 管理员白名单还是角色集合。
- 云端集合/索引、服务端认证和管理员 OPENID 白名单尚未在当前环境配置。
- 第一版是否在用户页面展示余额。
- 当前 subagent 并发槽位受平台上限影响，后续恢复后按 `plan.md` 的 Wave 1 启动并行任务。

## 验证结果

- 静态检查：`judge/index.js`、billing 模块和 `utils/ai.js` 已通过 `node --check`。
- 纯账本：`ledger.test.js` 已通过，覆盖预扣、重复请求、额度不足、结算、释放和幂等冲突。
- Mock/开发者工具：模拟器页面加载和输入冒烟通过；未执行真实 AI/账务调用。
- MCP：首页→证据页 7/7、statement 输入 6/6；健康检查 connected；真机/双设备未开始。

## 下一次会话第一步

下一步配置云函数环境和集合/索引，用测试 OPENID 完成一次 `intake` 的 enforced 预扣/结算，再执行失败释放和管理员幂等验证。
