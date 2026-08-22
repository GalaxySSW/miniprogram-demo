// 背对背问话：判官与一方的独立会话
// 三条底线：至多 3 问、每问都能跳过、绝不透露对方说了什么
const app = getApp()
const ai = require('../../utils/ai.js')
const voice = require('../../utils/voice.js')

// 云开发未就绪时的兜底追问（引导式、不评判、不引用对方）
const FALLBACK = {
  a: [
    '那天最让你难受的那一刻，你心里最先冒出来的念头是什么？',
    '如果 TA 当时做了一件小事，就能让你好受一点，那会是什么？',
    '有没有什么话你一直想说，但一直没找到机会说？'
  ],
  b: [
    '那天你沉默的时候，心里在想什么？',
    '如果当时能重来一次，你最想改掉的是哪一句话？',
    '你觉得 TA 最在意的，可能是什么？'
  ]
}

Page({
  data: {
    side: 'b',
    loading: true,
    questions: [],
    idx: 0,
    messages: [],
    input: '',
    chips: ['说不清', '我当时很累', '我没想那么多', '有点怕'],
    recording: false,
    transcribing: false,
    done: false,
    scrollTo: ''
  },

  onLoad(options) {
    const side = options.side === 'a' ? 'a' : 'b'
    const c = app.globalData.caseData
    this.answers = []
    this.setData({ side })

    ai.interviewQuestions(c.myStatement, c.theirStatement, side).then(res => {
      if (res && res.safety) {
        wx.showModal({
          title: '本庭要先说一件更重要的事',
          content: res.message,
          showCancel: false,
          success: () => wx.reLaunch({ url: '/pages/home/home' })
        })
        return
      }
      let qs = (res && res.questions) || []
      if (!qs.length) qs = FALLBACK[side]
      qs = qs.slice(0, 3)
      this.setData({
        loading: false,
        questions: qs,
        messages: [{ id: 'm0', who: 'judge', text: qs[0] }],
        scrollTo: 'm0'
      })
    })
  },

  onInput(e) {
    this.setData({ input: e.detail.value })
  },
  pickChip(e) {
    this.reply(e.currentTarget.dataset.text)
  },
  send() {
    const t = (this.data.input || '').trim()
    if (!t) return
    this.setData({ input: '' })
    this.reply(t)
  },
  skip() {
    this.reply('', true)
  },

  // 回答（或跳过）当前这一问，然后推进
  reply(text, skipped) {
    const { idx, questions, messages } = this.data
    const list = messages.slice()

    list.push({
      id: 'm' + list.length,
      who: 'me',
      text: skipped ? '（这个先不说）' : text,
      skipped: !!skipped
    })
    if (!skipped) this.answers.push({ q: questions[idx], a: text })

    const next = idx + 1
    if (next < questions.length) {
      list.push({ id: 'm' + list.length, who: 'judge', text: questions[next] })
      this.setData({
        messages: list, idx: next,
        scrollTo: list[list.length - 1].id
      })
    } else {
      list.push({
        id: 'm' + list.length,
        who: 'judge',
        text: skipped && !this.answers.length
          ? '好，不想说也没关系。本庭按现在知道的来判。'
          : '我问完了。剩下的交给本庭。'
      })
      this.setData({ messages: list, done: true, scrollTo: list[list.length - 1].id })
    }
  },

  // 语音回答
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
      this.reply(text)
    }).catch(() => {
      this.setData({ transcribing: false })
      wx.showToast({ title: '录音出了点问题', icon: 'none' })
    })
  },

  toTrial() {
    const c = app.globalData.caseData
    const target = this.data.side === 'a' ? 'myStatement' : 'theirStatement'
    if (this.answers.length) {
      c[target] = { ...(c[target] || {}), followups: this.answers }
    }
    wx.redirectTo({ url: '/pages/trial/trial' })
  }
})
