const app = getApp()
const casedb = require('../../utils/casedb.js')

Page({
  data: {
    activeCase: null,
    completedCount: 0,
    starting: false
  },
  onShow() {
    casedb.myCases().then(list => {
      if (!list) return
      const completedCount = list.filter(c => c.status === 'closed' || c.review || c.verdict).length
      const active = list.find(c => c.status !== 'closed' && !c.review && !c.verdict)
      this.setData({
        completedCount,
        activeCase: active ? this.toHomeCase(active) : null
      })
    })
    const c = app.globalData.caseData
    if (c.docId && (c.status === 'pending' || c.status === 'accepted')) {
      this.setData({ activeCase: this.toHomeCase({
        _id: c.docId,
        caseId: c.id,
        status: c.status,
        topic: c.topic || '',
        note: c.note || ''
      }) })
    } else {
      // 云端还挂着没发出去的案子也要捡回来
      casedb.myCases().then(list => {
        if (!list) return
        const open = list.find(x => x.side === 'a' && x.status === 'created' && !x.hasB)
        if (open) {
          app.globalData.caseData.docId = open._id
          app.globalData.caseData.id = open.caseId
          app.globalData.caseData.note = open.note || ''
          this.setData({ activeCase: this.toHomeCase(open) })
        }
      })
    }
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
  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },
  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },
})
