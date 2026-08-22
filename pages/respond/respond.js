// 对方应诉页：先看到 TA 本人写的那句话，再看到本庭是什么——先是人，再是工具
const app = getApp()
const casedb = require('../../utils/casedb.js')

Page({
  data: {
    note: ''
  },
  onLoad(options) {
    if (options.docId) {
      app.globalData.caseData.docId = options.docId
      casedb.getCase(options.docId).then(c => {
        if (c && c.note) this.setData({ note: c.note })
      })
    }
    // 单机演示时云端可能还没写入，用本地那份兜底
    if (!this.data.note && app.globalData.caseData.note) {
      this.setData({ note: app.globalData.caseData.note })
    }
  },
  willTalk() {
    wx.redirectTo({ url: '/pages/their-statement/their-statement' })
  },
  notNow() {
    wx.showToast({ title: '好，本庭替你转告：你还需要一点时间', icon: 'none', duration: 2000 })
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/pact/pact?from=notnow' })
    }, 2000)
  }
})
