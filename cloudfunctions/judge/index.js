// 云函数 judge：AI 层，统一入口，action 分发
// 密钥优先取云函数环境变量 AI_API_KEY，否则回退本地 secret.js（已 gitignore）
const cloud = require('wx-server-sdk')
const https = require('https')
const { VERDICT_SYSTEM, QUICK_REPLY_SYSTEM, INTERVIEW_SYSTEM } = require('./prompts')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

let localSecret = {}
try { localSecret = require('./secret') } catch (e) { /* 生产环境用环境变量 */ }

const API_KEY = process.env.AI_API_KEY || localSecret.apiKey || ''
// 中转站的 deepseek-chat 是坏的，用 deepseek-v3
const API_URL = process.env.AI_BASE_URL || 'https://api.openai-next.com/v1/chat/completions'
const MODEL = process.env.AI_MODEL || 'deepseek-v3'

// 中转站的 JSON 模式会把结果包进 ```json 代码块，需要剥壳后再解析
function parseJSON(text) {
  let s = String(text).trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) s = fence[1].trim()
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start >= 0 && end > start) s = s.slice(start, end + 1)
  return JSON.parse(s)
}

function chat(system, user) {
  const url = new URL(API_URL)
  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    response_format: { type: 'json_object' },
    temperature: 1.1,
    max_tokens: 1600
  })
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 55000
    }, (res) => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.error) return reject(new Error(json.error.message || 'upstream_error'))
          resolve(parseJSON(json.choices[0].message.content))
        } catch (e) {
          reject(new Error('返回解析失败: ' + data.slice(0, 300)))
        }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('AI 接口超时')) })
    req.write(body)
    req.end()
  })
}

function statementText(label, s) {
  if (!s) return `${label}：（暂无陈述）`
  const parts = []
  if (s.what) parts.push(`发生了什么：${s.what}`)
  if (s.hurt) parts.push(`最难受的瞬间：${s.hurt}`)
  if (s.wish) parts.push(`最想让对方知道：${s.wish}`)
  if (s.extra) parts.push(`补充：${s.extra}`)
  if (s.text) parts.push(`陈述：${s.text}`)
  if (s.mood) parts.push(`这几天的感觉：${s.mood}`)
  return `${label}：\n${parts.join('\n') || '（暂无陈述）'}`
}

exports.main = async (event) => {
  const { action } = event
  if (!API_KEY) return { ok: false, error: '未配置 AI_API_KEY' }

  try {
    if (action === 'ping') {
      const r = await chat('只返回JSON', '返回 {"ok":true,"say":"本庭已就位"}')
      return { ok: true, result: r, model: MODEL }
    }
    if (action === 'verdict') {
      const user = [
        statementText('甲方（发起方）陈述', event.myStatement),
        statementText('乙方（应诉方）陈述', event.theirStatement)
      ].join('\n\n')
      return { ok: true, result: await chat(VERDICT_SYSTEM, user) }
    }
    if (action === 'quickReply') {
      return { ok: true, result: await chat(QUICK_REPLY_SYSTEM, statementText('当事人陈述', event.myStatement)) }
    }
    if (action === 'interview') {
      const user = [
        statementText('甲方陈述', event.myStatement),
        statementText('乙方陈述', event.theirStatement),
        `请为「${event.side === 'b' ? '乙方' : '甲方'}」生成追问。`
      ].join('\n\n')
      return { ok: true, result: await chat(INTERVIEW_SYSTEM, user) }
    }
    return { ok: false, error: `未知 action: ${action}` }
  } catch (e) {
    console.error(action, e)
    return { ok: false, error: e.message }
  }
}
