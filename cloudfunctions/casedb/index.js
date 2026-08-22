// 云函数 casedb：案件数据层
// 集合：cases（案件状态机）/ pebbles（石子往来）
// 隐私原则：陈述原文只回给本人；对方永远拿不到 otherSide 的原文，只拿得到判决书
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 首次调用时自动建集合，避免手动去控制台建
async function ensureCollections() {
  for (const name of ['cases', 'pebbles']) {
    try {
      await db.createCollection(name)
    } catch (e) {
      // -501001 / 已存在，忽略
    }
  }
}

// 案号：2026 情字第 0822 号 + 4 位序号后缀，避免同日重复
function makeCaseId(now) {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return { display: `${y} 情字第 ${m}${d} 号`, serial: `${y}${m}${d}-${rand}` }
}

// 只返回调用者有权看到的字段
function projectCase(doc, openid) {
  const isA = doc.aOpenid === openid
  return {
    _id: doc._id,
    caseId: doc.caseId,
    status: doc.status,
    side: isA ? 'a' : (doc.bOpenid === openid ? 'b' : 'guest'),
    hasB: !!doc.bOpenid,
    myStatement: isA ? doc.aStatement : (doc.bOpenid === openid ? doc.bStatement : null),
    verdict: doc.verdict || null,
    pact: doc.pact || null,
    createdAt: doc.createdAt
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action } = event
  await ensureCollections()

  try {
    // A 立案
    if (action === 'create') {
      const now = new Date()
      const id = makeCaseId(now)
      const res = await db.collection('cases').add({
        data: {
          caseId: id.display,
          serial: id.serial,
          aOpenid: OPENID,
          bOpenid: '',
          aStatement: event.statement || {},
          bStatement: null,
          status: 'created',
          verdict: null,
          pact: null,
          createdAt: now
        }
      })
      return { ok: true, result: { _id: res._id, caseId: id.display } }
    }

    // 读案件（B 从传票进入时也走这里）
    if (action === 'get') {
      const doc = await db.collection('cases').doc(event._id).get()
      return { ok: true, result: projectCase(doc.data, OPENID) }
    }

    // B 应诉：写入乙方陈述并绑定 openid
    if (action === 'respond') {
      const doc = await db.collection('cases').doc(event._id).get()
      if (doc.data.aOpenid === OPENID) {
        return { ok: false, error: '不能给自己的案子应诉' }
      }
      await db.collection('cases').doc(event._id).update({
        data: {
          bOpenid: OPENID,
          bStatement: event.statement || {},
          status: 'responded'
        }
      })
      return { ok: true, result: { status: 'responded' } }
    }

    // 判决落库：双方共见同一份
    if (action === 'saveVerdict') {
      await db.collection('cases').doc(event._id).update({
        data: { verdict: event.verdict, status: 'tried' }
      })
      return { ok: true, result: { status: 'tried' } }
    }

    // 本庭约定 + 三天后回访时间
    if (action === 'savePact') {
      const reviewAt = new Date(Date.now() + 3 * 24 * 3600 * 1000)
      await db.collection('cases').doc(event._id).update({
        data: {
          pact: { ...event.pact, confirmedBy: [OPENID], reviewAt },
          status: 'closed'
        }
      })
      return { ok: true, result: { reviewAt } }
    }

    // 递石子（每人每天上限 3）
    if (action === 'pebble') {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const cnt = await db.collection('pebbles')
        .where({ caseDocId: event._id, fromOpenid: OPENID, createdAt: _.gte(today) })
        .count()
      if (cnt.total >= 3) {
        return { ok: false, error: 'daily_limit' }
      }
      await db.collection('pebbles').add({
        data: { caseDocId: event._id, fromOpenid: OPENID, type: event.type, createdAt: new Date() }
      })
      return { ok: true, result: { todayCount: cnt.total + 1 } }
    }

    // 我的卷宗
    if (action === 'myCases') {
      const res = await db.collection('cases')
        .where(_.or([{ aOpenid: OPENID }, { bOpenid: OPENID }]))
        .orderBy('createdAt', 'desc').limit(20).get()
      return { ok: true, result: res.data.map(d => projectCase(d, OPENID)) }
    }

    // 销毁证据：清空双方陈述原文，只留判决金句
    if (action === 'destroy') {
      await db.collection('cases').doc(event._id).update({
        data: { aStatement: {}, bStatement: {}, destroyed: true }
      })
      return { ok: true, result: { destroyed: true } }
    }

    return { ok: false, error: `未知 action: ${action}` }
  } catch (e) {
    console.error(action, e)
    return { ok: false, error: e.message }
  }
}
