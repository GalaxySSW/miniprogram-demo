// 开庭 · 判决中：等待即叙事，三步清单逐条打勾；真实 LLM 返回慢时此屏可停更久
Page({
  data: {
    steps: [
      { text: '正在重读双方证词', done: false },
      { text: '正在翻译没说出口的话', done: false },
      { text: '正在锁定真正的被告……', done: false }
    ]
  },
  onLoad() {
    // 建议 1.2s 一步
    this.data.steps.forEach((s, i) => {
      setTimeout(() => {
        this.setData({ [`steps[${i}].done`]: true })
      }, 1200 * (i + 1))
    })
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/verdict/verdict' })
    }, 1200 * this.data.steps.length + 1400)
  }
})
