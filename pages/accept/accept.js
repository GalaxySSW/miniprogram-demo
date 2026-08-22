// 受理确认：案件编号 + 软盖章动画，分叉出「先回一句」
const app = getApp()

Page({
  data: {
    caseId: '',
    sealed: false
  },
  onLoad() {
    this.setData({ caseId: app.globalData.caseData.id })
    // 盖章 0.7s 落下
    setTimeout(() => this.setData({ sealed: true }), 400)
  },
  quickReply() {
    wx.redirectTo({ url: '/pages/reply/reply' })
  },
  later() {
    wx.redirectTo({ url: '/pages/preview/preview' })
  }
})
