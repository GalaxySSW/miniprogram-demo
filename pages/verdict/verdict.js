// 判决书：公文结构，双方同时可见，仅此一版
// 判决主文按案件分型走不同措辞：纯误会 / 单边越界 / 认知错位
const app = getApp()

// 印章随案件类型变：判的是什么，章上就写什么
const SEALS = {
  misunderstanding: { top: '误会', bottom: '有罪' },
  breach: { top: '有错', bottom: '可改' },
  mismatch: { top: '未曾', bottom: '对齐' }
}

Page({
  data: {
    caseId: '',
    v: {},
    seal: SEALS.misunderstanding,
    sealed: false,
    isMock: false,
    hasWords: false,
    hasSteps: false
  },
  onLoad() {
    const g = app.globalData
    g.caseData.status = 'tried'

    const v = { ...g.verdict }

    // 误会指数是全产品唯一的数字，AI 偶尔会给出越界值或字符串，这里归一
    const n = Math.round(Number(v.index))
    v.index = (isNaN(n) || n < 1 || n > 100) ? 87 : n

    const type = SEALS[v.caseType] ? v.caseType : 'misunderstanding'
    if (!v.verdictTitle) v.verdictTitle = '本案不存在被告。'

    // 从卷宗打开旧案时，云端那份可能缺字段——缺就整段不渲染，不留空标签
    const hasWords = !!(v.herWord && v.herMeaning) || !!(v.hisWord && v.hisMeaning)
    const hasSteps = !!(v.herStep || v.hisStep)

    this.setData({
      caseId: g.caseData.id,
      v,
      seal: SEALS[type],
      isMock: g.aiUsed === false,
      hasWords,
      hasSteps
    })
    setTimeout(() => this.setData({ sealed: true }), 600)
  },
  copyStep(e) {
    const text = e.currentTarget.dataset.text
    if (!text) return
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '已复制', icon: 'none' }) })
  },
  saveImage() {
    wx.navigateTo({ url: '/pages/poster/poster' })
  },
  supplement() {
    // 判决不是终点：觉得没说清就回去补充，补完重新审
    const side = app.globalData.caseData.side === 'a' ? 'a' : 'b'
    wx.navigateTo({ url: `/pages/interview/interview?mode=supplement&side=${side}` })
  },
  goPact() {
    wx.navigateTo({ url: '/pages/pact/pact' })
  }
})
