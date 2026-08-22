// 立案 · 呈上证据：聊天截图（≤9 张，可跳过）
Page({
  data: {
    images: []
  },
  chooseImage() {
    const remain = 9 - this.data.images.length
    if (remain <= 0) return
    // 真机上优先 wx.chooseMessageFile 从聊天记录直接取图，模拟器用相册兜底
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      success: (res) => {
        this.setData({
          images: this.data.images.concat(res.tempFiles.map(f => f.tempFilePath))
        })
      }
    })
  },
  removeImage(e) {
    const idx = e.currentTarget.dataset.idx
    const images = this.data.images.slice()
    images.splice(idx, 1)
    this.setData({ images })
  },
  next() {
    wx.navigateTo({ url: '/pages/statement/statement' })
  }
})
