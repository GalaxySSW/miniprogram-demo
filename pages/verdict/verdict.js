// 判决书：公文结构，双方同时可见，仅此一版
const app = getApp()

Page({
  data: {
    caseId: '',
    v: {},
    sealed: false
  },
  onLoad() {
    const g = app.globalData
    g.caseData.status = 'tried'
    this.setData({ caseId: g.caseData.id, v: g.verdict })
    setTimeout(() => this.setData({ sealed: true }), 600)
  },
  copyStep(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.text })
  },
  saveImage() {
    // TODO: 用 canvas 生成分享长图；黑客松阶段先用系统截图
    wx.showToast({ title: '长按屏幕截图分享（长图生成开发中）', icon: 'none' })
  },
  goPact() {
    wx.navigateTo({ url: '/pages/pact/pact' })
  }
})
