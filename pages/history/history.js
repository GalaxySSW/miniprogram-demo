// 卷宗：案件历史，状态胶囊两色（复盘中蜜色 / 已和好抹茶）
Page({
  data: {
    cases: [
      { id: '2026 情字第 0822 号', title: '加班晚归案', status: 'review', statusText: '复盘中', pact: '约定：出行提前一句' },
      { id: '2026 情字第 0731 号', title: '朋友圈没点赞案', status: 'done', statusText: '已和好', pact: '约定：睡前不带气' }
    ]
  },
  openCase() {
    wx.navigateTo({ url: '/pages/verdict/verdict' })
  }
})
