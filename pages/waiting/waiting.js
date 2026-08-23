// 等待状态页：传票发出后，A 在这里看着案件自己往前走
// 进展由云函数轮询驱动，B 一有动作这边就变
const app = getApp()
const live = require('../../utils/live.js')

const STEPS = [
  { key: 'sent', text: '传票已送出' },
  { key: 'opened', text: 'TA 打开了传票' },
  { key: 'responded', text: 'TA 也说完了' },
  { key: 'tried', text: '判决书已就绪' }
]

Page({
  data: {
    steps: STEPS.map((s, i) => ({ ...s, done: i === 0 })),
    caseId: '',
    code: '',
    hint: '本庭在等 TA。你可以先去做点别的，有进展我会记着。',
    pebbleWaiting: 0,
    canAbsent: false,
    syncState: 'waiting'
  },

  onLoad() {
    const c = app.globalData.caseData
    this.setData({ caseId: c.id, code: c.code || '' })

    // 24 小时未应诉可以申请缺席审判；演示时长按标题也能触发
    const created = c.createdAt || Date.now()
    this.setData({ canAbsent: Date.now() - created > 24 * 3600 * 1000 })

    if (!c.docId) {
      this.setData({ syncState: 'offline', hint: '这是本地演示案件，暂时没有可轮询的云端进度。' })
    } else {
      this.live = live.start(c.docId, (t) => this.apply(t))
    }
  },

  onUnload() {
    if (this.live) this.live.stop()
  },

  apply(t) {
    const steps = STEPS.map((s, i) => {
      let done = i === 0
      if (s.key === 'opened') done = t.hasB || t.status === 'responded' || t.status === 'tried' || t.status === 'closed'
      if (s.key === 'responded') done = ['responded', 'tried', 'closed'].indexOf(t.status) >= 0
      if (s.key === 'tried') done = t.verdictReady
      return { ...s, done }
    })

    let hint = '本庭在等 TA。你可以先去做点别的，有进展我会记着。'
    if (t.hasB && t.status !== 'tried') hint = 'TA 已经进来了，正在跟判官说话。'
    if (t.verdictReady) hint = '判决书写好了。'

    this.setData({ steps, hint, pebbleWaiting: t.pebbleWaiting || 0 })

    // 判决一出就自动带过去——这是等待页存在的意义
    if (t.verdictReady && !this.jumped) {
      this.jumped = true
      wx.showToast({ title: '判决书出来了', icon: 'none' })
      setTimeout(() => wx.redirectTo({ url: '/pages/verdict/verdict' }), 1200)
    }
  },

  copyCode() {
    if (!this.data.code) return
    wx.setClipboardData({ data: this.data.code, success: () => wx.showToast({ title: '口令已复制', icon: 'none' }) })
  },
  retry() {
    const c = app.globalData.caseData
    if (!c.docId) return this.setData({ syncState: 'offline' })
    if (this.live) this.live.stop()
    this.setData({ syncState: 'waiting', hint: '本庭重新去看一眼 TA 的进度。' })
    this.live = live.start(c.docId, (t) => this.apply(t))
  },
  goPebble() {
    wx.navigateTo({ url: '/pages/pebble/pebble' })
  },
  absent() {
    wx.showModal({
      title: '申请缺席审判？',
      content: 'TA 一直没来。本庭可以只听你这一边，但会替 TA 把可能的说法也想一遍。',
      confirmText: '开庭',
      success: (r) => { if (r.confirm) wx.redirectTo({ url: '/pages/trial/trial' }) }
    })
  },
  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  },
  // 演示用：长按标题直接放出缺席审判
  unlockAbsent() {
    this.setData({ canAbsent: true })
    wx.showToast({ title: '已放出缺席审判', icon: 'none' })
  },
  back() {
    wx.navigateBack({ delta: 1, fail: () => wx.reLaunch({ url: '/pages/home/home' }) })
  }
})
