// 云函数 judge：AI 层（文本判决 / 截图直读 / 语音转写）
// 密钥优先取环境变量 AI_API_KEY，否则回退本地 secret.js（已 gitignore）
const cloud = require('wx-server-sdk')
const https = require('https')
const {
  VERDICT_SYSTEM, QUICK_REPLY_SYSTEM, SCREENSHOT_SYSTEM,
  INTERVIEW_PLAN_SYSTEM, INTERVIEW_ASK_SYSTEM
} = require('./prompts')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

let localSecret = {}
try { localSecret = require('./secret') } catch (e) { /* 生产用环境变量 */ }

const API_KEY = process.env.AI_API_KEY || localSecret.apiKey || ''
const HOST = process.env.AI_HOST || 'api.openai-next.com'
// 中转站的 deepseek-chat 是坏的，文本用 deepseek-v3
const MODEL = process.env.AI_MODEL || 'deepseek-v3'
const VISION_MODEL = process.env.AI_VISION_MODEL || 'gpt-4o-mini'
// 中转站的 whisper-1 / whisper-large-v3 都不可用，实测 gpt-4o-transcribe 正常
const ASR_MODEL = process.env.AI_ASR_MODEL || 'gpt-4o-transcribe'

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

// 背对背的信任是硬承诺，不能只靠模型自觉。
// 这道过滤器逐条检查追问：只要问题里出现了「对方陈述里有、而被问方自己没提过」的片段，
// 就判定为泄露并丢弃该问题。宁可少问一句，也不能让 TA 猜到对方说了什么。
const LEAK_STOP = new Set([
  '什么', '时候', '自己', '这件', '那件', '那天', '当时', '现在', '后来', '因为', '所以',
  '但是', '可能', '觉得', '知道', '没有', '一个', '这个', '那个', '事情', '想过', '如果',
  '为什么', '怎么', '他们', '我们', '你们', '还是', '就是', '不是', '有点', '一下', '起来',
  '回家', '出门', '说话', '开始', '结束', '发生', '希望', '需要', '应该', '真的'
])

// 只取用户自己写的内容做泄露比对，不含我们自己加的字段标签，否则会误伤
function rawStatement(s) {
  if (!s) return ''
  return [s.what, s.hurt, s.wish, s.extra, s.text, s.mood, s.screenshots]
    .filter(Boolean).join('\n')
}

function leakedFragment(question, ownText, otherText) {
  for (let len = 4; len >= 2; len--) {
    for (let i = 0; i + len <= otherText.length; i++) {
      const g = otherText.slice(i, i + len)
      if (!/^[一-龥]+$/.test(g)) continue
      if (LEAK_STOP.has(g)) continue
      if (ownText.includes(g)) continue      // 被问方自己也说过，不算泄露
      if (question.includes(g)) return g
    }
  }
  return ''
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
  if (s.followups && s.followups.length) {
    p.push('背对背追问：\n' + s.followups.map(f => `问：${f.q}\n答：${f.a}`).join('\n'))
  }
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
      const parts = [
        statementText('甲方（发起方）陈述', event.myStatement),
        statementText('乙方（应诉方）陈述', event.theirStatement)
      ]
      // 本庭记忆：只有主题、次数、试过的约定与复盘结果，没有任何描述人的内容
      const pats = event.patterns || []
      if (pats.length) {
        parts.push('本庭记录（这对情侣过去的开庭模式，仅供参考，不可作为指认任何一方的证据）：\n' +
          pats.map(p => `· 主题「${p.topic}」已开庭 ${p.count} 次` +
            (p.lastPact ? `；上次约定「${p.lastPact}」，复盘结果：${p.lastResult || '待复盘'}` : '')
          ).join('\n'))
      }
      const user = parts.join('\n\n')
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

    // 背对背问话：两步生成（先定方向、再写问题）+ 两道泄露过滤
    if (action === 'interview') {
      const askedIsB = event.side === 'b'
      const own = rawStatement(askedIsB ? event.theirStatement : event.myStatement)
      const other = rawStatement(askedIsB ? event.myStatement : event.theirStatement)

      // 第一步：看双方证词，只产出抽象的澄清方向，不许带细节
      const plan = await chat([
        { role: 'system', content: INTERVIEW_PLAN_SYSTEM },
        { role: 'user', content: [
          statementText('甲方陈述', event.myStatement),
          statementText('乙方陈述', event.theirStatement),
          `请列出需要向「${askedIsB ? '乙方' : '甲方'}」澄清的方向。`
        ].join('\n\n') }
      ])
      if (plan && plan.safety) return { ok: true, result: plan }

      // 方向词本身也可能夹带对方的细节，先过一遍同一道过滤再往下传
      const angles = ((plan && plan.angles) || []).filter(a => {
        const leak = leakedFragment(String(a), own, other)
        if (leak) console.warn('拦截泄露方向:', a, '| 命中:', leak)
        return !leak
      }).slice(0, 3)
      const res = await chat([
        { role: 'system', content: INTERVIEW_ASK_SYSTEM },
        { role: 'user', content: `【TA 自己的陈述】\n${own || '（几乎没说什么）'}\n\n【想澄清的方向】\n` +
          (angles.length ? angles.map((a, i) => `${i + 1}. ${a}`).join('\n') : '（自由发挥，问得开放一点）') }
      ])

      if (res && Array.isArray(res.questions)) {
        // 兜底第一道：子串比对，挡住直接搬运对方原话
        let kept = res.questions.filter(q => {
          const leak = leakedFragment(String(q), own, other)
          if (leak) console.warn('拦截泄露追问(子串):', q, '| 命中:', leak)
          return !leak
        })

        // 兜底第二道：模型复核，挡住改写措辞绕过子串匹配的
        if (kept.length) {
          try {
            const check = await chat([
              { role: 'system', content: '你是隐私审核员。给你一份某人的自述，和几个准备问 TA 的问题。' +
                '判断每个问题里是否出现了这份自述中没有提到过的具体信息（具体的事件、动作、说过的话、涉及的人）。' +
                '只要有，就必须标记删除——因为那意味着信息来自别处，问出来会暴露别人说了什么。' +
                '泛泛的开放式提问（问心情、感受、想法、当时在想什么）永远是安全的。' +
                '只返回 JSON：{"drop":[序号]}，序号从 1 开始，没有要删的就返回 {"drop":[]}。' },
              { role: 'user', content: `【这个人的自述】\n${own}\n\n【准备问 TA 的问题】\n` +
                kept.map((q, i) => `${i + 1}. ${q}`).join('\n') }
            ])
            const drop = new Set((check && check.drop) || [])
            kept = kept.filter((q, i) => {
              if (drop.has(i + 1)) console.warn('拦截泄露追问(复核):', q)
              return !drop.has(i + 1)
            })
          } catch (e) {
            console.warn('复核失败，保留子串过滤结果', e.message)
          }
        }
        res.questions = kept.slice(0, 3)
      }
      return { ok: true, result: res }
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
