// 传票分享：卡片标题就是 A 自己写的那句话，B 在会话里看到的是本人开口
const app = getApp()

Page({
  data: {
    caseId: '',
    docId: '',
    note: ''
  },
  onLoad() {
    const c = app.globalData.caseData
    this.setData({
      caseId: c.id,
      docId: c.docId || '',
      note: c.note || '我不想再这样吵下去了，陪我试个东西行吗？'
    })
    c.status = 'summoned'
  },
  onShareAppMessage() {
    return {
      title: this.data.note,
      path: `/pages/respond/respond?docId=${this.data.docId}`
    }
  },
  simulateTa() {
    // 演示用：单机模拟 TA 打开传票（服务端会用派生 openid 扮演对方）
    app.globalData.caseData.demoMode = true
    const url = this.data.docId
      ? `/pages/respond/respond?docId=${this.data.docId}`
      : '/pages/respond/respond'
    wx.navigateTo({ url })
  },
  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  }
})
