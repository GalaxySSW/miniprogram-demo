// 我的 · 本庭记得的模式（可查看、可一键清空）
//
// 这里刻意没有「绑定情侣」这道手续：关系是从第一次共同结案自动沉淀出来的结果，
// 不该是使用产品的前置门槛。绑定会把承诺放在价值之前，也会带来分手时的解绑难题。
// 退出机制就是下面那个「让本庭忘掉」。
const casedb = require('../../utils/casedb.js')
const credits = require('../../utils/credits.js')

Page({
  data: {
    together: false,
    pactDone: 0,
    pactTried: 0,
    patterns: [],
    creditAccount: null,
    creditLoading: true
  },
  onShow() {
    this.setData({ creditLoading: true })
    credits.refresh().then(account => this.setData({ creditAccount: account, creditLoading: false }))
    casedb.myCases().then(list => {
      if (!list) return
      // 「全产品只有一个数字」是 PRD 原则，这里不再展示立案次数这类虚荣计数，
      // 只说约定试过几件、做到了几件——那是指向行为的
      const withPact = list.filter(c => c.pact)
      this.setData({
        pactTried: withPact.length,
        pactDone: withPact.filter(c => c.review && c.review.result === '做到了').length,
        together: list.some(c => c.hasB)
      })
    })
    casedb.myPatterns().then(ps => {
      if (ps) this.setData({ patterns: ps })
    })
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
