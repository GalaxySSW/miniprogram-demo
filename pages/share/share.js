// 传票分享：优先用微信转发；未认证的小程序转发受限，所以同时给一份口令
const app = getApp()
const casedb = require('../../utils/casedb.js')

Page({
  data: {
    caseId: '',
    docId: '',
    code: '',
    note: '',
    copied: false
  },
  onLoad() {
    const c = app.globalData.caseData
    this.setData({
      caseId: c.id,
      docId: c.docId || '',
      code: c.code || '',
      note: c.note || '我不想再这样吵下去了，陪我试个东西行吗？'
    })
    c.status = 'summoned'
    // 补一次口令（从卷宗回来等情况）
    if (!this.data.code && c.docId) {
      casedb.getCase(c.docId).then(r => {
        if (r && r.code) {
          c.code = r.code
          this.setData({ code: r.code })
        }
      })
    }
  },
  onShareAppMessage() {
    return {
      title: this.data.note,
      path: `/pages/respond/respond?docId=${this.data.docId}`
    }
  },
  copyInvite() {
    const text = `${this.data.note}\n\n打开「爱情判官」，在首页点「我收到了传票」，输入口令：${this.data.code}`
    wx.setClipboardData({
      data: text,
      success: () => {
        this.setData({ copied: true })
        wx.showToast({ title: '已复制，去微信发给 TA', icon: 'none' })
      }
    })
  },
  simulateTa() {
    app.globalData.caseData.demoMode = true
    const url = this.data.docId
      ? `/pages/respond/respond?docId=${this.data.docId}`
      : '/pages/respond/respond'
    wx.navigateTo({ url })
  },
  goWaiting() {
    wx.redirectTo({ url: '/pages/waiting/waiting' })
  }
})
