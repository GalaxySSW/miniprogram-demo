const ACTION_COSTS = {
  intake: 1,
  brief: 1,
  quickReply: 1,
  interviewTurn: 2,
  supplement: 2,
  interview: 3,
  verdict: 6,
  verdictDepth: 4,
  readScreenshots: 3,
  transcribe: 2
}

// 当前项目处于 Demo 阶段。真实模式由上层显式设置 app.globalData.billingDemo = false。
// 黑客松期间积分系统关闭：前端不查账户、不前置拦截、不弹额度提示
const BILLING_DISABLED = true
const DEFAULT_BILLING_DEMO = true

function callAccount() {
  const app = getApp()
  if (!wx.cloud || !app.globalData.cloudReady) return Promise.resolve(null)
  return wx.cloud.callFunction({ name: 'billing-account', data: { action: 'self' } })
    .then(res => res.result && res.result.ok ? res.result.result : null)
    .catch(error => {
      console.warn('[credits] 账户查询失败', error)
      return null
    })
}

function quote(action) {
  return { action, cost: Number(ACTION_COSTS[action] || 0), priceVersion: 'mvp-v1' }
}

function setNotice(notice) {
  const app = getApp()
  // 只写入全局状态，交由页面自行决定是否展示；积分层不主动打断用户。
  app.globalData.creditNotice = notice || null
  app.globalData.aiCreditNotice = notice || null
}

function isDemoMode(app) {
  if (app && app.globalData && typeof app.globalData.billingDemo === 'boolean') {
    return app.globalData.billingDemo
  }
  // 本地 mock / 未初始化云开发 / 当前 Demo 默认均静默放行。
  return !app || !app.globalData || app.globalData.cloudReady === false || DEFAULT_BILLING_DEMO
}

function refresh() {
  return callAccount().then(account => {
    const app = getApp()
    app.globalData.creditAccount = account
    return account
  })
}

function ensureBeforeCall(action) {
  const q = quote(action)
  if (BILLING_DISABLED) return Promise.resolve({ allowed: true, quote: q, account: null, mode: 'off' })
  if (!q.cost) return Promise.resolve({ allowed: true, quote: q, account: null })
  const app = getApp()

  // Demo 阶段不做前置拦截，也不弹窗；服务端仍可在真实模式下做最终校验。
  if (isDemoMode(app)) {
    setNotice(null)
    return Promise.resolve({ allowed: true, quote: q, account: app.globalData.creditAccount || null, mode: 'demo' })
  }

  return refresh().then(account => {
    const available = account ? Number(account.available || 0) : null
    const blocked = account && (account.status !== 'active' || available < q.cost)
    if (blocked) {
      const notice = {
        type: account.status === 'active' ? 'insufficient' : 'unavailable',
        action,
        cost: q.cost,
        available,
        message: account.status === 'active'
          ? `本次预计消耗 ${q.cost} 积分，当前可用 ${available} 积分。`
          : '积分账户暂不可用，请稍后重试或联系管理员。'
      }
      setNotice(notice)
      return { allowed: false, quote: q, account, notice }
    }
    // 真实模式也不做逐次确认；额度由服务端账本作为最终权威。
    setNotice(null)
    return { allowed: true, quote: q, account, remaining: account ? available - q.cost : null }
  })
}

// 结案页可用这些无副作用辅助汇总本次庭审账单。
function beginTrial(startedAt) {
  const value = Number(startedAt)
  return { startedAt: Number.isFinite(value) ? value : 0 }
}

function getTrialSummary(records, trial) {
  const startedAt = typeof trial === 'object' && trial ? Number(trial.startedAt || 0) : Number(trial || 0)
  const rows = Array.isArray(records) ? records : []
  const summary = {
    actionCount: 0,
    estimated: 0,
    charged: 0,
    released: 0,
    unknown: 0,
    consumed: 0,
    balance: null,
    mode: 'none'
  }

  rows.forEach(row => {
    if (!row || (startedAt && Number(row.at || 0) < startedAt)) return
    const billing = row.billing || row
    if (!billing || !billing.status) return
    const cost = Number(billing.cost || 0)
    const charged = Number(billing.charged || 0)
    summary.actionCount += 1
    if (Number.isFinite(charged) && charged > 0) summary.charged += charged
    if (billing.status === 'not_charged') summary.estimated += Number.isFinite(cost) ? cost : 0
    if (billing.status === 'released') summary.released += Number.isFinite(cost) ? cost : 0
    if (billing.status === 'unknown') summary.unknown += 1
    if (billing.balance !== null && billing.balance !== undefined) summary.balance = Number(billing.balance)
  })

  summary.consumed = summary.charged + summary.estimated
  if (summary.charged > 0 && summary.estimated > 0) summary.mode = 'mixed'
  else if (summary.charged > 0) summary.mode = 'charged'
  else if (summary.estimated > 0) summary.mode = 'estimated'
  return summary
}

module.exports = {
  ACTION_COSTS,
  quote,
  refresh,
  ensureBeforeCall,
  beginTrial,
  getTrialSummary
}
