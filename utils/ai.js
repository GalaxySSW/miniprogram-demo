// 前端 AI 调用层：云开发就绪时走云函数，否则返回 null（页面回退到 mock）
function call(action, data) {
  if (!wx.cloud || !getApp().globalData.cloudReady) {
    return Promise.resolve(null)
  }
  return wx.cloud.callFunction({ name: 'judge', data: { action, ...data } })
    .then(res => {
      if (res.result && res.result.ok) return res.result.result
      console.warn('judge 返回异常', res.result)
      return null
    })
    .catch(err => {
      console.warn('judge 调用失败，回退 mock', err)
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
    .catch(err => { console.warn('上传失败', err); return null })
}

module.exports = {
  upload,
  generateVerdict: (myStatement, theirStatement) => call('verdict', { myStatement, theirStatement }),
  quickReplies: (myStatement) => call('quickReply', { myStatement }),
  interviewQuestions: (myStatement, theirStatement, side) => call('interview', { myStatement, theirStatement, side }),
  // 截图直读：传云存储 fileID 数组，返回 { text }
  readScreenshots: (fileIDs) => call('readScreenshots', { fileIDs }),
  // 语音转写：传云存储 fileID，返回 { text }
  transcribe: (fileID) => call('transcribe', { fileID })
}
