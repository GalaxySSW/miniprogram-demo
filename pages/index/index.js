// pages/index/index.js
const app = getApp()

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile')
  },
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  getUserProfile() {
    // 推荐使用 wx.getUserProfile 获取用户信息
    wx.getUserProfile({
      desc: '展示用户信息',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  }
})
