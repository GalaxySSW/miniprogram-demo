// 前端 AI 调用层：云开发就绪时走云函数，否则返回 null（页面回退到本地 mock）。
// 请求携带 requestId/idempotencyKey；页面暂时继续接收原始 result，billing 信息写入全局调试状态。
const credits = require('./credits.js')

function requestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function idempotencyKey(action, data, nonce) {
  const seed = JSON.stringify({ action, data })
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  return `${action}_${Math.abs(hash)}_${nonce}`
}

const inFlightKeys = {}

function appendBillingHistory(action, envelope, requestId) {
  const app = getApp()
  const history = app.globalData.aiBillingHistory || []
  history.push({
    action,
    requestId: (envelope && envelope.requestId) || requestId,
    billing: (envelope && envelope.billing) || null,
    at: Date.now()
  })
  // 这是客户端展示用的短历史，不作为服务端账本；避免长时间运行后无限增长。
  app.globalData.aiBillingHistory = history.slice(-100)
}

function call(action, data) {
  const app = getApp()
  if (!wx.cloud || !app.globalData.cloudReady) {
    const mockRequestId = requestId()
    const mockQuote = credits.quote(action)
    app.globalData.aiLastResponse = {
      requestId: mockRequestId,
      source: 'mock',
      billing: {
        status: 'not_charged',
        requestId: mockRequestId,
        cost: mockQuote.cost,
        charged: 0,
        errorCode: 'LOCAL_MOCK'
      }
    }
    appendBillingHistory(action, app.globalData.aiLastResponse, mockRequestId)
    console.warn(`[ai] 云开发未就绪，${action} 回退 mock`)
    app.globalData.aiUsed = false
    return Promise.resolve(null)
  }
  return credits.ensureBeforeCall(action).then(preflight => {
    if (!preflight.allowed) return null
    const t0 = Date.now()
    const reqId = requestId()
    const fingerprint = `${action}:${JSON.stringify(data || {})}`
    const idemKey = inFlightKeys[fingerprint] || idempotencyKey(action, data, Date.now())
    inFlightKeys[fingerprint] = idemKey
    const clearKey = () => { delete inFlightKeys[fingerprint] }
    return wx.cloud.callFunction({
      name: 'judge',
      data: { action, ...data, requestId: reqId, idempotencyKey: idemKey }
    })
      .then(res => {
        clearKey()
        const ms = Date.now() - t0
        const envelope = res.result || {}
        app.globalData.aiLastResponse = {
          requestId: envelope.requestId || reqId,
          source: envelope.source || 'unknown',
          billing: envelope.billing || null
        }
        appendBillingHistory(action, envelope, reqId)
        if (res.result && res.result.ok) {
          console.log(`[ai] ${action} 成功，耗时 ${(ms / 1000).toFixed(1)}s`)
          app.globalData.aiUsed = true
          credits.refresh()
          return envelope.result
        }
        console.warn(`[ai] ${action} 返回异常（${(ms / 1000).toFixed(1)}s）:`, envelope.error, envelope.billing)
        app.globalData.aiUsed = false
        return null
      })
      .catch(err => {
        clearKey()
        const ms = Date.now() - t0
        console.warn(`[ai] ${action} 调用失败（${(ms / 1000).toFixed(1)}s），回退 mock:`, err && err.errMsg || err)
        app.globalData.aiLastResponse = {
          requestId: reqId,
          source: 'fallback',
          billing: { status: 'unknown', requestId: reqId, errorCode: 'CLOUD_CALL_FAILED' }
        }
        appendBillingHistory(action, {
          requestId: reqId,
          billing: { status: 'unknown', requestId: reqId, errorCode: 'CLOUD_CALL_FAILED' }
        }, reqId)
        app.globalData.aiUsed = false
        return null
      })
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
  // 深度分析单独一次调用，与首屏判决并行，避免 20 秒的单次生成
  verdictDepth: (myStatement, theirStatement) => call('verdictDepth', { myStatement, theirStatement }),
  quickReplies: (myStatement) => call('quickReply', { myStatement }),
  caseBrief: (myStatement) => call('brief', { myStatement }),
  // 受理确认：本庭听到了什么，交给当事人自己校对
  intake: (myStatement) => call('intake', { myStatement }),
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
