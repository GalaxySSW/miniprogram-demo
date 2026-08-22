// 三天后复盘：约定到底有没有用——这是本庭最有价值的判据
// 演示环境可从卷宗直接进入（时间快进）
const app = getApp()
const casedb = require('../../utils/casedb.js')

Page({
  data: {
    pact: { title: '', desc: '' },
    options: ['做到了', '没做到', '情况变了'],
    picked: -1,
    saved: false
  },
  onLoad(options) {
    if (options.docId) app.globalData.caseData.docId = options.docId
    const g = app.globalData
    const pact = g.caseData.pact || {
      title: g.verdict.pactTitle || '出行提前一句',
      desc: g.verdict.pactDesc || '出差或晚归，提前发一句话——哪怕只有五个字。'
    }
    this.setData({ pact })
  },
  pick(e) {
    this.setData({ picked: e.currentTarget.dataset.idx })
  },
  submit() {
    if (this.data.picked < 0) {
      return wx.showToast({ title: '选一个就行', icon: 'none' })
    }
    const result = this.data.options[this.data.picked]
    const docId = app.globalData.caseData.docId
    const done = () => {
      this.setData({ saved: true })
      wx.showToast({ title: '本庭记下了', icon: 'none' })
    }
    if (docId) casedb.saveReview(docId, result).then(done)
    else done()
  },
  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  }
})
