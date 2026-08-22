// 语音输入：按住录音 → 上传云存储 → 语音模型转写
// 用法：voice.start() / voice.stop().then(text => ...)
// 关键：任何失败路径都必须让 stop() 的 Promise 落地，否则页面会永远卡在「正在听写」
const ai = require('./ai.js')

const recorder = wx.getRecorderManager()
let pending = null      // { resolve, reject, timer }
let started = false

function settle(text) {
  if (!pending) return
  clearTimeout(pending.timer)
  const { resolve } = pending
  pending = null
  resolve(text || '')
}

recorder.onStart(() => { started = true })

recorder.onStop((res) => {
  started = false
  if (!pending) return
  if (!res || !res.tempFilePath || res.duration < 800) {
    return settle('')   // 太短，当作误触
  }
  ai.upload(res.tempFilePath, 'voice')
    .then(fileID => {
      if (!fileID) return settle('')
      return ai.transcribe(fileID).then(r => settle((r && r.text) || ''))
    })
    .catch(err => {
      console.warn('转写失败', err)
      settle('')
    })
})

recorder.onError((err) => {
  console.warn('录音失败', err)
  started = false
  settle('')   // 授权被拒、设备不支持等，一律安静落地，不让 UI 卡住
})

module.exports = {
  start() {
    started = false
    recorder.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3'
    })
  },
  // 返回 Promise<string>：转写文本，空串表示没有有效内容
  stop() {
    return new Promise((resolve) => {
      // 上一次没落地的先清掉，避免竞态
      if (pending) { clearTimeout(pending.timer); pending.resolve('') }
      // 兜底超时：录音没起来、onStop 不触发、上传或转写卡住，都在 20 秒后放行
      const timer = setTimeout(() => {
        if (!pending) return
        const r = pending.resolve
        pending = null
        console.warn('语音流程超时')
        r('')
      }, 20000)
      pending = { resolve, timer }

      if (!started) {
        // 录音压根没开始（多半是权限被拒或模拟器不支持）
        setTimeout(() => settle(''), 50)
        return
      }
      recorder.stop()
    })
  }
}
