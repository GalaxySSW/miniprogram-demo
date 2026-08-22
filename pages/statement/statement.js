// 立案 · 引导式陈述：2–3 个具体小问题，占位文案即示例答案
const app = getApp()

Page({
  data: {
    questions: [
      { key: 'what', q: '那天发生了什么？', ph: '示例：周三晚上他说要加班，让我先吃。我等到九点他还没回消息……' },
      { key: 'hurt', q: '哪一句话、哪个瞬间最让你难受？', ph: '示例：他说「你怎么又这样」的时候，我觉得所有委屈都白受了。' },
      { key: 'wish', q: '你其实最想让 TA 知道什么？', ph: '示例：我不是要 TA 别工作，我只是想被提前告诉一声。' }
    ],
    answers: {},
    extra: false,
    extraText: ''
  },
  onInput(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [`answers.${key}`]: e.detail.value })
  },
  onExtraInput(e) {
    this.setData({ extraText: e.detail.value })
  },
  addExtra() {
    this.setData({ extra: true })
  },
  submit() {
    const c = app.globalData.caseData
    c.myStatement = { ...this.data.answers, extra: this.data.extraText }
    c.status = 'accepted'
    // 提交的第一反馈永远是判官的「接住」，然后才是流程
    wx.showToast({ title: '我在，我先认真看看', icon: 'none', duration: 1600 })
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/accept/accept' })
    }, 1600)
  }
})
