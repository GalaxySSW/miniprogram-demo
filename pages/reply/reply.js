// 先回一句：三条低风险话术轮换，复制后按钮变「已复制 · 去发传票」
const app = getApp()

Page({
  data: {
    suggestion: '',
    idx: 0,
    copied: false
  },
  onLoad() {
    this.setData({ suggestion: app.globalData.replySuggestions[0] })
  },
  change() {
    const list = app.globalData.replySuggestions
    const idx = (this.data.idx + 1) % list.length
    this.setData({ idx, suggestion: list[idx], copied: false })
  },
  copy() {
    wx.setClipboardData({
      data: this.data.suggestion,
      success: () => {
        this.setData({ copied: true })
        wx.showToast({ title: '判官在后台等 TA', icon: 'none' })
      }
    })
  },
  next() {
    wx.redirectTo({ url: '/pages/preview/preview' })
  }
})
