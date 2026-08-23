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

function refresh() {
  return callAccount().then(account => {
    const app = getApp()
    app.globalData.creditAccount = account
    return account
  })
}

function ensureBeforeCall(action) {
  const q = quote(action)
  if (!q.cost) return Promise.resolve({ allowed: true, quote: q, account: null })
  return refresh().then(account => {
    const available = account ? Number(account.available || 0) : null
    const blocked = account && (account.status !== 'active' || available < q.cost)
    if (blocked) {
      wx.showModal({
        title: account.status === 'active' ? '积分不够了' : '积分账户暂不可用',
        content: account.status === 'active'
          ? `本次预计消耗 ${q.cost} 积分，当前可用 ${available} 积分。`
          : '请联系管理员配置或解冻你的积分账户。',
        confirmText: '查看积分',
        cancelText: '返回',
        success: result => { if (result.confirm) wx.navigateTo({ url: '/pages/profile/profile' }) }
      })
      return { allowed: false, quote: q, account }
    }
    return new Promise(resolve => wx.showModal({
      title: '本次 AI 调用',
      content: account
        ? `预计消耗 ${q.cost} 积分，调用后预计剩余 ${available - q.cost} 积分。`
        : `预计消耗 ${q.cost} 积分。账户余额将在服务端校验。`,
      confirmText: '继续',
      cancelText: '稍后',
      success: result => resolve({ allowed: !!result.confirm, quote: q, account })
    }))
  })
}

module.exports = { ACTION_COSTS, quote, refresh, ensureBeforeCall }
