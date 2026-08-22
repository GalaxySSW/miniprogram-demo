// 传票预览确认：明示 TA 能看到 / 看不到什么——隐私信任的关键屏
Page({
  confirm() {
    wx.navigateTo({ url: '/pages/share/share' })
  },
  edit() {
    // 「我再改改」退回陈述页
    const pages = getCurrentPages()
    const idx = pages.findIndex(p => p.route === 'pages/statement/statement')
    if (idx >= 0) {
      wx.navigateBack({ delta: pages.length - 1 - idx })
    } else {
      wx.navigateTo({ url: '/pages/statement/statement' })
    }
  }
})
