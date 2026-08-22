const app = getApp()
const casedb = require('../../utils/casedb.js')

Page({
  data: {
    quotes: [],
    pending: null   // 缓着没发传票的案子，随时可以捡回来
  },
  onLoad() {
    this.setData({ quotes: app.globalData.quotes })
  },
  onShow() {
    const c = app.globalData.caseData
    if (c.docId && (c.status === 'pending' || c.status === 'accepted')) {
      this.setData({ pending: { id: c.id } })
    } else {
      // 云端还挂着没发出去的案子也要捡回来
      casedb.myCases().then(list => {
        if (!list) return
        const open = list.find(x => x.side === 'a' && x.status === 'created' && !x.hasB)
        if (open) {
          app.globalData.caseData.docId = open._id
          app.globalData.caseData.id = open.caseId
          app.globalData.caseData.note = open.note || ''
          this.setData({ pending: { id: open.caseId } })
        }
      })
    }
  },
  resume() {
    wx.navigateTo({ url: '/pages/preview/preview' })
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
