// 立案 · 呈上证据：聊天截图（≤9 张，可跳过）
// 下一步时把截图上传云存储，交给多模态模型直读（不做 OCR）
const app = getApp()
const ai = require('../../utils/ai.js')

Page({
  data: {
    images: [],
    reading: false
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
    wx.navigateTo({ url: '/pages/statement/statement' })
  }
})
