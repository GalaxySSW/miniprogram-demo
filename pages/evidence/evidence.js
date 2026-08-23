// 立案 · 呈上证据：聊天截图（≤9 张，可跳过）
// 下一步时把截图上传云存储，交给多模态模型直读（不做 OCR）
const app = getApp()
const ai = require('../../utils/ai.js')
const voice = require('../../utils/voice.js')

Page({
  data: {
    images: [],
    reading: false,
    ventText: '',       // 语音倾诉的转写结果，是这一步的主要输入
    recording: false,
    transcribing: false
  },
  recStart() {
    if (this.data.recording || this.data.transcribing || this.data.reading) return
    this.setData({ recording: true })
    voice.start()
  },
  recEnd() {
    if (!this.data.recording) return
    this.setData({ recording: false, transcribing: true })
    voice.stop().then(({ text, error }) => {
      this.setData({ transcribing: false })
      if (!text) {
        if (voice.handle(error)) return
        return wx.showToast({ title: voice.tip(error), icon: 'none', duration: 2200 })
      }
      this.setData({ ventText: (this.data.ventText ? this.data.ventText + ' ' : '') + text })
    })
  },
  onVentInput(e) {
    this.setData({ ventText: e.detail.value })
  },
  clearVent() {
    this.setData({ ventText: '' })
  },
  goBack() {
    wx.navigateBack({ delta: 1, fail: () => wx.reLaunch({ url: '/pages/home/home' }) })
  },
  chooseImage() {
    if (this.data.reading) return
    const remain = 9 - this.data.images.length
    if (remain <= 0) return
    // 真机上优先从聊天记录选图，模拟器用相册兜底
    const useChat = !!wx.chooseMessageFile
    const done = (paths) => this.setData({ images: this.data.images.concat(paths) })

    if (useChat) {
      wx.chooseMessageFile({
        count: remain,
        type: 'image',
        success: res => done(res.tempFiles.map(f => f.path)),
        fail: () => this.fromAlbum(remain, done)
      })
    } else {
      this.fromAlbum(remain, done)
    }
  },
  fromAlbum(count, done) {
    wx.chooseMedia({
      count,
      mediaType: ['image'],
      success: res => done(res.tempFiles.map(f => f.tempFilePath))
    })
  },
  removeImage(e) {
    const images = this.data.images.slice()
    images.splice(e.currentTarget.dataset.idx, 1)
    this.setData({ images })
  },
  next() {
    if (this.data.reading) return
    if (this.data.ventText) {
      const c = app.globalData.caseData
      c.myStatement = { ...(c.myStatement || {}), what: this.data.ventText }
    }
    const imgs = this.data.images
    if (!imgs.length) return wx.navigateTo({ url: '/pages/statement/statement' })

    this.setData({ reading: true })
    // 压缩后上传，控制多模态 token 成本；至多送 4 张给模型
    const jobs = imgs.slice(0, 4).map(p => new Promise(resolve => {
      wx.compressImage({
        src: p, quality: 60,
        success: r => resolve(r.tempFilePath),
        fail: () => resolve(p)
      })
    }).then(path => ai.upload(path, 'evidence')))

    Promise.all(jobs)
      .then(ids => {
        const fileIDs = ids.filter(Boolean)
        if (!fileIDs.length) return null
        app.globalData.caseData.evidenceFileIDs = fileIDs
        return ai.readScreenshots(fileIDs)
      })
      .then(res => {
        if (res && res.text) {
          app.globalData.caseData.screenshotText = res.text
          wx.showToast({ title: '证据已阅', icon: 'none' })
        }
        this.setData({ reading: false })
        wx.navigateTo({ url: '/pages/statement/statement' })
      })
      .catch(() => {
        this.setData({ reading: false })
        wx.navigateTo({ url: '/pages/statement/statement' })
      })
  },
  skip() {
    if (this.data.reading) return
    // 「先跳过」跳的是截图，不是跳你说的话——输入过的内容照样带走
    if (this.data.ventText) {
      const c = app.globalData.caseData
      c.myStatement = { ...(c.myStatement || {}), what: this.data.ventText }
    }
    wx.navigateTo({ url: '/pages/statement/statement' })
  }
})
