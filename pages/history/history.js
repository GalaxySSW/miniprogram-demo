// 卷宗：案件历史，状态胶囊两色（复盘中蜜色 / 已和好抹茶）
const app = getApp()
const casedb = require('../../utils/casedb.js')

const MOCK = [
  { id: '2026 情字第 0822 号', title: '加班晚归案', status: 'review', statusText: '复盘中', pact: '约定：出行提前一句' },
  { id: '2026 情字第 0731 号', title: '朋友圈没点赞案', status: 'done', statusText: '已和好', pact: '约定：睡前不带气' }
]

Page({
  data: {
    cases: MOCK
  },
  onShow() {
    casedb.myCases().then(list => {
      if (!list || !list.length) return
      this.setData({
        cases: list.map(c => ({
          docId: c._id,
          id: c.caseId,
          title: c.verdict && c.verdict.pactTitle ? c.verdict.pactTitle + '案' : '待判决',
          status: c.status === 'closed' ? 'done' : 'review',
          statusText: c.status === 'closed' ? '已和好' : '复盘中',
          pact: c.pact ? '约定：' + c.pact.title : '尚未落成约定'
        }))
      })
    })
  },
  openCase(e) {
    const docId = e.currentTarget.dataset.docid
    if (docId) app.globalData.caseData.docId = docId
    wx.navigateTo({ url: '/pages/verdict/verdict' })
  }
})
