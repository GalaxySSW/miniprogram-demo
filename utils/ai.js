// 前端 AI 调用层：云开发就绪时走云函数，否则返回 null（页面回退到 mock）
// 云环境 ID 在 app.js 的 CLOUD_ENV 配置

function call(action, data) {
  if (!wx.cloud || !getApp().globalData.cloudReady) {
    return Promise.resolve(null)
  }
  return wx.cloud.callFunction({
    name: 'judge',
    data: { action, ...data }
  }).then(res => {
    if (res.result && res.result.ok) return res.result.result
    console.warn('judge 云函数返回异常', res.result)
    return null
  }).catch(err => {
    console.warn('judge 云函数调用失败，回退 mock', err)
    return null
  })
}

module.exports = {
  // 判决书；返回 null 时页面用 globalData.verdict 的 mock
  generateVerdict(myStatement, theirStatement) {
    return call('verdict', { myStatement, theirStatement })
  },
  // 先回一句；返回 null 时页面用 globalData.replySuggestions
  quickReplies(myStatement) {
    return call('quickReply', { myStatement })
  },
  interviewQuestions(myStatement, theirStatement, side) {
    return call('interview', { myStatement, theirStatement, side })
  }
}
