// 应诉陈述：比原告更轻——一个开放问题 + 一组情绪标签（单选），同样支持语音
const app = getApp()
const casedb = require('../../utils/casedb.js')
const voice = require('../../utils/voice.js')

Page({
  data: {
    text: '',
    moods: ['委屈', '生气', '很累', '愧疚', '说不清'],
    moodIdx: -1,
    submitting: false,
    recording: false,
    transcribing: false
  },
  onInput(e) {
    this.setData({ text: e.detail.value })
  },
  pickMood(e) {
    this.setData({ moodIdx: e.currentTarget.dataset.idx })
  },
  recStart() {
    this.setData({ recording: true })
    voice.start()
  },
  recEnd() {
    if (!this.data.recording) return
    this.setData({ recording: false, transcribing: true })
    voice.stop().then(text => {
      this.setData({ transcribing: false })
      if (!text) return wx.showToast({ title: '没听清，再说一次？', icon: 'none' })
      this.setData({ text: (this.data.text || '') + text })
    }).catch(() => {
      this.setData({ transcribing: false })
      wx.showToast({ title: '录音出了点问题', icon: 'none' })
    })
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
    if (c.docId) casedb.respond(c.docId, c.theirStatement).then(done)
    else done()
  }
})
