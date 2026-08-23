// 判决书：公文结构，双方同时可见，仅此一版
// 判决主文按案件分型走不同措辞：纯误会 / 单边越界 / 认知错位
const app = getApp()
const notify = require('../../utils/notify.js')
const ai = require('../../utils/ai.js')
const credits = require('../../utils/credits.js')

// 印章随案件类型变：判的是什么，章上就写什么
const SEALS = {
  misunderstanding: { top: '误会', bottom: '有罪' },
  breach: { top: '有错', bottom: '可改' },
  mismatch: { top: '未曾', bottom: '对齐' },
  absent: { top: '待', bottom: '重审' }
}

const TRIAL_ACTIONS = ['verdict', 'verdictDepth']

function numberOrNull(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function billingRecords(g) {
  const history = g.aiBillingHistory || g.aiUsageHistory || g.aiBillingRecords
  if (Array.isArray(history) && history.length) return history
    .map(item => ({
      action: item.action || (item.billing || {}).action,
      at: item.at || item.createdAt || item.timestamp,
      billing: item.billing || item
    }))
    .filter(item => !item.action || TRIAL_ACTIONS.indexOf(item.action) !== -1)

  const last = g.aiLastResponse
  if (last && last.billing) {
    return [{ action: last.action, at: last.at, billing: last.billing }]
  }
  return []
}

function buildBillingSummary(g) {
  const startAt = Number(g.trialBillingStartAt || 0)
  const records = billingRecords(g).filter(item => {
    if (!startAt || !item.at) return true
    return Number(item.at) >= startAt
  })

  let settled = 0
  let estimated = 0
  let released = 0
  let unknown = 0
  let hasSettled = false
  let hasEstimate = false

  records.forEach(item => {
    const billing = item.billing || {}
    const status = String(billing.status || '').toLowerCase()
    const cost = numberOrNull(billing.cost)
    const charged = numberOrNull(billing.charged)
    if (status === 'settled') {
      settled += charged === null ? (cost || 0) : charged
      hasSettled = true
    } else if (['not_charged', 'shadow', 'mock', 'quoted'].indexOf(status) !== -1) {
      estimated += cost || 0
      hasEstimate = true
    } else if (['released', 'failed', 'cancelled', 'canceled'].indexOf(status) !== -1) {
      released += 1
    } else {
      unknown += 1
    }
  })

  // 本地 Demo 没有真实账单记录，但仍把本庭两次 AI 调用的预估成本讲清楚。
  const isLocalDemo = !g.cloudReady && records.length === 0
  if (isLocalDemo) {
    estimated = credits.quote('verdict').cost + credits.quote('verdictDepth').cost
    hasEstimate = true
  }

  const account = g.creditAccount
  const available = account && account.status === 'active' ? numberOrNull(account.available) : null
  if (hasSettled) {
    return {
      visible: true,
      title: '本次庭审消耗',
      amountVisible: true,
      amount: settled,
      tone: 'settled',
      detail: released || unknown ? '失败或释放的调用未计入本次消耗。' : '判决相关调用已完成结算。',
      hasRemaining: available !== null,
      remaining: available
    }
  }
  if (hasEstimate) {
    return {
      visible: true,
      title: '本次庭审预计消耗',
      amountVisible: true,
      amount: estimated,
      tone: 'estimated',
      detail: '当前为 Demo / shadow 模式，仅展示预估值，不代表已扣除积分。',
      hasRemaining: false,
      remaining: null
    }
  }
  if (released || unknown || (g.cloudReady && g.aiUsed === false)) {
    return {
      visible: true,
      title: '本次庭审未确认消耗',
      amountVisible: false,
      amount: 0,
      tone: 'unknown',
      detail: '失败、释放或未完成的调用未计入积分消耗。',
      hasRemaining: false,
      remaining: null
    }
  }
  return { visible: false, amountVisible: false, amount: 0, tone: '', detail: '', hasRemaining: false, remaining: null }
}

Page({
  data: {
    caseId: '',
    v: {},
    seal: SEALS.misunderstanding,
    sealed: false,
    isMock: false,
    absent: false,
    hasWords: false,
    hasSteps: false,
    hasGuide: false,
    depthLoading: false,
    depthError: '',
    billingSummary: {
      visible: false,
      amountVisible: false,
      amount: 0,
      title: '',
      detail: '',
      tone: '',
      hasRemaining: false,
      remaining: null
    }
  },
  onShow() {
    this.refreshBillingSummary()
  },
  onLoad() {
    const g = app.globalData
    g.caseData.status = 'tried'
    // 亲自看过判决书就不用再提醒了
    if (g.caseData.docId) notify.markSeen({ docId: g.caseData.docId, kind: 'verdict' })

    const v = { ...g.verdict }

    // 误会指数是全产品唯一的数字，AI 偶尔会给出越界值或字符串，这里归一
    const n = Math.round(Number(v.index))
    v.index = (isNaN(n) || n < 1 || n > 100) ? 87 : n

    // 缺席审判只听了一面之词，章上写「待重审」，不写任何带定性的字
    const type = v.absent ? 'absent' : (SEALS[v.caseType] ? v.caseType : 'misunderstanding')
    if (!v.verdictTitle) v.verdictTitle = '本案不存在被告。'

    // 从卷宗打开旧案时，云端那份可能缺字段——缺就整段不渲染，不留空标签
    const hasWords = !!(v.herWord && v.herMeaning) || !!(v.hisWord && v.hisMeaning)
    const hasSteps = !!(v.herStep || v.hisStep)
    if (!Array.isArray(v.herGuide)) v.herGuide = []
    if (!Array.isArray(v.hisGuide)) v.hisGuide = []
    const hasGuide = v.herGuide.length > 0 || v.hisGuide.length > 0

    this.setData({
      caseId: g.caseData.id,
      v,
      seal: SEALS[type],
      isMock: g.aiUsed === false,
      absent: !!v.absent,
      hasWords,
      hasSteps,
      hasGuide,
      billingSummary: buildBillingSummary(g)
    })
    setTimeout(() => this.setData({ sealed: true }), 2500)   // 跟着「本庭判决」那一段落下

    // 深度分析是并行生成的，回来了就补进页面；没有也不影响判决书本体
    const depth = app.globalData.depthPromise
    if (depth && !v.herNeed) {
      this.setData({ depthLoading: true })
      depth.then(d => this.applyDepth(d)).catch(() => this.setData({ depthLoading: false, depthError: '深度解读暂时没能补上，不影响这份判决书。' }))
    }
  },
  applyDepth(d) {
    if (!d) {
      this.setData({ depthLoading: false })
      this.refreshBillingSummary()
      return
    }
    const merged = { ...app.globalData.verdict, ...d }
    app.globalData.verdict = merged
    const m = { ...this.data.v, ...d }
    if (!Array.isArray(m.herGuide)) m.herGuide = []
    if (!Array.isArray(m.hisGuide)) m.hisGuide = []
    this.setData({ v: m, depthLoading: false, depthError: '', hasGuide: m.herGuide.length > 0 || m.hisGuide.length > 0 })
    this.refreshBillingSummary()
  },
  refreshBillingSummary() {
    this.setData({ billingSummary: buildBillingSummary(app.globalData) })
  },
  retryDepth() {
    if (this.data.depthLoading) return
    const c = app.globalData.caseData
    this.setData({ depthLoading: true, depthError: '' })
    ai.verdictDepth(c.myStatement, c.theirStatement)
      .then(d => this.applyDepth(d))
      .catch(() => this.setData({ depthLoading: false, depthError: '还是没补上深度解读，可以先看本庭判决。' }))
  },
  copyStep(e) {
    const text = e.currentTarget.dataset.text
    if (!text) return
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '已复制', icon: 'none' }) })
  },
  saveImage() {
    wx.navigateTo({ url: '/pages/poster/poster' })
  },
  supplement() {
    // 判决不是终点：觉得没说清就回去补充，补完重新审
    const side = app.globalData.caseData.side === 'a' ? 'a' : 'b'
    wx.navigateTo({ url: `/pages/interview/interview?mode=supplement&side=${side}` })
  },
  goPact() {
    wx.navigateTo({ url: '/pages/pact/pact' })
  },
  goHistory() {
    wx.redirectTo({ url: '/pages/history/history' })
  },
  back() {
    wx.navigateBack({ delta: 1, fail: () => wx.reLaunch({ url: '/pages/home/home' }) })
  }
})
