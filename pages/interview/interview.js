// 背对背问话：与判官的一对一多轮对话
// 每一问都由模型根据 TA 刚才的回答现生成，不是事先写好的问卷
// 三条底线：至多 3 问、每问都能跳过、绝不透露对方说了什么
const app = getApp()
const ai = require('../../utils/ai.js')
const voice = require('../../utils/voice.js')

const MAX_Q = 3

// 云开发未就绪时的兜底开场（引导式、不评判、不引用对方）
const FALLBACK_FIRST = {
  a: '那天最让你难受的那一刻，你心里最先冒出来的念头是什么？',
  b: '那天你心里在想什么？想到什么说什么就行。'
}

Page({
  data: {
    side: 'b',
    loading: true,
    messages: [],
    input: '',
    chips: ['说不清', '我当时很累', '我没想那么多', '有点怕'],
    asked: 0,
    thinking: false,
    recording: false,
    transcribing: false,
    done: false,
    error: '',
    mode: 'interview',
    scrollTo: ''
  },

  onLoad(options) {
    this.side = options.side === 'a' ? 'a' : 'b'
    // supplement 模式：判决已出，当事人觉得没说清，回来补充视角
    this.mode = options.mode === 'supplement' ? 'supplement' : 'interview'
    this.history = []     // [{ q, a }]
    this.angles = null
    this.pendingQ = ''
    this.setData({ side: this.side, mode: this.mode })
    this.nextTurn(true)
  },

  push(who, text, skipped) {
    const list = this.data.messages.slice()
    list.push({ id: 'm' + list.length, who, text, skipped: !!skipped })
    this.setData({ messages: list, scrollTo: list[list.length - 1].id })
  },

  // 向判官要下一句：它会先回应 TA 刚才那句，再问下去
  nextTurn(first) {
    const c = app.globalData.caseData
    this.setData({ thinking: true, error: '' })

    const ask = this.mode === 'supplement'
      ? ai.supplement(c.myStatement, c.theirStatement, this.side, app.globalData.verdict, this.history)
      : ai.interviewTurn(c.myStatement, c.theirStatement, this.side, this.angles, this.history)

    ask
      .then(res => {
        this.setData({ thinking: false, loading: false })

        if (res && res.safety) {
          wx.showModal({
            title: '本庭要先说一件更重要的事',
            content: res.message,
            showCancel: false,
            success: () => wx.reLaunch({ url: '/pages/home/home' })
          })
          return
        }
        if (res && res.angles) this.angles = res.angles

        // 云端不可用时的兜底：只给一个安全的开场问题
        if (!res) {
          if (first) {
            this.pendingQ = this.mode === 'supplement'
              ? '哪一部分是本庭没说到的？想到什么说什么。'
              : FALLBACK_FIRST[this.side]
            this.push('judge', this.pendingQ)
            this.setData({ asked: 1 })
          } else {
            this.finish('我问完了，剩下的交给本庭。')
          }
          return
        }

        const reachedMax = this.data.asked >= MAX_Q
        if (res.done || reachedMax || !res.question) {
          this.finish(res.closing || '我问完了，剩下的交给本庭。', res.reply)
          return
        }

        // 回应和提问合成一句说出来，读着才像人在讲话
        const text = (res.reply ? res.reply.trim() + ' ' : '') + res.question.trim()
        this.pendingQ = res.question.trim()
        this.push('judge', text)
        this.setData({ asked: this.data.asked + 1 })
      })
      .catch(() => this.setData({ thinking: false, loading: false, error: '判官暂时没能接上这轮问话。你的回答已留在本页，可以重试。' }))
  },

  finish(closing, reply) {
    const text = (reply ? reply.trim() + ' ' : '') + closing
    this.push('judge', text)
    this.setData({ done: true })
  },

  onInput(e) { this.setData({ input: e.detail.value }) },
  pickChip(e) { this.reply(e.currentTarget.dataset.text) },
  send() {
    const t = (this.data.input || '').trim()
    if (!t) return
    this.setData({ input: '' })
    this.reply(t)
  },
  skip() { this.reply('', true) },

  // TA 回答（或跳过）之后，把这一轮记进对话，再要下一句
  reply(text, skipped) {
    if (this.data.thinking || this.data.done) return
    this.push('me', skipped ? '（这个先不说）' : text, skipped)
    this.history.push({ q: this.pendingQ, a: skipped ? '' : text })
    this.nextTurn(false)
  },

  recStart() {
    if (this.data.thinking || this.data.done) return
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
      this.reply(text)
    })
  },

  toTrial() {
    const c = app.globalData.caseData
    const target = this.side === 'a' ? 'myStatement' : 'theirStatement'
    const answered = this.history.filter(h => h.a)
    if (answered.length) {
      const prev = (c[target] && c[target].followups) || []
      c[target] = { ...(c[target] || {}), followups: prev.concat(answered) }
    }
    wx.redirectTo({ url: '/pages/trial/trial' })
  },
  retryTurn() {
    if (this.data.thinking || this.data.done) return
    this.nextTurn(!this.data.messages.length)
  },
  back() {
    wx.navigateBack({ delta: 1, fail: () => wx.reLaunch({ url: '/pages/home/home' }) })
  }
})
