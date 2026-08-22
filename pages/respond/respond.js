// 对方应诉页：三条承诺先降防御，保留体面的退出口
const app = getApp()

Page({
  onLoad(options) {
    // 从传票卡片进入时带着案件 docId
    if (options.docId) {
      app.globalData.caseData.docId = options.docId
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
