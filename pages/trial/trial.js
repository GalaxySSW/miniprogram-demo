// 开庭 · 判决中：动画覆盖 AI 生成耗时
// 开庭前先取本庭对这对情侣的记忆（反复出现的主题、试过的约定、复盘结果）
const app = getApp()
const ai = require('../../utils/ai.js')
const casedb = require('../../utils/casedb.js')

Page({
  onUnload() { if (this.musingTimer) clearInterval(this.musingTimer) },
  data: {
    steps: [
      { text: '正在重读双方证词', done: false },
      { text: '正在翻查本庭旧案', done: false },
      { text: '正在琢磨你们各自要什么', done: false },
      { text: '正在锁定真正的被告……', done: false }
    ],
    musing: '',
    loading: true,
    error: ''
  },
  onLoad() {
    this.startTrial()
  },
  startTrial() {
    const c = app.globalData.caseData
    this.setData({ loading: true, error: '', musing: '', steps: this.data.steps.map(s => ({ ...s, done: false })) })

    const animation = new Promise(resolve => {
      this.data.steps.forEach((s, i) => {
        setTimeout(() => this.setData({ [`steps[${i}].done`]: true }), 1200 * (i + 1))
      })
      setTimeout(resolve, 1200 * this.data.steps.length + 1400)
    })

    // 清单走完 AI 还没回来时，换一句斟酌文案，别让页面像卡死
    const MUSING = ['正在斟酌用词……', '这句话还想再想想……', '快好了，最后一段。']
    let mi = 0
    this.musingTimer = setInterval(() => {
      if (this.data.steps.every(s => s.done)) {
        this.setData({ musing: MUSING[mi % MUSING.length] })
        mi += 1
      }
    }, 2600)

    // 先取记忆，再带着记忆开庭
    // 深度分析不阻塞首屏：现在就发出去，判决书页读到那几段时它多半已经回来了
    app.globalData.depthPromise = ai.verdictDepth(c.myStatement, c.theirStatement)

    const generation = (c.docId ? casedb.patterns(c.docId) : Promise.resolve([]))
      .then(pats => {
        this.patterns = pats || []
        return ai.generateVerdict(c.myStatement, c.theirStatement, this.patterns)
      })

    Promise.all([animation, generation]).then(([, result]) => {
      if (this.musingTimer) clearInterval(this.musingTimer)
      if (result && result.safety) {
        wx.showModal({
          title: '本庭要先说一件更重要的事',
          content: result.message,
          showCancel: false,
          success: () => wx.reLaunch({ url: '/pages/home/home' })
        })
        return
      }
      if (app.globalData.cloudReady && !result) {
        return this.setData({ loading: false, error: '本庭暂时没有拿到真实判决，先不展示样例判决。请重试。' })
      }
      if (result && result.ruling) {
        // 这个主题以前判过几次？算上本次
        const prev = (this.patterns || []).find(p => p.topic === result.topic)
        result.memory = prev
          ? { count: prev.count + 1, lastPact: prev.lastPact, lastResult: prev.lastResult }
          : null
        app.globalData.verdict = { ...app.globalData.verdict, ...result }
        if (c.docId) {
          casedb.saveVerdict(c.docId, app.globalData.verdict)
          casedb.recordPattern(c.docId, result.topic)
        }
      }
      wx.redirectTo({ url: '/pages/verdict/verdict' })
    }).catch(() => {
      if (this.musingTimer) clearInterval(this.musingTimer)
      this.setData({ loading: false, error: '本庭暂时没能完成审理。原话仍保留在本地，可以重试。' })
    })
  },
  retry() {
    if (this.data.loading) return
    this.startTrial()
  },
  back() {
    wx.navigateBack({ delta: 1, fail: () => wx.reLaunch({ url: '/pages/home/home' }) })
  },
  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  }
})
