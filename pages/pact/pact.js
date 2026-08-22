// 和好约定（三选一）+ 递石子（冷战通道，每日上限 3）
const app = getApp()
const casedb = require('../../utils/casedb.js')

Page({
  data: {
    fromNotNow: false,
    pacts: [
      { title: '出行提前一句', desc: '出差或晚归，提前发一句话——哪怕只有五个字。' },
      { title: '十分钟不打断', desc: '每周找十分钟，一个人说，另一个人只听。' },
      { title: '睡前不带气', desc: '再生气，睡前也说一句「明天再聊，晚安」。' }
    ],
    pactIdx: -1,
    pebbles: [],
    pebbleTypes: ['一首歌', '一张图', '一个表情'],
    maxPebbles: 3
  },
  onLoad(options) {
    const g = app.globalData
    // 判决书里已生成的约定优先，否则用三选一
    if (g.verdict && g.verdict.pactTitle) {
      const pacts = this.data.pacts.slice()
      pacts.unshift({ title: g.verdict.pactTitle, desc: g.verdict.pactDesc || '' })
      this.setData({ pacts })
    }
    this.setData({
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
