// 我的 · 情侣绑定：双猫头即绑定态，三项计数
Page({
  data: {
    bound: true,
    stats: [
      { num: 2, label: '立案' },
      { num: 2, label: '和好' },
      { num: 5, label: '石子' }
    ]
  },
  invite() {
    wx.showToast({ title: '邀请卡开发中（需正式 AppID 转发）', icon: 'none' })
  }
})
