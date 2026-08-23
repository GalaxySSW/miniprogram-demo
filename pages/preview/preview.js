// 传票预览确认：明示 TA 能看到 / 看不到什么——隐私信任的关键屏
// 两样东西会给对方看：A 自己写的一句话（信），以及一句中立案由（这事是关于什么）
const app = getApp()
const ai = require('../../utils/ai.js')
const casedb = require('../../utils/casedb.js')

const TEMPLATES = [
  '我不想再这样吵下去了，陪我试个东西行吗？',
  '刚才我说话冲了。我想好好说一次。',
  '我们都冷了这么久了，聊聊吧。',
  '我找了个「判官」评评理——不管判谁，我都想和好。'
]

Page({
  data: {
    templates: TEMPLATES,
    tplIdx: 0,
    note: TEMPLATES[0],
    brief: '',
    briefLoading: true,
    briefError: '',
    saving: false,
    saveError: '',
    showTpl: false
  },
  onLoad() {
    const c = app.globalData.caseData
    if (c.note) this.setData({ note: c.note, tplIdx: -1 })

    if (c.brief) {
      this.setData({ brief: c.brief, briefLoading: false })
      return
    }
    // 让判官从陈述里提炼一句中立案由，剥掉情绪和指责
    ai.caseBrief(c.myStatement).then(res => {
      if (app.globalData.cloudReady && !res) {
        return this.setData({ brief: '', briefLoading: false, briefError: '案由暂时提炼失败，请手动写一句中立的案由。' })
      }
      const brief = (res && res.brief) || '关于最近你们之间的一件事'
      c.brief = brief
      this.setData({ brief, briefLoading: false })
    }).catch(() => this.setData({ briefLoading: false, briefError: '案由暂时提炼失败，可以先手动写一句。' }))
  },
  toggleTpl() {
    this.setData({ showTpl: !this.data.showTpl })
  },
  pickTpl(e) {
    const idx = e.currentTarget.dataset.idx
    this.setData({ tplIdx: idx, note: this.data.templates[idx] })
  },
  onNoteInput(e) {
    this.setData({ note: e.detail.value, tplIdx: -1 })
  },
  onBriefInput(e) {
    this.setData({ brief: e.detail.value })
  },
  confirm() {
    if (this.data.saving) return
    const c = app.globalData.caseData
    c.note = (this.data.note || '').trim()
    c.brief = (this.data.brief || '').trim()
    const go = () => wx.navigateTo({ url: '/pages/share/share' })
    this.setData({ saving: true, saveError: '' })
    if (c.docId) {
      casedb.saveNote(c.docId, c.note, c.brief).then(result => {
        if (app.globalData.cloudReady && !result) {
          return this.setData({ saving: false, saveError: '传票内容没有保存成功，请重试；草稿仍留在本页。' })
        }
        this.setData({ saving: false })
        go()
      }).catch(() => this.setData({ saving: false, saveError: '传票内容暂时没保存好，请重试。' }))
    } else {
      this.setData({ saving: false })
      go()
    }
  },
  retryConfirm() { this.confirm() },
  edit() {
    const pages = getCurrentPages()
    const idx = pages.findIndex(p => p.route === 'pages/statement/statement')
    if (idx >= 0) wx.navigateBack({ delta: pages.length - 1 - idx })
    else wx.navigateTo({ url: '/pages/statement/statement' })
  },
  back() {
    wx.navigateBack({ delta: 1, fail: () => wx.reLaunch({ url: '/pages/home/home' }) })
  }
})
