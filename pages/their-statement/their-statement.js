// 应诉陈述：比原告更轻——一个开放问题 + 一组情绪标签（单选）
const app = getApp()
const casedb = require('../../utils/casedb.js')

Page({
  data: {
    text: '',
    moods: ['委屈', '生气', '很累', '愧疚', '说不清'],
    moodIdx: -1,
    submitting: false
  },
  onInput(e) {
    this.setData({ text: e.detail.value })
  },
  pickMood(e) {
    this.setData({ moodIdx: e.currentTarget.dataset.idx })
  },
  submit() {
    if (this.data.submitting) return
    this.setData({ submitting: true })

    const c = app.globalData.caseData
    c.theirStatement = {
      text: this.data.text,
      mood: this.data.moods[this.data.moodIdx] || ''
    }
    wx.showToast({ title: '我听见了', icon: 'none', duration: 1400 })

    const done = () => {
      c.status = 'responded'
      setTimeout(() => wx.redirectTo({ url: '/pages/trial/trial' }), 1400)
    }
    if (c.docId) {
      casedb.respond(c.docId, c.theirStatement).then(done)
    } else {
      done()
    }
  }
})
