// 和好约定（三选一，由判官针对本案生成）+ 递石子（冷战通道，每日上限 3）
const app = getApp()
const casedb = require('../../utils/casedb.js')

// 云开发不可用时的兜底：通用但仍然具体的三条
const FALLBACK = [
  { title: '出行提前一句', desc: '出差或晚归，提前发一句话——哪怕只有五个字。' },
  { title: '十分钟不打断', desc: '每周找十分钟，一个人说，另一个人只听。' },
  { title: '睡前不带气', desc: '再生气，睡前也说一句「明天再聊，晚安」。' }
]

Page({
  data: {
    fromNotNow: false,
    pacts: FALLBACK,
    fromAI: false,
    pactIdx: -1,
    pebbles: [],
    pebbleTypes: ['一首歌', '一张图', '一个表情'],
    maxPebbles: 3
  },
  onLoad(options) {
    const g = app.globalData
    const v = g.verdict || {}

    // 判官针对本案给的三个选项优先；旧版只有单个 pactTitle 的也兼容
    let pacts = null
    if (Array.isArray(v.pacts) && v.pacts.length) {
      pacts = v.pacts.filter(p => p && p.title).slice(0, 3)
    } else if (v.pactTitle) {
      pacts = [{ title: v.pactTitle, desc: v.pactDesc || '' }].concat(FALLBACK.slice(0, 2))
    }

    this.setData({
      pacts: pacts && pacts.length ? pacts : FALLBACK,
      fromAI: !!(pacts && pacts.length),
      fromNotNow: options.from === 'notnow',
      pebbles: new Array(g.caseData.pebblesToday).fill(1)
    })
  },
  pickPact(e) {
    this.setData({ pactIdx: e.currentTarget.dataset.idx })
  },
  confirmPact() {
    if (this.data.pactIdx < 0) {
      wx.showToast({ title: '先选一件小事', icon: 'none' })
      return
    }
    const c = app.globalData.caseData
    const pact = this.data.pacts[this.data.pactIdx]
    c.status = 'closed'
    c.pact = pact
    wx.showToast({ title: '三天后，本庭会回来问问', icon: 'none', duration: 2000 })
    if (c.docId) casedb.savePact(c.docId, pact)
    setTimeout(() => wx.redirectTo({ url: '/pages/history/history' }), 2000)
  },
  dropPebble(e) {
    const c = app.globalData.caseData
    if (c.pebblesToday >= this.data.maxPebbles) return
    const type = e.currentTarget.dataset.type

    const bump = () => {
      c.pebblesToday += 1
      this.setData({ pebbles: new Array(c.pebblesToday).fill(1) })
      wx.showToast({ title: `递出了${type} · TA 会收到`, icon: 'none' })
    }
    if (c.docId) {
      casedb.pebble(c.docId, type).then(res => {
        if (res) bump()
        else wx.showToast({ title: '今天够了，去说句话吧', icon: 'none' })
      })
    } else {
      bump()
    }
  }
})
