// 传票分享：onShareAppMessage 携带案件 ID；演示时可直接切到 TA 视角
const app = getApp()

Page({
  data: {
    caseId: ''
  },
  onLoad() {
    this.setData({ caseId: app.globalData.caseData.id })
    app.globalData.caseData.status = 'summoned'
  },
  onShareAppMessage() {
    return {
      title: 'TA 有心事想跟你说清楚',
      path: `/pages/respond/respond?caseId=${encodeURIComponent(this.data.caseId)}`
    }
  },
  simulateTa() {
    // 演示用：模拟 TA 打开传票
    wx.navigateTo({ url: '/pages/respond/respond' })
  },
  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  }
})
