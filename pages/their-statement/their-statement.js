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
    transcribing: false,
    voiceError: '',
    submitError: ''
  },
  onInput(e) {
    this.setData({ text: e.detail.value })
  },
  pickMood(e) {
    this.setData({ moodIdx: e.currentTarget.dataset.idx })
  },
  recStart() {
    this.setData({ recording: true, voiceError: '' })
    voice.start()
  },
  recEnd() {
    if (!this.data.recording) return
    this.setData({ recording: false, transcribing: true })
    voice.stop().then(({ text, error }) => {
      this.setData({ transcribing: false })
      if (!text) {
        if (voice.handle(error)) return
        this.setData({ voiceError: voice.tip(error) })
        return
      }
      this.setData({ text: (this.data.text || '') + text })
    })
  },
  retryVoice() {
    this.setData({ voiceError: '' })
  },
  submit() {
    if (this.data.submitting) return
    this.setData({ submitting: true, submitError: '' })

    const c = app.globalData.caseData
    c.theirStatement = {
      text: this.data.text,
      mood: this.data.moods[this.data.moodIdx] || ''
    }
    const done = () => {
      c.status = 'responded'
      wx.showToast({ title: '我听见了', icon: 'none', duration: 1400 })
      // 证词齐了，先背对背追问，再开庭
      setTimeout(() => wx.redirectTo({ url: '/pages/interview/interview?side=b' }), 1400)
    }
    if (c.docId) casedb.respond(c.docId, c.theirStatement, c.demoMode).then(result => {
      if (app.globalData.cloudReady && !result) return this.setData({ submitting: false, submitError: '这段陈述没有保存成功，原文仍保留在本页。' })
      done()
    }).catch(() => this.setData({ submitting: false, submitError: '这段陈述没有保存成功，原文仍保留在本页。' }))
    else done()
  },
  retrySubmit() { this.submit() },
  back() {
    wx.navigateBack({ delta: 1, fail: () => wx.reLaunch({ url: '/pages/home/home' }) })
  }
})
