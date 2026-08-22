// 我的 · 情侣绑定 + 本庭记得的模式（可查看、可一键清空）
const casedb = require('../../utils/casedb.js')

Page({
  data: {
    bound: true,
    pactDone: 0,
    pactTried: 0,
    patterns: []
  },
  onShow() {
    casedb.myCases().then(list => {
      if (!list) return
      // 「全产品只有一个数字」是 PRD 原则，这里不再展示立案次数这类虚荣计数，
      // 只说约定试过几件、做到了几件——那是指向行为的
      const withPact = list.filter(c => c.pact)
      this.setData({
        pactTried: withPact.length,
        pactDone: withPact.filter(c => c.review && c.review.result === '做到了').length,
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
