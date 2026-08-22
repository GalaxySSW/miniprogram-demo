// 云函数 judge：AI 层（文本判决 / 截图直读 / 语音转写）
// 密钥优先取环境变量 AI_API_KEY，否则回退本地 secret.js（已 gitignore）
const cloud = require('wx-server-sdk')
const https = require('https')
const { VERDICT_SYSTEM, QUICK_REPLY_SYSTEM, INTERVIEW_SYSTEM, SCREENSHOT_SYSTEM } = require('./prompts')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

let localSecret = {}
try { localSecret = require('./secret') } catch (e) { /* 生产用环境变量 */ }

const API_KEY = process.env.AI_API_KEY || localSecret.apiKey || ''
const HOST = process.env.AI_HOST || 'api.openai-next.com'
// 中转站的 deepseek-chat 是坏的，文本用 deepseek-v3
const MODEL = process.env.AI_MODEL || 'deepseek-v3'
const VISION_MODEL = process.env.AI_VISION_MODEL || 'gpt-4o-mini'
const ASR_MODEL = process.env.AI_ASR_MODEL || 'whisper-1'

// 中转站的 JSON 模式会把结果包进 ```json 代码块，需剥壳
function parseJSON(text) {
  let s = String(text).trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) s = fence[1].trim()
  const a = s.indexOf('{'); const b = s.lastIndexOf('}')
  if (a >= 0 && b > a) s = s.slice(a, b + 1)
  return JSON.parse(s)
}

function post(path, payload, headers, timeout) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: HOST, path, method: 'POST',
      headers: Object.assign({ 'Authorization': `Bearer ${API_KEY}` }, headers),
      timeout: timeout || 55000
    }, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('AI 接口超时')) })
    req.write(payload)
    req.end()
  })
}

async function chat(messages, model, wantJSON) {
  const body = JSON.stringify({
    model: model || MODEL,
    messages,
    ...(wantJSON === false ? {} : { response_format: { type: 'json_object' } }),
    temperature: 1.05,
    max_tokens: 1600
  })
  const raw = await post('/v1/chat/completions', body, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  })
  const json = JSON.parse(raw)
  if (json.error) throw new Error(json.error.message || 'upstream_error')
  const content = json.choices[0].message.content
  return wantJSON === false ? content : parseJSON(content)
}

// whisper 语音转写：手写 multipart，避免引入依赖
async function transcribe(buffer, ext) {
  const boundary = '----judge' + Date.now()
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${ASR_MODEL}\r\n` +
    `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nzh\r\n` +
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.${ext}"\r\n` +
    `Content-Type: audio/${ext}\r\n\r\n`
  )
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
  const body = Buffer.concat([head, buffer, tail])
  const raw = await post('/v1/audio/transcriptions', body, {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length
  }, 90000)
  const json = JSON.parse(raw)
  if (json.error) throw new Error(json.error.message || 'asr_error')
  return json.text || ''
}

function statementText(label, s) {
  if (!s) return `${label}：（暂无陈述）`
  const p = []
  if (s.what) p.push(`发生了什么：${s.what}`)
  if (s.hurt) p.push(`最难受的瞬间：${s.hurt}`)
  if (s.wish) p.push(`最想让对方知道：${s.wish}`)
  if (s.extra) p.push(`补充：${s.extra}`)
  if (s.text) p.push(`陈述：${s.text}`)
  if (s.mood) p.push(`这几天的感觉：${s.mood}`)
  if (s.screenshots) p.push(`聊天记录（由截图识别）：\n${s.screenshots}`)
  return `${label}：\n${p.join('\n') || '（暂无陈述）'}`
}

exports.main = async (event) => {
  const { action } = event
  if (!API_KEY) return { ok: false, error: '未配置 AI_API_KEY' }

  try {
    if (action === 'ping') {
      return { ok: true, result: await chat([{ role: 'user', content: '返回 {"ok":true}' }]), model: MODEL }
    }

    if (action === 'verdict') {
      const user = [
        statementText('甲方（发起方）陈述', event.myStatement),
        statementText('乙方（应诉方）陈述', event.theirStatement)
      ].join('\n\n')
      return { ok: true, result: await chat([
        { role: 'system', content: VERDICT_SYSTEM }, { role: 'user', content: user }
      ]) }
    }

    if (action === 'quickReply') {
      return { ok: true, result: await chat([
        { role: 'system', content: QUICK_REPLY_SYSTEM },
        { role: 'user', content: statementText('当事人陈述', event.myStatement) }
      ]) }
    }

    if (action === 'interview') {
      const user = [
        statementText('甲方陈述', event.myStatement),
        statementText('乙方陈述', event.theirStatement),
        `请为「${event.side === 'b' ? '乙方' : '甲方'}」生成追问。`
      ].join('\n\n')
      return { ok: true, result: await chat([
        { role: 'system', content: INTERVIEW_SYSTEM }, { role: 'user', content: user }
      ]) }
    }

    // 截图直读：不做 OCR，多模态模型直接看图（气泡左右天然携带「谁说的」）
    if (action === 'readScreenshots') {
      const ids = (event.fileIDs || []).slice(0, 4) // 控成本：至多 4 张
      if (!ids.length) return { ok: false, error: '没有截图' }
      const parts = [{ type: 'text', text: '请按系统提示读取这些聊天截图。' }]
      for (const fileID of ids) {
        const f = await cloud.downloadFile({ fileID })
        parts.push({
          type: 'image_url',
          image_url: { url: 'data:image/jpeg;base64,' + f.fileContent.toString('base64') }
        })
      }
      const text = await chat([
        { role: 'system', content: SCREENSHOT_SYSTEM },
        { role: 'user', content: parts }
      ], VISION_MODEL, false)
      return { ok: true, result: { text: String(text).trim() } }
    }

    // 语音转写
    if (action === 'transcribe') {
      const f = await cloud.downloadFile({ fileID: event.fileID })
      const ext = (event.fileID.split('.').pop() || 'mp3').toLowerCase()
      const text = await transcribe(f.fileContent, ext === 'aac' ? 'm4a' : ext)
      return { ok: true, result: { text } }
    }

    return { ok: false, error: `未知 action: ${action}` }
  } catch (e) {
    console.error(action, e)
    return { ok: false, error: e.message }
  }
}
