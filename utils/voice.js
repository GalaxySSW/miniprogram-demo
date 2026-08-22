// 语音输入：按住录音 → 上传云存储 → 语音模型转写
// 用法：voice.start() / voice.stop().then(({ text, error }) => ...)
//
// 设计要点：
// 1. 任何失败路径都必须让 stop() 的 Promise 落地，否则页面永远卡在「正在听写」
// 2. 不用「录音是否已开始」做判断——onStart 是异步的，短按时它可能还没触发，
//    早期版本据此提前返回，导致录音被静默丢弃。一律交给 onStop / onError / 超时收口
// 3. 区分失败原因，页面才能给出有用的提示，而不是一律「没听清」
const ai = require('./ai.js')

const recorder = wx.getRecorderManager()
let pending = null

function settle(text, error) {
  if (!pending) return
  clearTimeout(pending.timer)
  const resolve = pending.resolve
  pending = null
  resolve({ text: text || '', error: error || '' })
}

recorder.onStop((res) => {
  console.log('[voice] onStop', res && res.duration, res && res.fileSize)
  if (!pending) return
  if (!res || !res.tempFilePath) return settle('', 'no_file')
  if (res.duration < 500) return settle('', 'too_short')

  ai.upload(res.tempFilePath, 'voice')
    .then(fileID => {
      if (!fileID) return settle('', 'upload_failed')
      return ai.transcribe(fileID).then(r => {
        if (!r) return settle('', 'asr_failed')
        settle(r.text || '', r.text ? '' : 'empty')
      })
    })
    .catch(err => {
      console.warn('[voice] 转写失败', err)
      settle('', 'asr_failed')
    })
})

recorder.onError((err) => {
  console.warn('[voice] 录音失败', err)
  const msg = (err && err.errMsg) || ''
  settle('', /auth|deny|privacy/i.test(msg) ? 'no_permission' : 'record_failed')
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

  // 返回 Promise<{ text, error }>
  stop() {
    return new Promise((resolve) => {
      if (pending) { clearTimeout(pending.timer); pending.resolve({ text: '', error: 'aborted' }) }
      const timer = setTimeout(() => {
        if (!pending) return
        const r = pending.resolve
        pending = null
        console.warn('[voice] 整体超时')
        r({ text: '', error: 'timeout' })
      }, 25000)
      pending = { resolve, timer }
      recorder.stop()
    })
  },

  // 权限被拒时直接把用户送进设置页，光提示没用
  handle(error) {
    if (error !== 'no_permission') return false
    wx.showModal({
      title: '需要麦克风权限',
      content: '开启后就能按住说话，不用打字了。',
      confirmText: '去开启',
      success: (r) => { if (r.confirm) wx.openSetting({}) }
    })
    return true
  },

  // 把失败原因翻译成给用户看的话
  tip(error) {
    switch (error) {
      case 'too_short': return '太短了，多说两句？'
      case 'no_permission': return '需要麦克风权限，去右上角设置里打开'
      case 'record_failed': return '录音没启动（模拟器常见，用真机试试）'
      case 'upload_failed': return '网络不太好，没传上去'
      case 'asr_failed': return '判官没听清，再说一次？'
      case 'empty': return '这段是空的，再说一次？'
      case 'timeout': return '等太久了，再试一次'
      default: return '没听清，再说一次？'
    }
  }
}
