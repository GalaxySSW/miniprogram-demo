// 受理确认：案件编号 + 软盖章，分叉出三条路
// 「等等再说」是正当选项而不是流程中断——冷启动的最佳时机往往不是吵架当下
const app = getApp()

Page({
  data: {
    caseId: '',
    sealed: false
  },
  onLoad() {
    this.setData({ caseId: app.globalData.caseData.id })
    setTimeout(() => this.setData({ sealed: true }), 400)
  },
  quickReply() {
    wx.redirectTo({ url: '/pages/reply/reply' })
  },
  later() {
    app.globalData.caseData.status = 'pending'
    wx.showToast({ title: '本庭替你收着，想好了随时回来', icon: 'none', duration: 2200 })
    setTimeout(() => wx.reLaunch({ url: '/pages/home/home' }), 2200)
  },
  sendNow() {
    wx.redirectTo({ url: '/pages/preview/preview' })
  }
})
