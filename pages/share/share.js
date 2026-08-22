// 传票分享：onShareAppMessage 携带案件 docId，B 点开即进入应诉
const app = getApp()

Page({
  data: {
    caseId: '',
    docId: ''
  },
  onLoad() {
    const c = app.globalData.caseData
    this.setData({ caseId: c.id, docId: c.docId || '' })
    c.status = 'summoned'
  },
  onShareAppMessage() {
    return {
      title: 'TA 有心事想跟你说清楚',
      path: `/pages/respond/respond?docId=${this.data.docId}`
    }
  },
  simulateTa() {
    // 演示用：单机模拟 TA 打开传票
    const url = this.data.docId
      ? `/pages/respond/respond?docId=${this.data.docId}`
      : '/pages/respond/respond'
    wx.navigateTo({ url })
  },
  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  }
})
