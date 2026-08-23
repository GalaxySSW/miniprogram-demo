// 本庭约定：判官针对本案拟三条，一方选定 → 另一方点头 → 双方齐了才算了结
const app = getApp()
const casedb = require('../../utils/casedb.js')
const notify = require('../../utils/notify.js')

// 云开发不可用时的兜底：通用但仍然具体的三条
const FALLBACK = [
  { title: '出行提前一句', desc: '出差或晚归，提前发一句话——哪怕只有五个字。' },
  { title: '十分钟不打断', desc: '每周找十分钟，一个人说，另一个人只听。' },
  { title: '睡前不带气', desc: '再生气，睡前也说一句「明天再聊，晚安」。' }
]

Page({
  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  },
  data: {
    stage: 'choose',      // choose 我来选 | wait 等 TA 点头 | confirm TA 选了等我点头 | done 双方齐了
    pacts: FALLBACK,
    fromAI: false,
    pactIdx: -1,
    wantReview: false,
    chosen: null,
    submitting: false,
    syncLoading: false,
    error: ''
  },

  onLoad() {
    const v = app.globalData.verdict || {}
    let pacts = null
    if (Array.isArray(v.pacts) && v.pacts.length) {
      pacts = v.pacts.filter(p => p && p.title).slice(0, 3)
    } else if (v.pactTitle) {
      pacts = [{ title: v.pactTitle, desc: v.pactDesc || '' }].concat(FALLBACK.slice(0, 2))
    }
    this.setData({
      pacts: pacts && pacts.length ? pacts : FALLBACK,
      fromAI: !!(pacts && pacts.length)
    })
  },

  onShow() {
    const c = app.globalData.caseData
    if (c.docId) notify.markSeen({ docId: c.docId, kind: 'pact' })
    this.sync()
  },

  // 约定是双向的，每次进来都要看看对面走到哪一步了
  sync() {
    const c = app.globalData.caseData
    if (!c.docId) return
    this.setData({ syncLoading: true, error: '' })
    casedb.getCase(c.docId).then(r => {
      if (!r || !r.pact) return this.setData({ syncLoading: false })
      c.pact = r.pact
      this.setData({
        syncLoading: false,
        chosen: r.pact,
        stage: r.pactBoth ? 'done' : (r.pactMine ? 'wait' : 'confirm')
      })
    }).catch(() => this.setData({ syncLoading: false, error: '本庭暂时没同步到最新约定，请重试。' }))
  },

  toggleReview() { this.setData({ wantReview: !this.data.wantReview }) },
  pickPact(e) { this.setData({ pactIdx: e.currentTarget.dataset.idx }) },

  // 我来定这一件
  choose() {
    if (this.data.pactIdx < 0) return wx.showToast({ title: '先选一件小事', icon: 'none' })
    if (this.data.submitting) return
    this.setData({ submitting: true, error: '' })

    const c = app.globalData.caseData
    const pact = this.data.pacts[this.data.pactIdx]
    c.pact = pact

    const done = () => {
      this.setData({ submitting: false, chosen: pact, stage: 'wait' })
      if (this.data.wantReview) notify.askSubscribe(['review'])
    }
    if (c.docId) casedb.savePact(c.docId, pact, this.data.wantReview).then(result => {
      if (app.globalData.cloudReady && !result) return this.setData({ submitting: false, error: '这件约定没有保存成功，请重试。' })
      done()
    })
      .catch(() => this.setData({ submitting: false, error: '这件约定暂时没保存好，请重试。' }))
    else done()
  },

  // TA 定了，我点头
  confirm() {
    if (this.data.submitting) return
    this.setData({ submitting: true, error: '' })
    const c = app.globalData.caseData
    if (!c.docId) {
      this.setData({ submitting: false, stage: 'done' })
      return
    }
    casedb.confirmPact(c.docId).then(r => {
      if (app.globalData.cloudReady && !r) return this.setData({ submitting: false, error: '点头状态没有保存成功，请重试。' })
      const both = !!(r && r.both)
      this.setData({ submitting: false, stage: both ? 'done' : 'wait' })
      if (both) c.status = 'closed'
      wx.showToast({ title: both ? '本案了结' : '已点头，等 TA', icon: 'none' })
    }).catch(() => this.setData({ submitting: false, error: '点头状态暂时没保存好，请重试。' }))
  },

  goPebble() { wx.navigateTo({ url: '/pages/pebble/pebble' }) },
  goHistory() { wx.redirectTo({ url: '/pages/history/history' }) },
  retry() { this.sync() },
  back() { wx.navigateBack({ delta: 1, fail: () => wx.reLaunch({ url: '/pages/home/home' }) }) }
})
