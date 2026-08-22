// 开庭 · 判决中：动画覆盖 AI 生成耗时
// 云开发就绪时真实调用 DeepSeek 生成判决书；动画至少走完三步，AI 没回来就继续等
const app = getApp()
const ai = require('../../utils/ai.js')

Page({
  data: {
    steps: [
      { text: '正在重读双方证词', done: false },
      { text: '正在翻译没说出口的话', done: false },
      { text: '正在锁定真正的被告……', done: false }
    ]
  },
  onLoad() {
    const c = app.globalData.caseData

    // 动画：1.2s 一步，最短 5s
    const animation = new Promise(resolve => {
      this.data.steps.forEach((s, i) => {
        setTimeout(() => this.setData({ [`steps[${i}].done`]: true }), 1200 * (i + 1))
      })
      setTimeout(resolve, 1200 * this.data.steps.length + 1400)
    })

    // AI：生成判决书（云开发未就绪时立即返回 null，走 mock）
    const generation = ai.generateVerdict(c.myStatement, c.theirStatement)

    Promise.all([animation, generation]).then(([, result]) => {
      if (result && result.safety) {
        // 安全阀：卸下人设，终止调解
        wx.showModal({
          title: '本庭要先说一件更重要的事',
          content: result.message,
          showCancel: false,
          success: () => wx.reLaunch({ url: '/pages/home/home' })
        })
        return
      }
      if (result && result.ruling) {
        app.globalData.verdict = { ...app.globalData.verdict, ...result }
      }
      wx.redirectTo({ url: '/pages/verdict/verdict' })
    })
  }
})
