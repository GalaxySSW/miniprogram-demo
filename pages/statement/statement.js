// 立案 · 引导式陈述：2–3 个具体小问题，支持按住说话（语音优先）
const app = getApp()
const casedb = require('../../utils/casedb.js')
const voice = require('../../utils/voice.js')
const ai = require('../../utils/ai.js')

Page({
  data: {
    questions: [
      { key: 'what', q: '那天发生了什么？', ph: '示例：周三晚上他说要加班，让我先吃。我等到九点他还没回消息……' },
      { key: 'hurt', q: '哪一句话、哪个瞬间最让你难受？', ph: '示例：他说「你怎么又这样」的时候，我觉得所有委屈都白受了。' },
      { key: 'wish', q: '你其实最想让 TA 知道什么？', ph: '示例：我不是要 TA 别工作，我只是想被提前告诉一声。' }
    ],
    answers: {},
    extra: false,
    extraText: '',
    submitting: false,
    activeKey: 'what',   // 语音结果写入哪一栏
    recording: false,
    transcribing: false,
    hasEvidence: false
  },
  onLoad() {
    const c = app.globalData.caseData
    this.setData({ hasEvidence: !!c.screenshotText })

    // 从受理页「听岔了，我再补充」回来时，把之前写的原样恢复，别让人重打一遍
    const prev = c.myStatement
    if (prev && (prev.what || prev.hurt || prev.wish)) {
      const answers = {}
      QUESTIONS.forEach(q => { if (prev[q.key]) answers[q.key] = prev[q.key] })
      const filled = Object.keys(answers).length
      this.setData({
        answers,
        extraText: prev.extra || '',
        extra: !!prev.extra,
        shown: Math.min(QUESTIONS.length, Math.max(1, filled + 1)),
        canSubmit: filled > 0
      })
    }
  },
  onInput(e) {
    this.setData({ [`answers.${e.currentTarget.dataset.key}`]: e.detail.value })
  },
  onFocus(e) {
    this.setData({ activeKey: e.currentTarget.dataset.key })
  },
  onExtraInput(e) {
    this.setData({ extraText: e.detail.value })
  },
  addExtra() {
    this.setData({ extra: true, activeKey: 'extra' })
  },

  // —— 按住说话 ——
  recStart() {
    this.setData({ recording: true })
    voice.start()
  },
  recEnd() {
    if (!this.data.recording) return
    this.setData({ recording: false, transcribing: true })
    voice.stop().then(({ text, error }) => {
      this.setData({ transcribing: false })
      if (!text) {
        if (voice.handle(error)) return
        return wx.showToast({ title: voice.tip(error), icon: 'none', duration: 2200 })
      }
      const key = this.data.activeKey
      if (key === 'extra') {
        this.setData({ extraText: (this.data.extraText || '') + text })
      } else {
        const cur = this.data.answers[key] || ''
        this.setData({ [`answers.${key}`]: cur + text })
      }
    })
  },

  submit() {
    if (this.data.submitting) return
    this.setData({ submitting: true })

    const c = app.globalData.caseData
    c.myStatement = {
      ...this.data.answers,
      extra: this.data.extraText,
      screenshots: c.screenshotText || ''
    }

    // 提交的第一反馈永远是判官的「接住」，然后才是流程
    wx.showToast({ title: '我在，我先认真看看', icon: 'none', duration: 1600 })
    // 受理页要用的复述，现在就让判官去写，等页面打开时多半已经好了
    app.globalData.intakePromise = ai.intake(c.myStatement)

    const go = () => {
      c.status = 'accepted'
      setTimeout(() => wx.redirectTo({ url: '/pages/accept/accept' }), 1600)
    }
    // 补充后重新提交的是同一桩案子，不该再开一个案号
    if (c.docId) {
      casedb.updateStatement(c.docId, c.myStatement).then(go)
    } else {
      casedb.createCase(c.myStatement).then(res => {
        if (res) { c.docId = res._id; c.id = res.caseId; c.code = res.code || ''; c.createdAt = Date.now() }
        go()
      })
    }
  }
})
