// 前端案件数据层：云开发就绪时走 casedb 云函数，否则返回 null（页面回退到本地 globalData）
function call(action, data) {
  if (!wx.cloud || !getApp().globalData.cloudReady) {
    return Promise.resolve(null)
  }
  return wx.cloud.callFunction({
    name: 'casedb',
    data: { action, ...data }
  }).then(res => {
    if (res.result && res.result.ok) return res.result.result
    console.warn('casedb 返回异常', res.result)
    return null
  }).catch(err => {
    console.warn('casedb 调用失败，回退本地态', err)
    return null
  })
}

module.exports = {
  createCase: (statement) => call('create', { statement }),
  getCase: (_id) => call('get', { _id }),
  // demo=true：单机演示时扮演对方，绕过「不能给自己应诉」的限制
  respond: (_id, statement, demo) => call('respond', { _id, statement, demo: !!demo }),
  saveNote: (_id, note) => call('saveNote', { _id, note }),
  saveVerdict: (_id, verdict) => call('saveVerdict', { _id, verdict }),
  savePact: (_id, pact) => call('savePact', { _id, pact }),
  pebble: (_id, type) => call('pebble', { _id, type }),
  myCases: () => call('myCases', {}),
  destroy: (_id) => call('destroy', { _id }),
  // 关系模式记忆：主语永远是「你们」，不存任何描述个人的内容
  patterns: (_id) => call('patterns', { _id }),
  myPatterns: () => call('myPatterns', {}),
  recordPattern: (_id, topic) => call('recordPattern', { _id, topic }),
  saveReview: (_id, result) => call('saveReview', { _id, result }),
  forgetPatterns: () => call('forgetPatterns', {})
}
