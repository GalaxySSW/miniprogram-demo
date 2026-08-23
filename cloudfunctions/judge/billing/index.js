// 积分计费边界：先提供价格、统一响应和运行模式接缝。
// Phase 1 的数据库预扣/结算由 ledger.js 的纯模块验证后再接入 CloudBase。

const PRICE_VERSION = process.env.AI_PRICE_VERSION || 'mvp-v1'

const ACTIONS = {
  intake: { cost: 1, model: 'deepseek/deepseek-v4-flash' },
  brief: { cost: 1, model: 'deepseek/deepseek-v4-flash' },
  quickReply: { cost: 1, model: 'deepseek/deepseek-v4-flash' },
  interviewTurn: { cost: 2, model: 'deepseek/deepseek-v4-flash' },
  supplement: { cost: 2, model: 'deepseek/deepseek-v4-flash' },
  interview: { cost: 3, model: 'deepseek/deepseek-v4-flash' },
  verdict: { cost: 6, model: 'deepseek/deepseek-v4-flash' },
  verdictDepth: { cost: 4, model: 'deepseek/deepseek-v4-flash' },
  readScreenshots: { cost: 3, model: process.env.AI_VISION_MODEL || 'gpt-4o-mini' },
  transcribe: { cost: 2, model: process.env.AI_ASR_MODEL || 'gpt-4o-transcribe' },
  ping: { cost: 0, model: 'none' }
}

function quoteAction(action) {
  const config = ACTIONS[action]
  if (!config) return null
  return {
    action,
    cost: config.cost,
    model: config.model,
    priceVersion: PRICE_VERSION
  }
}

function billingEnvelope({ requestId, quote, status, charged = 0, balance = null, errorCode = null }) {
  return {
    status,
    requestId: requestId || null,
    cost: quote ? quote.cost : 0,
    charged,
    balance,
    priceVersion: quote ? quote.priceVersion : PRICE_VERSION,
    model: quote ? quote.model : null,
    errorCode
  }
}

function billingMode() {
  // 黑客松验收以真实账本为准；本地需要演示时显式设置 BILLING_MODE=mock。
  return String(process.env.BILLING_MODE || 'enforced').toLowerCase()
}

function isBillable(action) {
  const quote = quoteAction(action)
  return Boolean(quote && quote.cost > 0)
}

function createCloudBaseLedger(context) {
  try {
    return require('./cloudbase').createCloudBaseLedger({ context })
  } catch (error) {
    const wrapped = new Error(`账本适配器不可用: ${error.message}`)
    wrapped.code = 'BILLING_ADAPTER_UNAVAILABLE'
    throw wrapped
  }
}

module.exports = {
  ACTIONS,
  PRICE_VERSION,
  billingEnvelope,
  billingMode,
  createCloudBaseLedger,
  isBillable,
  quoteAction
}
