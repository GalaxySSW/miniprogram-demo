const app = getApp()

Page({
  data: {
    quotes: []
  },
  onLoad() {
    this.setData({ quotes: app.globalData.quotes })
  },
  startCase() {
    wx.navigateTo({ url: '/pages/evidence/evidence' })
  },
  gotSummons() {
    wx.navigateTo({ url: '/pages/respond/respond' })
  },
  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },
  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  }
})
