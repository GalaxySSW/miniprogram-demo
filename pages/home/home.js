const app = getApp()
const casedb = require('../../utils/casedb.js')
const notify = require('../../utils/notify.js')

Page({
  data: {
    news: [],          // 新进展提醒：TA 应诉了 / 判决出来了 / 递来石子 / 该复盘了
    activeCase: null,
    completedCount: 0,
    starting: false
  },
  onShow() {
    notify.fetch().then(items => this.setData({ news: items || [] }))
    const c = app.globalData.caseData

    casedb.myCases().then(list => {
      if (!list) {
        // 云端取不到时，只有本地确实存着一桩没发出去的案子才显示
        const localPending = c.docId && (c.status === 'pending' || c.status === 'accepted')
        this.setData({ activeCase: localPending ? this.toHomeCase({
          _id: c.docId, caseId: c.id, status: c.status, topic: c.topic || '', note: c.note || ''
        }) : null })
        return
      }

      const completedCount = list.filter(x => x.status === 'closed' || x.review).length
      // 只算真正还没走完的：判决已出但还没落约定的也算完成，不该一直挂在首页催人
      const active = list.find(x => x.status !== 'closed' && !x.review && !x.verdict)

      if (active) {
        app.globalData.caseData.docId = active._id
        app.globalData.caseData.id = active.caseId
        if (active.note) app.globalData.caseData.note = active.note
      }
      this.setData({
        completedCount,
        activeCase: active ? this.toHomeCase(active) : null
      })
    })
  },
  toHomeCase(c) {
    const statusText = c.status === 'created' && !c.hasB ? '待对方加入'
      : c.status === 'created' ? '等待调解'
        : c.status === 'accepted' ? '已加入'
          : '调解中'
    return {
      docId: c._id,
      id: c.caseId || '未命名案件',
      shortId: this.compactCaseId(c.caseId),
      title: c.topic ? `「 ${c.topic} 」` : (c.note || '一桩还没说清楚的事'),
      statusText,
      actionText: '继续调解'
    }
  },
  compactCaseId(id) {
    const value = String(id || '').replace(/\s+/g, ' ').trim()
    const match = value.match(/(20\d{2}).*?(\d{4})/)
    return match ? `NO. ${match[1]}${match[2]}` : (value || 'NO. —')
  },
  resume() {
    const docId = (this.data.activeCase && this.data.activeCase.docId) || app.globalData.caseData.docId
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
  openNews(e) {
    const item = this.data.news[e.currentTarget.dataset.idx]
    if (!item) return
    notify.markSeen(item)
    const g = app.globalData.caseData
    g.docId = item.docId
    g.id = item.caseId
    wx.navigateTo({ url: {
      responded: '/pages/trial/trial',
      verdict: '/pages/verdict/verdict',
      pact: '/pages/pact/pact',
      pebble: '/pages/pebble/pebble',
      review: '/pages/review/review'
    }[item.kind] || '/pages/history/history' })
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },
  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },
})
