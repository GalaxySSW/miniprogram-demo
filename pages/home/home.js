const app = getApp()
const casedb = require('../../utils/casedb.js')
const notify = require('../../utils/notify.js')

Page({
  data: {
    quotes: [],
    pending: null,   // 缓着没发传票的案子，随时可以捡回来
    news: [],         // 站内提醒：TA 应诉了 / 判决出来了 / 递来石子 / 该复盘了
    recentCases: [],
    starting: false
  },
  onLoad() {
    this.setData({ quotes: app.globalData.quotes })
  },
  onShow() {
    notify.fetch().then(items => this.setData({ news: items || [] }))
    casedb.myCases().then(list => {
      if (!list) return
      this.setData({ recentCases: list.slice(0, 3).map(c => ({
        docId: c._id,
        id: c.caseId,
        title: c.topic ? `${c.topic}案` : (c.status === 'created' ? '待应诉' : '一桩案件'),
        statusText: c.review ? '已复盘' : (c.verdict ? '判决已出' : (c.status === 'closed' ? '待复盘' : '审理中'))
      })) })
    })
    const c = app.globalData.caseData
    if (c.docId && (c.status === 'pending' || c.status === 'accepted')) {
      this.setData({ pending: { id: c.id } })
    } else {
      // 云端还挂着没发出去的案子也要捡回来
      casedb.myCases().then(list => {
        if (!list) return
        const open = list.find(x => x.side === 'a' && x.status === 'created' && !x.hasB)
        if (open) {
          app.globalData.caseData.docId = open._id
          app.globalData.caseData.id = open.caseId
          app.globalData.caseData.note = open.note || ''
          this.setData({ pending: { id: open.caseId } })
        }
      })
    }
  },
  openNews(e) {
    const item = this.data.news[e.currentTarget.dataset.idx]
    if (!item) return
    notify.markSeen(item)
    const g = app.globalData.caseData
    g.docId = item.docId
    g.id = item.caseId
    wx.navigateTo({ url: `/pages/case-detail/case-detail?docId=${encodeURIComponent(item.docId)}&source=inbox` })
  },

  resume() {
    const docId = app.globalData.caseData.docId
    wx.navigateTo({ url: docId ? `/pages/case-detail/case-detail?docId=${encodeURIComponent(docId)}&source=home` : '/pages/preview/preview' })
  },
  startCase() {
    if (this.data.starting) return
    this.setData({ starting: true })
    wx.navigateTo({
      url: '/pages/evidence/evidence',
      complete: () => this.setData({ starting: false })
    })
  },
  // 未认证的小程序转发受限，所以留一条口令入口
  gotSummons() {
    wx.showModal({
      title: '输入传票口令',
      editable: true,
      placeholderText: '六位字母数字，如 K7QM2X',
      confirmText: '进入',
      success: (res) => {
        if (!res.confirm) return
        const code = (res.content || '').trim().toUpperCase()
        if (!code) return wx.navigateTo({ url: '/pages/respond/respond' })

        wx.showLoading({ title: '正在调卷' })
        casedb.getByCode(code).then(c => {
          wx.hideLoading()
          if (!c || !c._id) {
            return wx.showToast({ title: '没找到这个案子，口令对吗？', icon: 'none' })
          }
          const g = app.globalData.caseData
          g.docId = c._id
          g.id = c.caseId
          g.note = c.note || ''
          // 自己的案子用自己的口令进来 = 单机测试，自动开演示模式扮演对方，
          // 否则服务端会以「不能给自己的案子应诉」拒掉，双人数据建不起来
          g.demoMode = (c.side === 'a')
          if (g.demoMode) {
            wx.showToast({ title: '同一个微信号，已按演示模式扮演 TA', icon: 'none', duration: 2200 })
          }
          wx.navigateTo({ url: `/pages/respond/respond?docId=${c._id}` })
        }).catch(() => {
          wx.hideLoading()
          wx.showToast({ title: '没找到这个案子', icon: 'none' })
        })
      }
    })
  },
  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },
  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },
  openRecent(e) {
    const docId = e.currentTarget.dataset.docid
    if (!docId) return
    wx.navigateTo({ url: `/pages/case-detail/case-detail?docId=${encodeURIComponent(docId)}&source=home` })
  }
})
