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
    sealed: false
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

    this.setData({ caseId: g.caseData.id, v, seal: SEALS[type] })
    setTimeout(() => this.setData({ sealed: true }), 600)
  },
  copyStep(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.text })
  },
  saveImage() {
    // TODO: 用 canvas 生成分享长图；黑客松阶段先用系统截图
    wx.showToast({ title: '长按屏幕截图分享（长图生成开发中）', icon: 'none' })
  },
  goPact() {
    wx.navigateTo({ url: '/pages/pact/pact' })
  }
})
