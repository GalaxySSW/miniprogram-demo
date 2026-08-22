// 递石子 · 冷战通道
// 说不出话的时候，递一个不需要语言的信号：一首歌、一张图、一个表情。
// 不解释、不分析，只告诉 TA 一件事：我还在。
// 石子必须真的送到对方那里，并且能被收下、能被回递——否则它只是个空动作。
const app = getApp()
const casedb = require('../../utils/casedb.js')
const ai = require('../../utils/ai.js')

// 表情是策展过的，不是全量选择器——少而有意，才像石子
const EMOJIS = ['🌙', '☕️', '🌧', '🫧', '🐱', '🍜', '🌱', '🩹']

Page({
  data: {
    list: [],
    rounds: 0,
    sentToday: 0,
    unreceived: 0,
    maxDaily: 3,
    composing: false,
    tab: 'emoji',        // emoji | song | image
    emojis: EMOJIS,
    picked: '',
    songText: '',
    imgPath: '',
    sending: false,
    loading: true
  },

  onShow() { this.load() },

  load() {
    const c = app.globalData.caseData
    if (!c.docId) {
      this.setData({ loading: false })
      return
    }
    casedb.pebbleFeed(c.docId).then(r => {
      if (!r) return this.setData({ loading: false })
      this.setData({
        list: r.list || [],
        rounds: r.rounds || 0,
        sentToday: r.sentToday || 0,
        unreceived: r.unreceived || 0,
        loading: false
      })
    })
  },

  // —— 收下 ——
  receive(e) {
    const id = e.currentTarget.dataset.id
    casedb.receivePebble(id).then(() => {
      wx.showToast({ title: '你收下了', icon: 'none' })
      this.load()
    })
  },

  // —— 递一颗 ——
  startCompose() {
    if (this.data.sentToday >= this.data.maxDaily) {
      return wx.showToast({ title: '今天够了，去说句话吧', icon: 'none' })
    }
    this.setData({ composing: true, picked: '', songText: '', imgPath: '' })
  },
  cancelCompose() { this.setData({ composing: false }) },
  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.tab }) },
  pickEmoji(e) { this.setData({ picked: e.currentTarget.dataset.emoji }) },
  onSongInput(e) { this.setData({ songText: e.detail.value }) },
  chooseImage() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'],
      success: res => this.setData({ imgPath: res.tempFiles[0].tempFilePath })
    })
  },

  send() {
    if (this.data.sending) return
    const { tab, picked, songText, imgPath } = this.data
    const c = app.globalData.caseData

    if (tab === 'emoji' && !picked) return wx.showToast({ title: '先挑一个', icon: 'none' })
    if (tab === 'song' && !songText.trim()) return wx.showToast({ title: '写个歌名就行', icon: 'none' })
    if (tab === 'image' && !imgPath) return wx.showToast({ title: '先选一张图', icon: 'none' })

    this.setData({ sending: true })
    const done = (payload) => {
      casedb.pebble(c.docId, tab, payload).then(r => {
        this.setData({ sending: false, composing: false })
        if (!r) return wx.showToast({ title: '今天够了，去说句话吧', icon: 'none' })
        wx.showToast({ title: '递过去了', icon: 'none' })
        this.load()
      })
    }

    if (tab === 'image') {
      ai.upload(imgPath, 'pebble').then(fileID => done(fileID || ''))
    } else {
      done(tab === 'emoji' ? picked : songText.trim())
    }
  },

  // 石子往来两次之后，判官才轻声问一句
  reopen() {
    wx.redirectTo({ url: '/pages/respond/respond' })
  },
  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  }
})
