// 卷宗：案件历史，状态胶囊两色（复盘中蜜色 / 已和好抹茶）
// 点开旧案时按案件 ID 从云端读回那一份判决，避免显示当前内存里的别的案子
const casedb = require('../../utils/casedb.js')

const MOCK = [
  { id: '2026 情字第 0822 号', title: '加班晚归案', status: 'review', statusText: '复盘中', pact: '约定：出行提前一句', canReview: true },
  { id: '2026 情字第 0731 号', title: '朋友圈没点赞案', status: 'done', statusText: '已和好', pact: '约定：睡前不带气', canReview: false }
]

Page({
  data: {
    cases: MOCK,
    fromCloud: false,
    loading: true,
    error: ''
  },
  onShow() {
    this.setData({ loading: true, error: '' })
    casedb.myCases().then(list => {
      if (list === null && appGlobalCloudReady()) {
        return this.setData({ loading: false, error: '卷宗暂时没调出来，请重试。' })
      }
      if (!list || !list.length) {
        return this.setData({ loading: false, fromCloud: false, cases: MOCK })
      }
      this.setData({
        fromCloud: true,
        loading: false,
        cases: list.map(c => ({
          docId: c._id,
          id: c.caseId,
          title: c.topic ? c.topic + '案' : (c.status === 'created' ? '待应诉' : '待判决'),
          status: c.review || c.status === 'tried' ? 'done' : (c.status === 'closed' ? 'review' : 'open'),
          statusText: c.review ? '已复盘'
            : (c.status === 'closed' ? '待复盘'
              : (c.status === 'tried' ? '判决已出' : '审理中')),
          pact: c.pact ? '约定：' + c.pact.title
            : (c.status === 'tried' ? '判决书已就绪，点开看看' : '尚未落成约定'),
          canReview: c.status === 'closed' && !c.review
        }))
      })
    }).catch(() => this.setData({ loading: false, error: '卷宗暂时没调出来，请重试。' }))
  },
  openCase(e) {
    const docId = e.currentTarget.dataset.docid
    if (!docId) return wx.navigateTo({ url: '/pages/case-detail/case-detail?source=history' })
    wx.navigateTo({ url: `/pages/case-detail/case-detail?docId=${encodeURIComponent(docId)}&source=history` })
  },
  goReview(e) {
    const docId = e.currentTarget.dataset.docid || ''
    wx.navigateTo({ url: `/pages/review/review?docId=${docId}` })
  },
  retry() {
    this.onShow()
  },
  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  }
})

function appGlobalCloudReady() {
  const app = getApp()
  return !!(app && app.globalData && app.globalData.cloudReady)
}
