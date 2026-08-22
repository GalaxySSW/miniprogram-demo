// 先回一句：低风险话术轮换；云开发就绪时由 DeepSeek 生成，否则用内置话术
const app = getApp()
const ai = require('../../utils/ai.js')

Page({
  data: {
    suggestions: [],
    suggestion: '',
    idx: 0,
    copied: false,
    loading: true
  },
  onLoad() {
    const fallback = app.globalData.replySuggestions
    this.setData({ suggestions: fallback, suggestion: fallback[0] })
    ai.quickReplies(app.globalData.caseData.myStatement).then(res => {
      if (res && res.replies && res.replies.length) {
        this.setData({ suggestions: res.replies, suggestion: res.replies[0], idx: 0 })
      }
      this.setData({ loading: false })
    })
  },
  change() {
    const list = this.data.suggestions
    const idx = (this.data.idx + 1) % list.length
    this.setData({ idx, suggestion: list[idx], copied: false })
  },
  copy() {
    wx.setClipboardData({
      data: this.data.suggestion,
      success: () => {
        this.setData({ copied: true })
        wx.showToast({ title: '判官在后台等 TA', icon: 'none' })
      }
    })
  },
  next() {
    wx.redirectTo({ url: '/pages/preview/preview' })
  }
})
