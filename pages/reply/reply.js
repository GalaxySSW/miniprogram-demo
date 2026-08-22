// 先回一句：低风险话术轮换；云开发就绪时由 DeepSeek 生成，否则用内置话术
const app = getApp()
const ai = require('../../utils/ai.js')
const notify = require('../../utils/notify.js')

Page({
  data: {
    suggestions: [],
    suggestion: '',
    stance: '',
    idx: 0,
    copied: false,
    loading: true
  },
  onLoad() {
    const fallback = app.globalData.replySuggestions
    this.setData({ suggestions: fallback, suggestion: fallback[0] })
    ai.quickReplies(app.globalData.caseData.myStatement).then(res => {
      // 这一页是情绪最高的入口，安全阀必须和开庭页、问话页一样接上
      if (res && res.safety) {
        wx.showModal({
          title: '本庭要先说一件更重要的事',
          content: res.message,
          showCancel: false,
          success: () => wx.reLaunch({ url: '/pages/home/home' })
        })
        return
      }
      if (res && res.replies && res.replies.length) {
        this.setData({ suggestions: res.replies, suggestion: res.replies[0], idx: 0 })
      }
      // 这段只有当事人自己看得到，所以判官可以明确站在 TA 这边
      if (res && res.stance) this.setData({ stance: res.stance })
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
        // 一次授权换一次推送：TA 应诉时把人叫回来
        notify.askSubscribe(['responded', 'verdict'])
      }
    })
  },
  next() {
    wx.redirectTo({ url: '/pages/preview/preview' })
  }
})
