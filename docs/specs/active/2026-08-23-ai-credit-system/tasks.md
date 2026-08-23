# Tasks：模型调用积分体系与账户额度

每个任务应有单一结果、明确文件范围和可执行验证。

## 并行执行波次

### Wave 0：主 agent 冻结合同

- 只由主 agent 执行：完成 T0、T0.1，冻结价格、计费所有者、管理员身份、失败退款和数据库并发策略。
- 产出：更新 `spec.md`、`plan.md`、`context.md`，不修改业务源码。

### Wave 1：建立接缝后并行

以下 agent 可以并行，但必须使用 disjoint 写入范围：

- **契约 agent**：定义 action registry、价格版本、billing Envelope、幂等键和状态枚举；只修改 spec/contract 文档。
- **账本 agent**：实现 `cloudfunctions/judge/billing/` 新模块、价格解析、幂等和状态机，不修改 `judge/index.js`。
- **前端 agent**：实现 `utils/ai.js` 的 billing 结果适配和指定页面状态，不修改云函数。
- **后台 agent**：实现管理员配置模块或独立后台 action，不修改 judge 普通调用主流程。
- **验证 agent**：新增 `docs/qa/` 场景、数据夹具和账务一致性验证，不修改业务源码。
- **运行验证 agent**：只负责微信开发者工具/MCP 场景和证据模板，不修改业务源码。

### Wave 2：主 agent 集成

- 由主 agent 顺序修改 `judge/index.js` 和必要的公共协议；`casedb/index.js` 只有在补案件成员鉴权或 Phase 2 计费归属时才单独评审修改，积分 MVP 默认不碰。
- 每次只接入一个边界：先 requestId/只读计量，再预扣结算，再管理员配置。
- 不在集成阶段同时改 UI 视觉、案件状态机或 Prompt 体系。

### Wave 3：并行验证与单点收口

- 验证 agent 可并行执行静态检查和 Mock 场景。
- 主 agent 负责微信开发者工具编译、MCP 冒烟和最终 `verification.md`。
- 所有结果通过后，才将对应任务从 `[ ]` 改为 `[x]`。

### 冲突处理原则

1. 同一文件同一波次不允许两个 agent 同时写。
2. 新增模块可以并行，单体入口文件只能由主 agent 集成。
3. 先保留接口兼容，再清理旧逻辑；不以“顺手重构”为由扩大 diff。
4. 任一 agent 修改超出约定范围，主 agent 可以只摘取局部补丁或要求返工。
5. 每个波次都必须有可回滚点：Wave 1 为未接入的新模块，Wave 2 为单一集成边界，Wave 3 为验证证据。

### 合并门禁

- **Gate 0：Spec 冻结**：价格、Phase 1 独立 action 计费、计费所有者、失败退款、管理员身份和 billing 开关全部有结论；trial bundle 明确延期。
- **Gate 1：静态检查**：JS/JSON、action 白名单、模型标识、敏感日志、Git 文件边界通过。
- **Gate 2：账务核心**：余额不足不调用模型；并发不出现负余额；同一幂等键最多一次预扣和一次终态结算。
- **Gate 3：云函数集成**：所有 judge 出口都能进入 `settled / released / refunded` 之一。
- **Gate 4：开发者工具**：本地 Mock 编译通过；调用过程中无积分弹窗，额度不足/失败为页面内非阻塞状态，结束页账单口径正确。
- **Gate 5：MCP 冒烟**：正常、额度不足、模型失败、重复点击、图片和语音链路都有路由/数据断言。

推荐通过开关逐步启用：`BILLING_MODE=shadow → mock → enforced`。账务异常时先回到 `mock` 或 `shadow`，不删除账本，用补偿流水修复。

## 开发前置

- [ ] T0 冻结 action 价格、Phase 1 独立 action 计费、失败退款和管理员身份方案；文件：`spec.md`、`context.md`；验收：trial bundle 明确延期，未决问题全部有结论。
- [x] T0.1 确认微信云数据库事务/条件更新能力；文件：`plan.md`、`verification.md`；验收：选择 `@cloudbase/node-sdk` 事务实现；开发者工具真实云函数权限仍需人工确认。

## P0：只读计量

- [x] T1 统一生成 requestId 和 idempotencyKey；文件：`cloudfunctions/judge/index.js`、`utils/ai.js`；验收：每个 action 都能关联一次请求；验证：并发中的重复调用复用同一幂等键。
- [ ] T2 记录模型、Prompt/Schema 版本、耗时和 token usage；文件：`cloudfunctions/judge/index.js`、`ai_usage` 设计；验收：不记录完整陈述和 Prompt；验证：脱敏检查。当前只完成响应中的模型和价格版本，token usage 待账本适配器接入。
- [x] T2.1 固化 Demo 账单展示规则；文件：相关 spec 与结束页适配；验收：调用过程中无积分 modal/toast，最后庭审结束页只展示一次页面内的累计消耗/预计消耗；验证：静态检查、积分层行为脚本和 MCP 结案卡渲染已通过，真实四类云端账务场景仍待部署后补测。

## P1：服务端账本

- [x] T3 建立账户、套餐、账本和调用记录数据结构；文件：`cloudfunctions/judge/billing/`；验收：字段、状态和版本齐全；验证：纯模块和静态检查通过，云端集合尚未写入真实数据。
- [x] T4 实现积分预扣和额度上限；文件：`cloudfunctions/judge/billing/cloudbase.js`；验收：事务中余额不足不调用模型，并发写冲突由事务处理；验证：纯模块重复/不足场景通过，真实并发待云端验证。
- [x] T5 接入模型调用成功结算、失败释放、Schema 失败退款；文件：`cloudfunctions/judge/index.js`；验收：enforced 链路所有出口都有账务状态；验证：本地 shadow/enforced 门禁通过，真实上游错误待云端验证。
- [x] T6 统一返回 billing 字段；文件：`cloudfunctions/judge/index.js`、`utils/ai.js`；验收：页面保留原始 result 兼容，同时记录 billing 状态；验证：MCP 页面冒烟通过。

## P2：后台账户配置

- [x] T7 实现管理员身份校验和账户查询；文件：`cloudfunctions/billing-admin/index.js`；验收：默认拒绝未配置白名单和非管理员；验证：静态检查通过，真实 OPENID 权限待云端确认。
- [x] T8 实现发放、扣回、分配套餐、临时覆盖和冻结；文件：`cloudfunctions/billing-admin/index.js`；验收：变更要求 operationId、原因和审计记录；验证：事务代码静态检查通过，真实数据变更未执行。
- [x] T9 增加额度配置和调用记录查询 action；文件：`cloudfunctions/billing-admin/index.js`；验收：只返回摘要、哈希和脱敏审计字段；验证：静态检查通过，后台 UI 暂不进入小程序主包。

## 验证与交付

- [ ] T10 补齐正常、失败、重复、额度不足、并发和管理员配置验证证据；文件：`verification.md`；当前已完成本地账本、Mock、DevTools/MCP 页面证据，真实 CloudBase 数据链路和管理员权限仍待人工环境确认。
- [ ] T11 更新 `context.md`、`verification.md`、`docs/status.md` 和技术架构；验收：实现状态、未验证事项和回滚开关准确。
- [ ] T12（Phase 2）补齐 `trialRunId`、`caseDocId`、`caseVersion`、`billingGroupId` 和服务端案件所有者鉴权后，再设计 `verdict + verdictDepth` 合并计费；验收：不影响 Phase 1 独立 action 账单。

## 当前阻塞

- action 价格仍需最终确认；Phase 1 独立 action 已确定，trial bundle 延期。
- 计费所有者和管理员身份方案未确认。
- 微信云数据库事务/条件更新能力未验证。
- 当前项目没有正式后台入口。

## 下一步

1. 先完成 T0–T0.1 和 T2.1，不接支付；先把 trial bundle 从 MVP 范围移除。
2. 冻结方案后先做 T1–T2 只读计量，确保不会影响现有 Mock 主流程。
3. 通过验证后再实现 T3–T6 服务端账本。
