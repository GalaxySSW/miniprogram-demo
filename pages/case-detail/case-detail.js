const app = getApp()
const casedb = require('../../utils/casedb.js')

const MOCK = {
  _id: 'mock-case',
  caseId: '2026 情字第 0822 号',
  topic: '一次没说清楚的架',
  status: 'tried',
  hasB: true,
  verdict: { ruling: '误会有罪，你们二人无罪。' },
  pact: null,
  review: null
}

function viewOf(c) {
  const item = c || MOCK
  const hasVerdict = !!item.verdict
  const hasPact = !!item.pact
  const isClosed = item.status === 'closed'
  let statusText = '立案中'
  let nextText = '继续陈述'
  let nextRoute = '/pages/evidence/evidence'
  let progress = '你正在整理这桩心事'

  if (item.status === 'created' && !item.hasB) {
    statusText = '等待传票'
    nextText = '继续发传票'
    nextRoute = '/pages/preview/preview'
    progress = '案件已建立，还差把传票交给 TA'
  } else if (item.status === 'created' && item.hasB) {
    statusText = '等待应诉'
    nextText = '查看等待进度'
    nextRoute = '/pages/waiting/waiting'
    progress = 'TA 还没有完成应诉'
  } else if (item.status === 'responded') {
    statusText = '可以开庭'
    nextText = '开始开庭'
    nextRoute = '/pages/trial/trial'
    progress = '双方已经说过了，可以一起看清这件事'
  } else if (hasVerdict && !hasPact) {
    statusText = '判决已出'
    nextText = '一起定约定'
    nextRoute = '/pages/pact/pact'
    progress = '共同结果已经生成，还差一件做得到的小事'
  } else if (hasPact && !isClosed) {
    statusText = '约定待确认'
    nextText = '确认共同约定'
    nextRoute = '/pages/pact/pact'
    progress = '约定已经提出，等双方都点头'
  } else if (isClosed && !item.review) {
    statusText = '等待复盘'
    nextText = '去复盘约定'
    nextRoute = '/pages/review/review'
    progress = '过几天再回来看看，这个约定有没有帮上忙'
  } else if (item.review) {
    statusText = '已复盘'
    nextText = '查看共同结果'
    nextRoute = '/pages/verdict/verdict'
    progress = '这桩案子已经留下了一次共同复盘'
  } else if (hasVerdict) {
    statusText = '审理完成'
    nextText = '查看判决书'
    nextRoute = '/pages/verdict/verdict'
    progress = '判决已经准备好'
  }

  return {
    docId: item._id || '',
    caseId: item.caseId || '未命名案件',
    title: item.topic ? `${item.topic}案` : '一桩还没说清楚的架',
    statusText,
    nextText,
    nextRoute,
    progress,
    hasB: !!item.hasB,
    verdict: item.verdict,
    pact: item.pact,
    review: item.review,
    source: item.source || 'cloud'
  }
}

Page({
  data: { loading: true, error: '', caseView: viewOf(null), source: 'mock' },

  onLoad(options) {
    this.docId = options.docId || app.globalData.caseData.docId || ''
    this.source = options.source || 'history'
    this.loadCase()
  },

  onShow() {
    if (this.docId && this.data.caseView.docId && this.data.caseView.docId !== 'mock-case') this.loadCase()
  },

  loadCase() {
    this.setData({ loading: true, error: '' })
    if (!this.docId) {
      this.setData({ loading: false, source: 'mock', caseView: viewOf(null), error: '没有找到这桩案件' })
      return
    }
    casedb.getCase(this.docId).then(c => {
      if (!c) {
        this.setData({ loading: false, source: 'fallback', caseView: viewOf({ ...MOCK, _id: this.docId }), error: '案件暂时无法调出' })
        return
      }
      app.globalData.caseData.docId = c._id
      app.globalData.caseData.id = c.caseId
      app.globalData.caseData.pact = c.pact
      if (c.verdict) app.globalData.verdict = c.verdict
      this.setData({ loading: false, source: 'cloud', caseView: viewOf(c) })
    }).catch(() => {
      this.setData({ loading: false, source: 'fallback', caseView: viewOf({ ...MOCK, _id: this.docId }), error: '案件暂时无法调出' })
    })
  },

  retry() { this.loadCase() },

  openNext() {
    const view = this.data.caseView
    if (!view.nextRoute) return
    const query = view.docId ? `?docId=${encodeURIComponent(view.docId)}&source=case-detail` : ''
    wx.navigateTo({ url: `${view.nextRoute}${query}` })
  },

  goHistory() {
    wx.navigateBack({ delta: 1, fail: () => wx.reLaunch({ url: '/pages/history/history' }) })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  },
  back() {
    this.goHistory()
  }
})
