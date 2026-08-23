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
    error: '',
    heard: '',
    care: [],
    unknown: ''
  },

  onLoad() {
    this.setData({ caseId: app.globalData.caseData.id })

    const p = app.globalData.intakePromise
    if (!p) {
      return this.setData({
        loading: false,
        sealed: !app.globalData.cloudReady,
        error: app.globalData.cloudReady ? '本庭暂时没有受理复述，先不显示“已受理”。' : ''
      })
    }

    p.then(res => {
      if (res && res.safety) {
        this.setData({ loading: false })
        wx.showModal({
          title: '本庭要先说一件更重要的事',
          content: res.message,
          showCancel: false,
          success: () => wx.reLaunch({ url: '/pages/home/home' })
        })
        return
      }
      if (app.globalData.cloudReady && !res) {
        return this.setData({ loading: false, error: '本庭暂时没有拿到受理复述，暂不显示“已受理”。' })
      }
      this.setData({
        loading: false,
        sealed: true,
        heard: (res && res.heard) || '',
        care: (res && res.care) || [],
        unknown: (res && res.unknown) || ''
      })
    }).catch(() => {
      this.setData({ loading: false, error: '本庭暂时没能整理好这段复述。你可以重试，或先回去补充。' })
    })
  },

  retry() {
    const p = app.globalData.intakePromise
    if (!p) return this.setData({ error: '这次没有可重试的整理任务，请回去重新陈述。' })
    this.setData({ loading: true, error: '' })
    p.then(res => {
      if (app.globalData.cloudReady && !res) return this.setData({ loading: false, error: '本庭暂时没有拿到受理复述，暂不显示“已受理”。' })
      this.setData({
        loading: false,
        sealed: true,
        heard: (res && res.heard) || '',
        care: (res && res.care) || [],
        unknown: (res && res.unknown) || ''
      })
    }).catch(() => this.setData({ loading: false, error: '还是没整理好，请稍后再试。' }))
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
  },
  back() {
    wx.navigateBack({ delta: 1, fail: () => wx.reLaunch({ url: '/pages/home/home' }) })
  }
})
