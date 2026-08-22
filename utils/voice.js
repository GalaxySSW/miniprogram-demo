// 语音输入：按住录音 → 上传云存储 → whisper 转写
// 用法：voice.start() / voice.stop().then(text => ...)
const ai = require('./ai.js')

const recorder = wx.getRecorderManager()
let stopResolve = null
let stopReject = null

recorder.onStop((res) => {
  if (!stopResolve) return
  const resolve = stopResolve; const reject = stopReject
  stopResolve = null; stopReject = null

  if (!res.tempFilePath || res.duration < 800) {
    return resolve('')  // 太短，当作误触
  }
  ai.upload(res.tempFilePath, 'voice')
    .then(fileID => {
      if (!fileID) return resolve('')
      return ai.transcribe(fileID).then(r => resolve((r && r.text) || ''))
    })
    .catch(reject)
})

recorder.onError((err) => {
  console.warn('录音失败', err)
  if (stopReject) { stopReject(err); stopResolve = null; stopReject = null }
})

module.exports = {
  start() {
    recorder.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3'
    })
  },
  // 返回 Promise<string>：转写文本，空串表示无有效内容
  stop() {
    return new Promise((resolve, reject) => {
      stopResolve = resolve
      stopReject = reject
      recorder.stop()
    })
  }
}
