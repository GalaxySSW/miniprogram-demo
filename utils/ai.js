// 前端 AI 调用层：云开发就绪时走云函数，否则返回 null（页面回退到 mock）
// 失败原因一律打到 console，方便真机调试时一眼看出是超时、没配 key 还是别的
function call(action, data) {
  const app = getApp()
  if (!wx.cloud || !app.globalData.cloudReady) {
    console.warn(`[ai] 云开发未就绪，${action} 回退 mock`)
    app.globalData.aiUsed = false
    return Promise.resolve(null)
  }
  const t0 = Date.now()
  return wx.cloud.callFunction({ name: 'judge', data: { action, ...data } })
    .then(res => {
      const ms = Date.now() - t0
      if (res.result && res.result.ok) {
        console.log(`[ai] ${action} 成功，耗时 ${(ms / 1000).toFixed(1)}s`)
        app.globalData.aiUsed = true
        return res.result.result
      }
      console.warn(`[ai] ${action} 返回异常（${(ms / 1000).toFixed(1)}s）:`, res.result && res.result.error)
      app.globalData.aiUsed = false
      return null
    })
    .catch(err => {
      const ms = Date.now() - t0
      console.warn(`[ai] ${action} 调用失败（${(ms / 1000).toFixed(1)}s），回退 mock:`, err && err.errMsg || err)
      app.globalData.aiUsed = false
      return null
    })
}

// 上传本地文件到云存储，返回 fileID
function upload(tempFilePath, prefix) {
  if (!wx.cloud || !getApp().globalData.cloudReady) return Promise.resolve(null)
  const ext = (tempFilePath.split('.').pop() || 'dat').split('?')[0]
  const name = `${prefix}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`
  return wx.cloud.uploadFile({ cloudPath: name, filePath: tempFilePath })
    .then(r => r.fileID)
    .catch(err => { console.warn('[ai] 上传失败', err); return null })
}

module.exports = {
  upload,
  generateVerdict: (myStatement, theirStatement, patterns) =>
    call('verdict', { myStatement, theirStatement, patterns: patterns || [] }),
  quickReplies: (myStatement) => call('quickReply', { myStatement }),
  caseBrief: (myStatement) => call('brief', { myStatement }),
  interviewQuestions: (myStatement, theirStatement, side) =>
    call('interview', { myStatement, theirStatement, side }),
  // 逐轮对话：每次带上已有的方向与对话历史，换回下一句
  interviewTurn: (myStatement, theirStatement, side, angles, history) =>
    call('interviewTurn', { myStatement, theirStatement, side, angles, history }),
  // 补充视角：判决后觉得没说清，再聊几轮
  supplement: (myStatement, theirStatement, side, verdict, history) =>
    call('supplement', {
      myStatement, theirStatement, side,
      verdictTitle: (verdict || {}).verdictTitle, ruling: (verdict || {}).ruling,
      history
    }),
  readScreenshots: (fileIDs) => call('readScreenshots', { fileIDs }),
  transcribe: (fileID) => call('transcribe', { fileID })
}
