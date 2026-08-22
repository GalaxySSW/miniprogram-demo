// 受理确认：案号 + 软盖章，然后把本庭听到的复述给当事人校对
//
// 这一页的主动作是「发传票」——它是整条链路的关键一步，不该是个小字链接。
// 「先回一句」是可选的即时援助，「等等再说」是退路，两者都不该抢主按钮的位置。
const app = getApp()

Page({
  data: {
    caseId: '',
    sealed: false,
    loading: true,
    heard: '',
    care: [],
    unknown: ''
  },

  onLoad() {
    this.setData({ caseId: app.globalData.caseData.id })
    setTimeout(() => this.setData({ sealed: true }), 400)

    const p = app.globalData.intakePromise
    if (!p) return this.setData({ loading: false })

    p.then(res => {
      if (res && res.safety) {
        wx.showModal({
          title: '本庭要先说一件更重要的事',
          content: res.message,
          showCancel: false,
          success: () => wx.reLaunch({ url: '/pages/home/home' })
        })
        return
      }
      this.setData({
        loading: false,
        heard: (res && res.heard) || '',
        care: (res && res.care) || [],
        unknown: (res && res.unknown) || ''
      })
    })
  },

  // 主动作
  sendSummons() {
    wx.redirectTo({ url: '/pages/preview/preview' })
  },
  // 听岔了，回去改
  amend() {
    wx.redirectTo({ url: '/pages/statement/statement' })
  },
  // 可选的即时援助
  quickReply() {
    wx.redirectTo({ url: '/pages/reply/reply' })
  },
  // 退路
  later() {
    app.globalData.caseData.status = 'pending'
    wx.showToast({ title: '本庭替你收着，想好了随时回来', icon: 'none', duration: 2200 })
    setTimeout(() => wx.reLaunch({ url: '/pages/home/home' }), 2200)
  }
})
