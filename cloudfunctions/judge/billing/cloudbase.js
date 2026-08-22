// CloudBase 真实账本适配器。
// 事务只处理账户、usage 和流水，不在事务中调用外部模型。
const crypto = require('crypto')
const tcb = require('@cloudbase/node-sdk')

const LEASE_MS = Number(process.env.AI_BILLING_LEASE_MS || 120000)

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function fail(code, message) {
  const error = new Error(message || code)
  error.code = code
  return error
}

function dataOf(snapshot) {
  return snapshot && snapshot.data ? snapshot.data : null
}

async function runTransaction(db, callback) {
  const raw = await db.runTransaction(callback)
  return raw && Object.prototype.hasOwnProperty.call(raw, 'result') ? raw.result : raw
}

function accountId(openid) {
  return hash(`account:${openid}`)
}

function usageId(openid, idempotencyKey) {
  return hash(`usage:${openid}:${idempotencyKey}`)
}

function createCloudBaseLedger({ context } = {}) {
  const options = { context }
  if (process.env.CLOUDBASE_ENV_ID) options.env = process.env.CLOUDBASE_ENV_ID
  if (process.env.CLOUDBASE_APIKEY) options.accessKey = process.env.CLOUDBASE_APIKEY
  const app = tcb.init(options)
  const db = app.database()

  async function reserve(input) {
    const {
      openid, requestId, idempotencyKey, action, cost,
      model, priceVersion, inputHash
    } = input || {}
    if (!openid) throw fail('OPENID_REQUIRED')
    if (!idempotencyKey) throw fail('IDEMPOTENCY_KEY_REQUIRED')
    if (!Number.isFinite(cost) || cost < 0) throw fail('INVALID_QUOTE')

    const id = usageId(openid, idempotencyKey)
    return runTransaction(db, async transaction => {
      const usageRef = transaction.collection('ai_usage').doc(id)
      const existing = dataOf(await usageRef.get())
      if (existing) {
        if (existing.inputHash !== (inputHash || null)) throw fail('IDEMPOTENCY_CONFLICT')
        const account = dataOf(await transaction.collection('ai_accounts').doc(accountId(openid)).get())
        return { replay: true, usage: existing, account: account || null }
      }

      const accountRef = transaction.collection('ai_accounts').doc(accountId(openid))
      const account = dataOf(await accountRef.get())
      if (!account) throw fail('ACCOUNT_NOT_INITIALIZED')
      if (account.status !== 'active') throw fail('ACCOUNT_FROZEN')
      if (Number(account.available || 0) < cost) throw fail('INSUFFICIENT_CREDITS')

      const now = new Date()
      const nextAccount = {
        ...account,
        available: Number(account.available || 0) - cost,
        reserved: Number(account.reserved || 0) + cost,
        version: Number(account.version || 0) + 1,
        updatedAt: now
      }
      const record = {
        _id: id,
        requestId: requestId || null,
        idempotencyKey,
        openidHash: hash(openid),
        action,
        model: model || null,
        priceVersion: priceVersion || null,
        inputHash: inputHash || null,
        reservedCredits: cost,
        chargedCredits: 0,
        state: 'reserved',
        leaseExpiresAt: new Date(now.getTime() + LEASE_MS),
        createdAt: now,
        updatedAt: now
      }
      await accountRef.set({ data: nextAccount })
      await usageRef.set({ data: record })
      await transaction.collection('ai_credit_ledger').doc(`${id}:reserve`).set({ data: {
        _id: `${id}:reserve`,
        openidHash: hash(openid),
        usageId: id,
        type: 'reserve',
        delta: -cost,
        balanceAfter: nextAccount.available,
        operationId: requestId || id,
        createdAt: now
      } })
      return { replay: false, usage: record, account: nextAccount }
    })
  }

  async function finish(input, targetState) {
    const { openid, usageId: id, resultHash, errorCode } = input || {}
    if (!openid || !id) throw fail('USAGE_REFERENCE_REQUIRED')
    if (!['settled', 'released'].includes(targetState)) throw fail('INVALID_TERMINAL_STATE')

    return runTransaction(db, async transaction => {
      const usageRef = transaction.collection('ai_usage').doc(id)
      const usage = dataOf(await usageRef.get())
      if (!usage) throw fail('USAGE_NOT_FOUND')
      const accountRef = transaction.collection('ai_accounts').doc(accountId(openid))
      const account = dataOf(await accountRef.get())
      if (!account) throw fail('ACCOUNT_NOT_INITIALIZED')
      if (['settled', 'released', 'refunded', 'expired'].includes(usage.state)) {
        return { replay: true, usage, account }
      }
      if (usage.state !== 'reserved') throw fail('USAGE_NOT_SETTLEABLE')

      const reserved = Number(usage.reservedCredits || 0)
      const now = new Date()
      const nextAccount = {
        ...account,
        available: targetState === 'released'
          ? Number(account.available || 0) + reserved
          : Number(account.available || 0),
        reserved: Number(account.reserved || 0) - reserved,
        consumedTotal: Number(account.consumedTotal || 0) + (targetState === 'settled' ? reserved : 0),
        version: Number(account.version || 0) + 1,
        updatedAt: now
      }
      if (nextAccount.reserved < 0) throw fail('NEGATIVE_RESERVED_BALANCE')
      const nextUsage = {
        ...usage,
        state: targetState,
        chargedCredits: targetState === 'settled' ? reserved : 0,
        resultHash: resultHash || null,
        errorCode: errorCode || null,
        updatedAt: now
      }
      await accountRef.set({ data: nextAccount })
      await usageRef.set({ data: nextUsage })
      await transaction.collection('ai_credit_ledger').doc(`${id}:${targetState}`).set({ data: {
        _id: `${id}:${targetState}`,
        openidHash: hash(openid),
        usageId: id,
        type: targetState,
        delta: targetState === 'released' ? reserved : 0,
        balanceAfter: nextAccount.available,
        operationId: usage.requestId || id,
        errorCode: errorCode || null,
        createdAt: now
      } })
      return { replay: false, usage: nextUsage, account: nextAccount }
    })
  }

  return {
    reserve,
    settle: input => finish(input, 'settled'),
    release: input => finish(input, 'released')
  }
}

module.exports = { createCloudBaseLedger, hash, accountId, usageId }
