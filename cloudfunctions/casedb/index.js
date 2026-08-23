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
    pactMine: !!(doc.pact && (doc.pact.confirmedBy || []).indexOf(openid) >= 0),
    pactBoth: doc.status === 'closed',
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

    // 当事人回去补充后重新提交：更新原案，不新开一桩
    if (action === 'updateStatement') {
      const doc = await db.collection('cases').doc(event._id).get()
      if (doc.data.aOpenid !== OPENID) return { ok: false, error: '不是你的案子' }
      await db.collection('cases').doc(event._id).update({
        data: { aStatement: _.set(event.statement || {}) }
      })
      return { ok: true, result: { updated: true } }
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
          bStatement: _.set(event.statement || {}),
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
        data: { verdict: _.set(event.verdict || {}), status: 'tried' }
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
      const wantReview = !!event.wantReview
      const reviewAt = new Date(Date.now() + 3 * 24 * 3600 * 1000)
      const doc = await db.collection('cases').doc(event._id).get()
      // 只是「我选了这一件」，还不算结案——要等 TA 也点头
      await db.collection('cases').doc(event._id).update({
        data: { pact: _.set({ ...event.pact, confirmedBy: [OPENID], wantReview, reviewAt }) }
      })
      // 把这次试的方法记进模式，供下次开庭参考
      if (doc.data.coupleKey && doc.data.topic) {
        await db.collection('patterns')
          .where({ coupleKey: doc.data.coupleKey, topic: doc.data.topic })
          .update({ data: { lastPact: event.pact.title || '', lastResult: '待复盘' } })
      }
      return { ok: true, result: { reviewAt, waiting: true } }
    }

    // 另一方点头：双方都确认了，本案才算了结
    if (action === 'confirmPact') {
      const doc = await db.collection('cases').doc(event._id).get()
      const d = doc.data
      const p = d.pact || {}
      const list = (p.confirmedBy || []).slice()
      if (list.indexOf(OPENID) < 0) list.push(OPENID)
      // 单机演示时对方是派生身份，一个人点头即视为齐了
      const demoPair = (d.bOpenid || '').indexOf('__demo') >= 0
      const both = demoPair
        ? true
        : !!(d.aOpenid && d.bOpenid && list.indexOf(d.aOpenid) >= 0 && list.indexOf(d.bOpenid) >= 0)

      const patch = { pact: _.set({ ...p, confirmedBy: list }) }
      if (both) patch.status = 'closed'
      await db.collection('cases').doc(event._id).update({ data: patch })

      if (both && d.coupleKey && d.topic) {
        await db.collection('patterns')
          .where({ coupleKey: d.coupleKey, topic: d.topic })
          .update({ data: { lastPact: p.title || '', lastResult: '待复盘' } })
      }
      return { ok: true, result: { both, count: list.length } }
    }

    // 三天后复盘：约定到底有没有用——这才是最有价值的判据
    if (action === 'saveReview') {
      const result = ['做到了', '没做到', '情况变了'].includes(event.result) ? event.result : '没做到'
      const doc = await db.collection('cases').doc(event._id).get()
      await db.collection('cases').doc(event._id).update({
        data: { review: _.set({ result, at: new Date() }) }
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
      const key = await myCoupleKey(OPENID)
      const scope = key ? { coupleKey: key } : { caseDocId: event._id }
      const cnt = await db.collection('pebbles')
        .where({ ...scope, fromOpenid: OPENID, createdAt: _.gte(today) }).count()
      if (cnt.total >= 3) return { ok: false, error: 'daily_limit' }

      const doc = event._id
        ? await db.collection('cases').doc(event._id).get()
        : { data: { coupleKey: key } }
      await db.collection('pebbles').add({
        data: {
          caseDocId: event._id || '',
          coupleKey: doc.data.coupleKey || key || '',
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
      // 优先按情侣查：冷战期可能根本没有活跃案件
      const key = await myCoupleKey(OPENID)
      const scope = key ? { coupleKey: key } : { caseDocId: event._id || '' }
      const res = await db.collection('pebbles')
        .where(scope)
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
      void scope
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

    // 案件时间线：等待页每隔几秒问一次「进展到哪儿了」
    // 走云函数而不是前端 watch，是为了不放开 cases 集合的读权限——那里面有双方的陈述原文
    if (action === 'timeline') {
      const doc = await db.collection('cases').doc(event._id).get()
      const d = doc.data
      const isA = d.aOpenid === OPENID
      const pkey = d.coupleKey
      const peb = await db.collection('pebbles')
        .where(pkey ? { coupleKey: pkey, fromOpenid: _.neq(OPENID), received: false }
                    : { caseDocId: event._id, fromOpenid: _.neq(OPENID), received: false }).count()
      return { ok: true, result: {
        status: d.status,
        hasB: !!d.bOpenid,
        verdictReady: !!d.verdict,
        pactTitle: d.pact ? d.pact.title : '',
        reviewed: !!d.review,
        side: isA ? 'a' : (d.bOpenid === OPENID ? 'b' : 'guest'),
        pebbleWaiting: peb.total
      } }
    }

    // 收件箱：我名下所有案子里，有哪些「有新进展」的事
    if (action === 'inbox') {
      const res = await db.collection('cases')
        .where(_.or([{ aOpenid: OPENID }, { bOpenid: OPENID }]))
        .orderBy('createdAt', 'desc').limit(10).get()

      // 每桩案子只提醒一件最要紧的事，按优先级取一条；否则多案多状态会在首页堆成一摞
      const items = []
      for (const d of res.data) {
        const isA = d.aOpenid === OPENID
        let item = null
        if (d.pact && (d.pact.confirmedBy || []).indexOf(OPENID) < 0) {
          item = { kind: 'pact', text: `TA 定了「${d.pact.title}」，等你点头` }
        } else if (d.pact && d.pact.wantReview && !d.review &&
                   d.pact.reviewAt && new Date(d.pact.reviewAt) <= new Date()) {
          item = { kind: 'review', text: '你们让本庭过几天问问，时候到了' }
        } else if (isA && d.bStatement && !d.verdict) {
          item = { kind: 'responded', text: 'TA 已经应诉了，可以开庭' }
        } else if (d.verdict && !d.pact) {
          item = { kind: 'verdict', text: '判决书出来了，看完落个约定' }
        }
        if (item) items.push({ docId: d._id, caseId: d.caseId, ...item })
        if (items.length >= 3) break
      }

      // 石子按情侣汇总成一条，不逐案重复
      if (items.length < 3) {
        const key = await myCoupleKey(OPENID)
        if (key) {
          const peb = await db.collection('pebbles')
            .where({ coupleKey: key, fromOpenid: _.neq(OPENID), received: false }).count()
          if (peb.total) {
            const anyCase = res.data.find(d => d.coupleKey === key)
            items.push({
              docId: anyCase ? anyCase._id : '',
              caseId: anyCase ? anyCase.caseId : '',
              kind: 'pebble',
              text: `TA 递来了 ${peb.total} 颗石子`
            })
          }
        }
      }
      return { ok: true, result: items }
    }

    if (action === 'myCases') {
      const res = await db.collection('cases')
        .where(_.or([{ aOpenid: OPENID }, { bOpenid: OPENID }]))
        .orderBy('createdAt', 'desc').limit(20).get()
      return { ok: true, result: res.data.map(d => projectCase(d, OPENID)) }
    }

    if (action === 'destroy') {
      await db.collection('cases').doc(event._id).update({
        data: { aStatement: _.set({}), bStatement: _.set({}), destroyed: true }
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
