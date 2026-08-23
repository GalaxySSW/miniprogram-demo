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
- AI 调用过程中不出现积分 modal/toast。
- 最后庭审结束页以内嵌区域展示一次本次庭审累计消耗；`shadow/mock/not_charged` 显示预计消耗。
- 额度不足、调用失败和未知账单状态均为页面内非阻塞状态；`released` 不计入消耗。

## Demo 账单展示验证矩阵

| 场景 | 结束页文案口径 | 过程交互 | 通过条件 |
|---|---|---|---|
| `settled` | 本次消耗 N 积分 | 无积分 modal/toast | 只展示一次页面内摘要 |
| `shadow/mock/not_charged` | 本次预计消耗 N 积分 | 无积分 modal/toast | 不宣称真实扣费 |
| 额度不足 | 页面内额度不足状态 | 不阻塞，可返回/重试 | 未调用模型 |
| 失败并 `released` | 页面内失败/已释放状态 | 不阻塞，可重试 | 释放金额不计入消耗 |
| 未知账单状态 | 页面内账单待核对 | 不阻塞 | 不展示伪造数字 |

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
- MCP 健康检查：已恢复，WebSocket 9420 可达；本轮连接初始化曾因控制台日志启用超时，重试后 automator 会话建立成功。
- MCP 关键入口冒烟：Home、History、Case Detail、Profile 均已通过；Profile 积分卡在 `billing-account` 尚未部署时正确显示“暂不可用”。
- Demo 静默积分和庭审结束页账单摘要：已完成静态检查；积分层 Demo 静默放行、真实额度不足非阻塞路径和汇总语义脚本通过；MCP 已连接 `pages/verdict/verdict`，注入 Demo 摘要状态后 `qa-verdict-billing` 元素可读。未执行真实云端扣费/释放链路。
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

1. 上传新增的 `billing-account` 云函数；2026-08-23 使用 CloudBase CLI 重试 2 次，均因 `getCloudAPISignedHeader` 返回 `ret=1000 system error` 失败，尚未部署。
2. 在微信云函数环境配置 `CLOUDBASE_ENV_ID`/服务端认证和 `ADMIN_OPENIDS`；当前本地未发现管理员 OPENID，不能安全写入白名单。
3. 建立 `ai_accounts`、`ai_usage`、`ai_credit_ledger`、`ai_admin_audit`、`ai_plans` 集合和必要索引；当前 CLI 仅提供云函数命令，没有数据库集合/索引命令，需通过 CloudBase 控制台或已有初始化函数完成。
4. 先用测试 OPENID 发放少量积分，再以 `BILLING_MODE=enforced` 验证 `intake` 的预扣、结算和失败释放。

## 本轮环境联调记录（2026-08-23）

| 项目 | 结果 | 证据/阻塞 |
|---|---|---|
| CloudBase 环境查询 | 已确认 | `cloud1-d5gwslwa351e26c8e` |
| 已部署云函数 | 已确认 | `casedb`、`judge`、`probefn`；没有 `billing-account` |
| `billing-account` 上传 | 阻塞 | 两次均为 `getCloudAPISignedHeader` / `ret=1000 system error` |
| MCP 运行时连接 | 已恢复 | 开启自动拉起后，9420 已监听；首次日志初始化超时，重试后连接成功 |
| `ADMIN_OPENIDS` | 未配置 | `whoami` 临时云函数已在本地创建，尚未上传；取得管理员 OPENID 后再配置 |
| 积分集合与索引 | 未创建 | 当前 CLI 未提供数据库管理命令 |
4. 最后执行管理员 action 和并发请求验证；完成后才考虑默认切换到 `enforced`。

5. 云端账务可用后，用模拟器/MCP 复核：至少一次正常结束、一次 `not_charged`、一次额度不足和一次失败释放；确认过程中无积分 modal/toast。

## 结论

Wave 1 seam implemented / Local ledger verified / CloudBase runtime not verified
