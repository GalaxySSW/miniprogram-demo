// 判决书：公文结构，双方同时可见，仅此一版
const app = getApp()

Page({
  data: {
    caseId: '',
    v: {},
    sealed: false
  },
  onLoad() {
    const g = app.globalData
    g.caseData.status = 'tried'

    // 误会指数是全产品唯一的数字，AI 偶尔会给出越界值或字符串，这里归一
    const v = { ...g.verdict }
    const n = Math.round(Number(v.index))
    v.index = (isNaN(n) || n < 1 || n > 100) ? 87 : n

    this.setData({ caseId: g.caseData.id, v })
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
