// 积分后台管理入口。
// 管理员身份只取服务端 WXContext.OPENID；客户端传入的 role/admin/openid 一律不信任。
const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const tcb = require('@cloudbase/node-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const ACCOUNT_COLLECTION = 'ai_accounts'
const LEDGER_COLLECTION = 'ai_credit_ledger'
const AUDIT_COLLECTION = 'ai_admin_audit'
const PLAN_COLLECTION = 'ai_plans'

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function accountId(openid) {
  return hash(`account:${openid}`)
}

function dataOf(snapshot) {
  return snapshot && snapshot.data ? snapshot.data : null
}

async function runTransaction(db, callback) {
  const raw = await db.runTransaction(callback)
  return raw && Object.prototype.hasOwnProperty.call(raw, 'result') ? raw.result : raw
}

function fail(code, message) {
  const error = new Error(message || code)
  error.code = code
  throw error
}

function amountOf(value) {
  const amount = Number(value)
  if (!Number.isInteger(amount) || amount <= 0) fail('INVALID_AMOUNT', '积分数量必须是正整数')
  return amount
}

function operationOf(event) {
  if (!event.operationId || typeof event.operationId !== 'string') {
    fail('OPERATION_ID_REQUIRED', '后台变更必须提供 operationId')
  }
  return event.operationId
}

function adminOpenids() {
  return String(process.env.ADMIN_OPENIDS || '')
    .split(',').map(value => value.trim()).filter(Boolean)
}

function assertAdmin() {
  const wxContext = cloud.getWXContext()
  const operatorOpenid = wxContext && wxContext.OPENID
  if (!operatorOpenid) fail('ADMIN_OPENID_REQUIRED', '无法取得管理员 OPENID')
  const allowlist = adminOpenids()
  if (!allowlist.length) fail('ADMIN_NOT_CONFIGURED', 'ADMIN_OPENIDS 尚未配置')
  if (!allowlist.includes(operatorOpenid)) fail('ADMIN_FORBIDDEN', '无后台管理权限')
  return operatorOpenid
}

function createDb(context) {
  const options = { context }
  if (process.env.CLOUDBASE_ENV_ID) options.env = process.env.CLOUDBASE_ENV_ID
  if (process.env.CLOUDBASE_APIKEY) options.accessKey = process.env.CLOUDBASE_APIKEY
  return tcb.init(options).database()
}

function accountSummary(account) {
  if (!account) return null
  return {
    available: Number(account.available || 0),
    reserved: Number(account.reserved || 0),
    grantedTotal: Number(account.grantedTotal || 0),
    consumedTotal: Number(account.consumedTotal || 0),
    status: account.status || 'active',
    planId: account.planId || null,
    planVersion: account.planVersion || null,
    version: Number(account.version || 0)
  }
}

async function accountGet(db, targetOpenid) {
  if (!targetOpenid) fail('TARGET_OPENID_REQUIRED')
  return dataOf(await db.collection(ACCOUNT_COLLECTION).doc(accountId(targetOpenid)).get())
}

async function auditAndLedger(transaction, { operationId, operatorOpenid, targetOpenid, action, reason, before, after, delta = 0 }) {
  const now = new Date()
  const targetHash = hash(targetOpenid)
  const operationHash = hash(`${operatorOpenid}:${operationId}`)
  await transaction.collection(AUDIT_COLLECTION).doc(operationHash).set({ data: {
    _id: operationHash,
    operationId,
    action,
    operatorOpenidHash: hash(operatorOpenid),
    targetOpenidHash: targetHash,
    reason: reason || null,
    beforeSummary: before || null,
    afterSummary: after || null,
    createdAt: now
  } })
  if (delta !== 0) {
    const ledgerId = hash(`${targetOpenid}:${operationId}:admin`)
    await transaction.collection(LEDGER_COLLECTION).doc(ledgerId).set({ data: {
      _id: ledgerId,
      openidHash: targetHash,
      type: delta > 0 ? 'grant' : 'revoke',
      delta,
      balanceAfter: after.available,
      operationId,
      operatorOpenidHash: hash(operatorOpenid),
      reason: reason || null,
      createdAt: now
    } })
  }
}

async function changeCredits(db, { event, operatorOpenid, targetOpenid, delta }) {
  const operationId = operationOf(event)
  const reason = event.reason || ''
  if (!reason.trim()) fail('REASON_REQUIRED', '后台变更必须填写原因')
  return runTransaction(db, async transaction => {
    const auditId = hash(`${operatorOpenid}:${operationId}`)
    const existingAudit = dataOf(await transaction.collection(AUDIT_COLLECTION).doc(auditId).get())
    if (existingAudit) {
      const account = await accountGet(transaction, targetOpenid)
      return { replay: true, account: accountSummary(account) }
    }

    const ref = transaction.collection(ACCOUNT_COLLECTION).doc(accountId(targetOpenid))
    const existing = dataOf(await ref.get())
    const before = accountSummary(existing)
    const account = existing || {
      _id: accountId(targetOpenid),
      openidHash: hash(targetOpenid),
      available: 0,
      reserved: 0,
      grantedTotal: 0,
      consumedTotal: 0,
      status: 'active',
      version: 0,
      createdAt: new Date()
    }
    const available = Number(account.available || 0) + delta
    if (available < 0) fail('INSUFFICIENT_CREDITS', '扣回后可用积分不能为负数')
    const next = {
      ...account,
      available,
      grantedTotal: Number(account.grantedTotal || 0) + (delta > 0 ? delta : 0),
      version: Number(account.version || 0) + 1,
      updatedAt: new Date()
    }
    await ref.set({ data: next })
    await auditAndLedger(transaction, {
      operationId, operatorOpenid, targetOpenid,
      action: delta > 0 ? 'admin.credit.grant' : 'admin.credit.revoke',
      reason, before, after: accountSummary(next), delta
    })
    return { replay: false, account: accountSummary(next) }
  })
}

async function setAccountStatus(db, { event, operatorOpenid, targetOpenid, status }) {
  const operationId = operationOf(event)
  const reason = event.reason || ''
  if (!reason.trim()) fail('REASON_REQUIRED', '状态变更必须填写原因')
  return runTransaction(db, async transaction => {
    const auditId = hash(`${operatorOpenid}:${operationId}`)
    const existingAudit = dataOf(await transaction.collection(AUDIT_COLLECTION).doc(auditId).get())
    if (existingAudit) return { replay: true, account: accountSummary(await accountGet(transaction, targetOpenid)) }
    const ref = transaction.collection(ACCOUNT_COLLECTION).doc(accountId(targetOpenid))
    const account = dataOf(await ref.get())
    if (!account) fail('ACCOUNT_NOT_INITIALIZED', '账户尚未初始化')
    const next = { ...account, status, version: Number(account.version || 0) + 1, updatedAt: new Date() }
    await ref.set({ data: next })
    await auditAndLedger(transaction, {
      operationId, operatorOpenid, targetOpenid,
      action: status === 'frozen' ? 'admin.account.freeze' : 'admin.account.unfreeze',
      reason, before: accountSummary(account), after: accountSummary(next)
    })
    return { replay: false, account: accountSummary(next) }
  })
}

async function assignPlan(db, { event, operatorOpenid, targetOpenid }) {
  const operationId = operationOf(event)
  const reason = event.reason || ''
  if (!reason.trim()) fail('REASON_REQUIRED', '套餐变更必须填写原因')
  if (!event.planId || !event.planVersion) fail('PLAN_REQUIRED', '必须提供 planId 和 planVersion')
  return runTransaction(db, async transaction => {
    const auditId = hash(`${operatorOpenid}:${operationId}`)
    const existingAudit = dataOf(await transaction.collection(AUDIT_COLLECTION).doc(auditId).get())
    if (existingAudit) return { replay: true, account: accountSummary(await accountGet(transaction, targetOpenid)) }
    const ref = transaction.collection(ACCOUNT_COLLECTION).doc(accountId(targetOpenid))
    const account = dataOf(await ref.get())
    if (!account) fail('ACCOUNT_NOT_INITIALIZED', '账户尚未初始化')
    const next = {
      ...account,
      planId: event.planId,
      planVersion: event.planVersion,
      version: Number(account.version || 0) + 1,
      updatedAt: new Date()
    }
    await ref.set({ data: next })
    await auditAndLedger(transaction, {
      operationId, operatorOpenid, targetOpenid,
      action: 'admin.account.assignPlan',
      reason, before: accountSummary(account), after: accountSummary(next)
    })
    return { replay: false, account: accountSummary(next) }
  })
}

async function main(event = {}, context = {}) {
  const operatorOpenid = assertAdmin()
  const db = createDb(context)
  const action = event.action

  if (action === 'admin.account.get') {
    const account = await accountGet(db, event.targetOpenid)
    return { account: accountSummary(account) }
  }
  if (action === 'admin.account.list') {
    const limit = Math.min(Math.max(Number(event.limit || 20), 1), 100)
    const skip = Math.max(Number(event.skip || 0), 0)
    const result = await db.collection(ACCOUNT_COLLECTION)
      .where(event.status ? { status: event.status } : {})
      .skip(skip).limit(limit).get()
    return {
      accounts: (result.data || []).map(account => accountSummary(account)),
      skip, limit
    }
  }
  if (action === 'admin.plan.list') {
    const result = await db.collection(PLAN_COLLECTION).where({}).limit(100).get()
    return { plans: result.data || [] }
  }
  if (action === 'admin.audit.list') {
    const limit = Math.min(Math.max(Number(event.limit || 20), 1), 100)
    const result = await db.collection(AUDIT_COLLECTION).where({}).limit(limit).get()
    return { audits: (result.data || []).map(item => ({
      operationId: item.operationId,
      action: item.action,
      targetOpenidHash: item.targetOpenidHash,
      reason: item.reason,
      beforeSummary: item.beforeSummary,
      afterSummary: item.afterSummary,
      createdAt: item.createdAt
    })) }
  }

  const targetOpenid = event.targetOpenid
  if (!targetOpenid) fail('TARGET_OPENID_REQUIRED')
  if (action === 'admin.credit.grant') {
    return { result: await changeCredits(db, { event, operatorOpenid, targetOpenid, delta: amountOf(event.amount) }) }
  }
  if (action === 'admin.credit.revoke') {
    return { result: await changeCredits(db, { event, operatorOpenid, targetOpenid, delta: -amountOf(event.amount) }) }
  }
  if (action === 'admin.account.freeze') {
    return { result: await setAccountStatus(db, { event, operatorOpenid, targetOpenid, status: 'frozen' }) }
  }
  if (action === 'admin.account.unfreeze') {
    return { result: await setAccountStatus(db, { event, operatorOpenid, targetOpenid, status: 'active' }) }
  }
  if (action === 'admin.account.assignPlan') {
    return { result: await assignPlan(db, { event, operatorOpenid, targetOpenid }) }
  }
  fail('UNKNOWN_ACTION', `未知后台 action: ${action}`)
}

exports.main = async (event = {}, context = {}) => {
  try {
    const result = await main(event, context)
    return { ok: true, result }
  } catch (error) {
    console.error('billing-admin', error.code || error.message)
    return { ok: false, error: error.message, errorCode: error.code || 'ADMIN_ERROR' }
  }
}
