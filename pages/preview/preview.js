// 传票预览确认：明示 TA 能看到 / 看不到什么——隐私信任的关键屏
// 卡片是信封，A 自己写的这句话才是信：让传票看起来是本人开口，不是平台通知
const app = getApp()
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
    note: TEMPLATES[0]
  },
  onLoad() {
    const saved = app.globalData.caseData.note
    if (saved) this.setData({ note: saved, tplIdx: -1 })
  },
  pickTpl(e) {
    const idx = e.currentTarget.dataset.idx
    this.setData({ tplIdx: idx, note: this.data.templates[idx] })
  },
  onNoteInput(e) {
    this.setData({ note: e.detail.value, tplIdx: -1 })
  },
  confirm() {
    const c = app.globalData.caseData
    c.note = (this.data.note || '').trim()
    const go = () => wx.navigateTo({ url: '/pages/share/share' })
    if (c.docId && c.note) casedb.saveNote(c.docId, c.note).then(go)
    else go()
  },
  edit() {
    const pages = getCurrentPages()
    const idx = pages.findIndex(p => p.route === 'pages/statement/statement')
    if (idx >= 0) wx.navigateBack({ delta: pages.length - 1 - idx })
    else wx.navigateTo({ url: '/pages/statement/statement' })
  }
})
