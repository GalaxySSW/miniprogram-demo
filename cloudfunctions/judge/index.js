// 云函数 judge：统一入口，action 分发
// 部署前提：云函数环境变量里配置 DEEPSEEK_API_KEY
const cloud = require('wx-server-sdk')
const https = require('https')
const { VERDICT_SYSTEM, QUICK_REPLY_SYSTEM, INTERVIEW_SYSTEM } = require('./prompts')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 调 DeepSeek（OpenAI 兼容接口），返回解析后的 JSON
function callDeepSeek(system, user) {
  const body = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    response_format: { type: 'json_object' },
    temperature: 1.1,
    max_tokens: 1500
  })
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.deepseek.com',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 50000
    }, (res) => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.error) return reject(new Error(json.error.message))
          resolve(JSON.parse(json.choices[0].message.content))
        } catch (e) {
          reject(new Error('DeepSeek 返回解析失败: ' + data.slice(0, 200)))
        }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('DeepSeek 超时')) })
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
  try {
    if (action === 'verdict') {
      const user = [
        statementText('甲方（发起方）陈述', event.myStatement),
        statementText('乙方（应诉方）陈述', event.theirStatement)
      ].join('\n\n')
      const result = await callDeepSeek(VERDICT_SYSTEM, user)
      return { ok: true, result }
    }
    if (action === 'quickReply') {
      const user = statementText('当事人陈述', event.myStatement)
      const result = await callDeepSeek(QUICK_REPLY_SYSTEM, user)
      return { ok: true, result }
    }
    if (action === 'interview') {
      const user = [
        statementText('甲方陈述', event.myStatement),
        statementText('乙方陈述', event.theirStatement),
        `请为「${event.side === 'b' ? '乙方' : '甲方'}」生成追问。`
      ].join('\n\n')
      const result = await callDeepSeek(INTERVIEW_SYSTEM, user)
      return { ok: true, result }
    }
    return { ok: false, error: `未知 action: ${action}` }
  } catch (e) {
    console.error(e)
    return { ok: false, error: e.message }
  }
}
