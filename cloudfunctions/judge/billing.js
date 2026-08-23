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

// 黑客松期间积分系统整体关闭：不预扣、不拦截、不需要初始化账户。
// 要恢复：把 BILLING_DISABLED 改回 false，并在控制台设 BILLING_MODE=enforced。
const BILLING_DISABLED = true

function billingMode() {
  if (BILLING_DISABLED) return 'mock'
  // 默认 shadow：照常记账，但不拦截 AI 调用。
  //
  // 改这个默认值是因为 enforced 会在账本里预扣积分，而账户未初始化时 reserve 直接抛
  // ACCOUNT_NOT_INITIALIZED——结果是所有计费动作（判决、语音、截图直读…）全部失败，
  // 前端的 demo 静默开关只让前端不弹窗，挡不住服务端。演示环境不能带着这个风险。
  //
  // 要恢复真实扣费：在云函数控制台把环境变量 BILLING_MODE 设为 enforced，
  // 并先用 billing-admin 给参与演示的 openid 发放积分。
  return String(process.env.BILLING_MODE || 'shadow').toLowerCase()
}

function isBillable(action) {
  if (BILLING_DISABLED) return false
  const quote = quoteAction(action)
  return Boolean(quote && quote.cost > 0)
}

function createCloudBaseLedger(context) {
  try {
    return require('./billing-cloudbase').createCloudBaseLedger({ context })
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
