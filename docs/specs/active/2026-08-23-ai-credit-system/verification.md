# Verification：模型调用积分体系与账户额度

- 日期：2026-08-23
- 分支：`rainno`
- Commit：`4bdf528`
- 环境：本地 Node、微信开发者工具模拟器和 `weapp-agent-mcp`；未执行真实积分写入

## 修改范围

本轮完成 CloudBase 事务适配器、三个账务集合写入代码、`judge` enforced 链路和独立后台管理云函数；没有执行真实账户发放/扣回、支付或后台 UI。

## 入口和操作步骤

规格阶段暂不执行真实扣费。实现后至少覆盖：

1. 账号首次调用并获得默认套餐。
2. 余额充足时调用文本、图片和语音链路。
3. 余额不足时提交请求。
4. 预扣后模拟超时、上游错误和 Schema 错误。
5. 重复提交相同 idempotencyKey。
6. 管理员发放、扣回、分配套餐和冻结账号。

## 预期结果

- 每次请求有 requestId 和唯一幂等键。
- 余额不足不触发外部模型调用。
- 失败释放预扣，成功只结算一次。
- 并发请求不会出现负余额或重复账本。
- 普通用户不能修改账户或查看他人账本。
- 后台操作带操作者、原因和时间。

## 检查结果

- JavaScript：通过 `node --check` 检查 `judge/index.js`、billing 模块和 `utils/ai.js`。
- 账本纯模块：通过 `node cloudfunctions/judge/billing/ledger.test.js`；覆盖预扣、重复请求、额度不足、成功结算、失败释放和幂等冲突。
- 云函数模式：`BILLING_MODE=shadow` 无 key 时返回明确未扣费状态；`BILLING_MODE=enforced` 无服务端 OPENID 时拒绝执行，未调用模型。
- 模型映射：`verdict` quote 返回 `deepseek/deepseek-v4-flash`。
- CloudBase 适配器：`@cloudbase/node-sdk` 事务代码已通过静态加载检查；没有配置 API Key/云端权限，因此未执行真实数据库变更。
- JSON：未涉及。
- 页面注册/路由：不涉及。
- 微信开发者工具编译：连接成功，SDK 2.32.3，模拟器 iPhone 15 Pro Max；页面可加载。
- MCP 首页→证据页：7/7 通过，报告见 [home-evidence-smoke.md](../../qa/credit-system/home-evidence-smoke.md)。
- MCP statement 输入：6/6 通过，报告见 [statement-input-smoke.md](../../qa/credit-system/statement-input-smoke.md)。
- MCP 截图：已保存 [statement-input-smoke.png](../../qa/credit-system/statement-input-smoke.png)。
- MCP 健康检查：connected，WebSocket 9420，日志监听正常；最近 120 秒无控制台日志。
- 真机/双设备：未执行。

## 证据

- 本轮证据为 Node 静态检查、账本测试、CloudBase 适配器加载、开发者工具连接、MCP 场景报告和截图。

## 未验证事项与风险

- 微信云数据库事务的真实权限、集合创建、索引和写入结果尚未在当前环境执行。
- 后台管理员 OPENID 白名单尚未配置，后台变更 action 未调用。
- 实际云函数环境中的 AI 模型可用性和 Token usage 返回格式。
- 管理员后台的登录、角色和网络边界。
- 真实数据删除、账本保留和合规期限。

## 下一步

1. 在微信云函数环境安装依赖并配置 `CLOUDBASE_ENV_ID`/服务端认证和 `ADMIN_OPENIDS`。
2. 建立 `ai_accounts`、`ai_usage`、`ai_credit_ledger`、`ai_admin_audit`、`ai_plans` 集合和必要索引。
3. 先用测试 OPENID 发放少量积分，再以 `BILLING_MODE=enforced` 验证 `intake` 的预扣、结算和失败释放。
4. 最后执行管理员 action 和并发请求验证；完成后才考虑默认切换到 `enforced`。

## 结论

Wave 1 seam implemented / Local ledger verified / CloudBase runtime not verified
