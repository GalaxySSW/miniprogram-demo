// 云函数 casedb：案件数据层 + 关系模式记忆
// 集合：cases（案件状态机）/ pebbles（石子往来）/ patterns（关系模式）
//
// 关于 patterns 的设计底线：记「你们之间反复出现的循环」，不记「某个人是什么样的人」。
// 每条记录的主语永远是这对情侣，字段里不存任何形容人的词、不存陈述原文，
// 只存主题、次数、试过的约定和复盘结果——都是可验证、可修改、指向未来的东西。
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 建表只在容器生命周期内做一次，避免每次调用都白跑三次往返（casedb 超时只有几秒）
let collectionsReady = false
async function ensureCollections() {
  if (collectionsReady) return
  for (const name of ['cases', 'pebbles', 'patterns']) {
    try { await db.createCollection(name) } catch (e) { /* 已存在 */ }
  }
  collectionsReady = true
}

// 六位口令：不含易混字符（0/O/1/I），A 用普通微信消息发给 B 即可
function makeCode() {
  const CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c = ''
  for (let i = 0; i < 6; i++) c += CH[Math.floor(Math.random() * CH.length)]
  return c
}

function makeCaseId(now) {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return { display: `${y} 情字第 ${m}${d} 号`, serial: `${y}${m}${d}-${rand}` }
}

// 情侣键：双方 openid 排序后拼接，与谁先立案无关
function coupleKeyOf(doc) {
  if (!doc.aOpenid || !doc.bOpenid) return ''
  return [doc.aOpenid, doc.bOpenid].sort().join('__')
}

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
    topic: doc.topic || '',
    code: doc.code || '',
    note: doc.note || '',
    brief: doc.brief || '',
    review: doc.review || null,
    createdAt: doc.createdAt
  }
}

// 找出我所在的情侣键（取最近一次双方齐全的案件）
async function myCoupleKey(openid) {
  const res = await db.collection('cases')
    .where(_.and([
      _.or([{ aOpenid: openid }, { bOpenid: openid }]),
      { coupleKey: _.neq('') }
    ]))
    .orderBy('createdAt', 'desc').limit(1).get()
  return res.data.length ? res.data[0].coupleKey : ''
}

async function patternsOf(coupleKey) {
  if (!coupleKey) return []
  const res = await db.collection('patterns')
    .where({ coupleKey }).orderBy('count', 'desc').limit(5).get()
  return res.data.map(p => ({
    topic: p.topic, count: p.count,
    lastPact: p.lastPact || '', lastResult: p.lastResult || ''
  }))
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action } = event
  await ensureCollections()

  try {
    if (action === 'create') {
      const now = new Date()
      const id = makeCaseId(now)
      const res = await db.collection('cases').add({
        data: {
          caseId: id.display, serial: id.serial,
          code: makeCode(),
          aOpenid: OPENID, bOpenid: '', coupleKey: '',
          aStatement: event.statement || {}, bStatement: null, note: '', brief: '',
          status: 'created', verdict: null, pact: null,
          topic: '', review: null, createdAt: now
        }
      })
      const created = await db.collection('cases').doc(res._id).get()
      return { ok: true, result: { _id: res._id, caseId: id.display, code: created.data.code } }
    }

    if (action === 'get') {
      const doc = await db.collection('cases').doc(event._id).get()
      return { ok: true, result: projectCase(doc.data, OPENID) }
    }

    // B 用口令进入同一案件
    if (action === 'getByCode') {
      const code = String(event.code || '').trim().toUpperCase()
      if (code.length !== 6) return { ok: false, error: '口令是 6 位' }
      const r = await db.collection('cases').where({ code }).limit(1).get()
      if (!r.data.length) return { ok: false, error: '没找到这个案子，口令对吗？' }
      return { ok: true, result: projectCase(r.data[0], OPENID) }
    }

    if (action === 'respond') {
      const doc = await db.collection('cases').doc(event._id).get()
      // 正常情况下不能给自己的案子应诉；单机演示时用一个派生 openid 扮演对方，
      // 好让双人闭环（含关系模式累计）在一台设备上也能完整跑通
      let responder = OPENID
      if (doc.data.aOpenid === OPENID) {
        if (!event.demo) return { ok: false, error: '不能给自己的案子应诉' }
        responder = OPENID + '__demo'
      }
      const merged = { ...doc.data, bOpenid: responder }
      await db.collection('cases').doc(event._id).update({
        data: {
          bOpenid: responder,
          coupleKey: coupleKeyOf(merged),
          bStatement: event.statement || {},
          status: 'responded'
        }
      })
      return { ok: true, result: { status: 'responded' } }
    }

    // 开庭前取上下文：这对情侣以前为什么反复开庭、试过什么、有没有用
    if (action === 'patterns') {
      const doc = await db.collection('cases').doc(event._id).get()
      return { ok: true, result: await patternsOf(doc.data.coupleKey) }
    }

    // 「我的」页用：不依赖具体案件
    if (action === 'myPatterns') {
      return { ok: true, result: await patternsOf(await myCoupleKey(OPENID)) }
    }

    // A 写给 TA 的附言：卡片是信封，这句话才是信
    if (action === 'saveNote') {
      const patch = { note: String(event.note || '').slice(0, 60) }
      if (event.brief !== undefined) patch.brief = String(event.brief || '').slice(0, 60)
      await db.collection('cases').doc(event._id).update({ data: patch })
      return { ok: true, result: { saved: true } }
    }

    if (action === 'saveVerdict') {
      await db.collection('cases').doc(event._id).update({
        data: { verdict: event.verdict, status: 'tried' }
      })
      return { ok: true, result: { status: 'tried' } }
    }

    // 判决产出的主题词记进模式表：只累计次数，不写任何形容人的内容
    if (action === 'recordPattern') {
      const topic = String(event.topic || '').slice(0, 12)
      if (!topic) return { ok: true, result: { skipped: true } }
      const doc = await db.collection('cases').doc(event._id).get()
      const coupleKey = doc.data.coupleKey
      if (!coupleKey) return { ok: true, result: { skipped: true } }

      await db.collection('cases').doc(event._id).update({ data: { topic } })
      const hit = await db.collection('patterns').where({ coupleKey, topic }).limit(1).get()
      if (hit.data.length) {
        await db.collection('patterns').doc(hit.data[0]._id).update({
          data: { count: _.inc(1), lastAt: new Date(), lastCaseId: event._id }
        })
        return { ok: true, result: { topic, count: hit.data[0].count + 1 } }
      }
      await db.collection('patterns').add({
        data: {
          coupleKey, topic, count: 1, lastAt: new Date(),
          lastCaseId: event._id, lastPact: '', lastResult: ''
        }
      })
      return { ok: true, result: { topic, count: 1 } }
    }

    if (action === 'savePact') {
      const reviewAt = new Date(Date.now() + 3 * 24 * 3600 * 1000)
      const doc = await db.collection('cases').doc(event._id).get()
      await db.collection('cases').doc(event._id).update({
        data: { pact: { ...event.pact, confirmedBy: [OPENID], reviewAt }, status: 'closed' }
      })
      // 把这次试的方法记进模式，供下次开庭参考
      if (doc.data.coupleKey && doc.data.topic) {
        await db.collection('patterns')
          .where({ coupleKey: doc.data.coupleKey, topic: doc.data.topic })
          .update({ data: { lastPact: event.pact.title || '', lastResult: '待复盘' } })
      }
      return { ok: true, result: { reviewAt } }
    }

    // 三天后复盘：约定到底有没有用——这才是最有价值的判据
    if (action === 'saveReview') {
      const result = ['做到了', '没做到', '情况变了'].includes(event.result) ? event.result : '没做到'
      const doc = await db.collection('cases').doc(event._id).get()
      await db.collection('cases').doc(event._id).update({
        data: { review: { result, at: new Date() } }
      })
      if (doc.data.coupleKey && doc.data.topic) {
        await db.collection('patterns')
          .where({ coupleKey: doc.data.coupleKey, topic: doc.data.topic })
          .update({ data: { lastResult: result } })
      }
      return { ok: true, result: { result } }
    }

    // 递石子：不解释、不分析，只传递一件事——我还在。
    // 石子必须真的送达对方，否则这个功能没有意义
    if (action === 'pebble') {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const cnt = await db.collection('pebbles')
        .where({ caseDocId: event._id, fromOpenid: OPENID, createdAt: _.gte(today) }).count()
      if (cnt.total >= 3) return { ok: false, error: 'daily_limit' }

      const doc = await db.collection('cases').doc(event._id).get()
      await db.collection('pebbles').add({
        data: {
          caseDocId: event._id,
          coupleKey: doc.data.coupleKey || '',
          fromOpenid: OPENID,
          type: event.type || 'emoji',
          payload: String(event.payload || '').slice(0, 60),
          received: false,
          createdAt: new Date()
        }
      })
      return { ok: true, result: { todayCount: cnt.total + 1 } }
    }

    // 石子往来：我递出的 + TA 递来的，按时间排好
    if (action === 'pebbleFeed') {
      const res = await db.collection('pebbles')
        .where({ caseDocId: event._id })
        .orderBy('createdAt', 'asc').limit(30).get()
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const list = res.data.map(p => ({
        _id: p._id,
        mine: p.fromOpenid === OPENID,
        type: p.type,
        payload: p.payload || '',
        received: !!p.received
      }))
      const sentToday = res.data.filter(p =>
        p.fromOpenid === OPENID && new Date(p.createdAt) >= today).length
      // 往来轮次：双方各递过多少个来回
      const mineCount = list.filter(p => p.mine).length
      const theirsCount = list.length - mineCount
      return { ok: true, result: {
        list,
        sentToday,
        rounds: Math.min(mineCount, theirsCount),
        unreceived: list.filter(p => !p.mine && !p.received).length
      } }
    }

    // 收下 TA 的石子
    if (action === 'receivePebble') {
      await db.collection('pebbles').doc(event.pebbleId).update({ data: { received: true } })
      return { ok: true, result: { received: true } }
    }

    if (action === 'myCases') {
      const res = await db.collection('cases')
        .where(_.or([{ aOpenid: OPENID }, { bOpenid: OPENID }]))
        .orderBy('createdAt', 'desc').limit(20).get()
      return { ok: true, result: res.data.map(d => projectCase(d, OPENID)) }
    }

    if (action === 'destroy') {
      await db.collection('cases').doc(event._id).update({
        data: { aStatement: {}, bStatement: {}, destroyed: true }
      })
      return { ok: true, result: { destroyed: true } }
    }

    // 一键让判官忘掉你们的模式：延续 7 天销毁的隐私承诺
    if (action === 'forgetPatterns') {
      const key = await myCoupleKey(OPENID)
      if (!key) return { ok: true, result: { removed: 0 } }
      const r = await db.collection('patterns').where({ coupleKey: key }).remove()
      return { ok: true, result: { removed: r.stats.removed } }
    }

    return { ok: false, error: `未知 action: ${action}` }
  } catch (e) {
    console.error(action, e)
    return { ok: false, error: e.message }
  }
}
