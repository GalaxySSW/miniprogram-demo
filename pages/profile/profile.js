// 我的 · 情侣绑定 + 本庭记得的模式（可查看、可一键清空）
const casedb = require('../../utils/casedb.js')

Page({
  data: {
    bound: true,
    stats: [
      { num: 0, label: '立案' },
      { num: 0, label: '和好' },
      { num: 0, label: '石子' }
    ],
    patterns: []
  },
  onShow() {
    casedb.myCases().then(list => {
      if (!list) return
      const closed = list.filter(c => c.status === 'closed').length
      this.setData({
        'stats[0].num': list.length,
        'stats[1].num': closed,
        bound: list.some(c => c.hasB)
      })
    })
    casedb.myPatterns().then(ps => {
      if (ps) this.setData({ patterns: ps })
    })
  },
  invite() {
    wx.showToast({ title: '从传票分享给 TA 即可绑定', icon: 'none' })
  },
  forget() {
    wx.showModal({
      title: '让本庭忘掉？',
      content: '会清空所有记录的模式（主题、次数、试过的约定）。判决书本身不受影响。',
      confirmText: '忘掉',
      success: (res) => {
        if (!res.confirm) return
        casedb.forgetPatterns().then(() => {
          this.setData({ patterns: [] })
          wx.showToast({ title: '本庭已经忘了', icon: 'none' })
        })
      }
    })
  }
})
