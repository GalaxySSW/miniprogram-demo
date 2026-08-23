// 对方应诉页：先看到 TA 本人写的那句话，再看到本庭是什么——先是人，再是工具
const app = getApp()
const casedb = require('../../utils/casedb.js')

Page({
  data: {
    note: '',
    brief: '',
    loading: false,
    error: ''
  },
  onLoad(options) {
    this.options = options || {}
    this.loadInvite(options)
  },
  loadInvite(options) {
    const query = options || this.options || {}
    this.setData({ loading: !!query.docId, error: '' })
    if (query.docId) {
      app.globalData.caseData.docId = query.docId
      casedb.getCase(query.docId).then(c => {
        if (c && c.note) this.setData({ note: c.note })
        if (c && c.brief) this.setData({ brief: c.brief })
        const g = app.globalData.caseData
        const hasInvite = !!((c && c.note) || g.note)
        this.setData({ loading: false, error: hasInvite ? '' : '这份传票暂时调不出来，请稍后重试。' })
      }).catch(() => this.setData({ loading: false, error: '这份传票暂时调不出来，请稍后重试。' }))
      return
    }
    // 单机演示时云端可能还没写入，用本地那份兜底
    const g = app.globalData.caseData
    if (!this.data.note && g.note) this.setData({ note: g.note })
    if (!this.data.brief && g.brief) this.setData({ brief: g.brief })
    this.setData({ loading: false, error: this.data.note || g.note ? '' : '还没有收到有效的传票内容。' })
  },
  willTalk() {
    wx.redirectTo({ url: '/pages/their-statement/their-statement' })
  },
  notNow() {
    wx.showToast({ title: '好，本庭替你转告：你还需要一点时间', icon: 'none', duration: 2000 })
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/pebble/pebble' })
    }, 2000)
  },
  retry() {
    this.loadInvite(this.options)
  },
  back() {
    wx.navigateBack({ delta: 1, fail: () => wx.reLaunch({ url: '/pages/home/home' }) })
  }
})
