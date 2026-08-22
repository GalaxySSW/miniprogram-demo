# CloudBase 集合与索引

本文件是积分账本上线前的初始化清单。当前代码不会自动创建集合或索引，也不会写入真实账户。

## `ai_accounts`

文档 ID：`sha256("account:" + OPENID)`。不保存明文 OPENID。

```text
_id
openidHash
available        number
reserved         number
grantedTotal     number
consumedTotal    number
status           active | frozen
planId           string | null
planVersion      string | null
version          number
freezeReason     string | null
createdAt        date
updatedAt        date
```

建议索引：`status + updatedAt`、`planId + planVersion`。

## `ai_usage`

文档 ID：`sha256("usage:" + OPENID + ":" + idempotencyKey)`。

```text
_id
requestId
idempotencyKey
openidHash
action
model
priceVersion
inputHash
reservedCredits  number
chargedCredits   number
state            reserved | settled | released | expired | refunded
leaseExpiresAt   date
resultHash       string | null
errorCode        string | null
createdAt        date
updatedAt        date
```

建议索引：`openidHash + createdAt`、`state + leaseExpiresAt`、`requestId`。

## `ai_credit_ledger`

不可变流水。预扣、结算、释放和后台发放/扣回使用确定性文档 ID，避免重复写入。

```text
_id
openidHash
usageId
type             reserve | settled | released | grant | revoke
delta            number
balanceAfter     number
operationId
operatorOpenidHash  string | null
reason           string | null
errorCode        string | null
createdAt        date
```

建议索引：`openidHash + createdAt`、`operationId`、`usageId + type`。

## `ai_admin_audit`

管理员操作的不可变摘要，不保存案件原文、Prompt 或模型密钥。

```text
_id
operationId
action
operatorOpenidHash
targetOpenidHash
reason
beforeSummary
afterSummary
createdAt
```

建议索引：`targetOpenidHash + createdAt`、`action + createdAt`、`operationId`。

## `ai_plans`

套餐/价格版本配置。客户端不能写入，后台只允许受控配置。

```text
_id
planId
version
actionCosts
dailyLimit
monthlyLimit
initialGrant
allowedActions
effectiveAt
status             draft | active | retired
```

## 初始化顺序

1. 创建集合和索引。
2. 通过后台 `admin.credit.grant` 为测试 OPENID 发放少量积分。
3. 使用 `BILLING_MODE=enforced` 验证 `intake`。
4. 验证成功结算、失败释放、重复请求和余额不足。
5. 验证管理员审计后，才考虑扩大 action 范围。
