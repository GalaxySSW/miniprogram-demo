// 和好约定（三选一）+ 递石子（冷战通道，每日上限 3）
const app = getApp()

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
    this.setData({
      fromNotNow: options.from === 'notnow',
      pebbles: new Array(app.globalData.caseData.pebblesToday).fill(1)
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
    app.globalData.caseData.status = 'closed'
    wx.showToast({ title: '三天后，本庭会回来问问', icon: 'none', duration: 2000 })
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/history/history' })
    }, 2000)
  },
  dropPebble(e) {
    const c = app.globalData.caseData
    if (c.pebblesToday >= this.data.maxPebbles) return
    c.pebblesToday += 1
    this.setData({ pebbles: new Array(c.pebblesToday).fill(1) })
    wx.showToast({ title: `递出了${e.currentTarget.dataset.type} · TA 会收到`, icon: 'none' })
  }
})
