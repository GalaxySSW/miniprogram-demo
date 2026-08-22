// 纯内存账本状态机，仅用于本地单元验证和定义数据库适配器契约。
// 不把它当作生产余额存储；生产接入必须使用 CloudBase 事务/条件更新。

const TERMINAL = new Set(['settled', 'released', 'refunded', 'expired'])

function createLedger(initialAccounts) {
  const accounts = new Map()
  const usage = new Map()
  const entries = []

  Object.keys(initialAccounts || {}).forEach(openid => {
    const account = initialAccounts[openid]
    accounts.set(openid, {
      openid,
      available: Number(account.available || 0),
      reserved: Number(account.reserved || 0),
      version: Number(account.version || 0),
      status: account.status || 'active'
    })
  })

  function accountFor(openid) {
    if (!openid) throw new Error('OPENID_REQUIRED')
    if (!accounts.has(openid)) {
      accounts.set(openid, { openid, available: 0, reserved: 0, version: 0, status: 'active' })
    }
    return accounts.get(openid)
  }

  function reserve(input) {
    const { openid, idempotencyKey, requestId, action, cost, inputHash } = input || {}
    if (!idempotencyKey) throw new Error('IDEMPOTENCY_KEY_REQUIRED')
    if (!action || !Number.isFinite(cost) || cost < 0) throw new Error('INVALID_QUOTE')
    const usageId = `${openid}:${idempotencyKey}`
    const existing = usage.get(usageId)
    if (existing) {
      if (existing.inputHash !== (inputHash || null)) throw new Error('IDEMPOTENCY_CONFLICT')
      return { replay: true, usage: { ...existing }, account: { ...accountFor(openid) } }
    }

    const account = accountFor(openid)
    if (account.status !== 'active') throw new Error('ACCOUNT_FROZEN')
    if (account.available < cost) throw new Error('INSUFFICIENT_CREDITS')

    account.available -= cost
    account.reserved += cost
    account.version += 1
    const record = {
      usageId, openid, requestId: requestId || null, idempotencyKey, action,
      inputHash: inputHash || null, reservedCredits: cost, chargedCredits: 0,
      state: 'reserved'
    }
    usage.set(usageId, record)
    entries.push({ type: 'reserve', usageId, openid, delta: -cost, balanceAfter: account.available })
    return { replay: false, usage: { ...record }, account: { ...account } }
  }

  function finish(input, targetState) {
    const { usageId, resultHash, errorCode } = input || {}
    const record = usage.get(usageId)
    if (!record) throw new Error('USAGE_NOT_FOUND')
    if (TERMINAL.has(record.state)) return { replay: true, usage: { ...record }, account: { ...accountFor(record.openid) } }
    const account = accountFor(record.openid)
    account.reserved -= record.reservedCredits
    if (account.reserved < 0) throw new Error('NEGATIVE_RESERVED_BALANCE')
    if (targetState === 'settled') record.chargedCredits = record.reservedCredits
    else account.available += record.reservedCredits
    record.state = targetState
    record.resultHash = resultHash || null
    record.errorCode = errorCode || null
    account.version += 1
    entries.push({
      type: targetState,
      usageId,
      openid: record.openid,
      delta: targetState === 'settled' ? 0 : record.reservedCredits,
      balanceAfter: account.available,
      errorCode: record.errorCode
    })
    return { replay: false, usage: { ...record }, account: { ...account } }
  }

  return {
    reserve,
    settle: input => finish(input, 'settled'),
    release: input => finish(input, 'released'),
    snapshot: () => ({
      accounts: Array.from(accounts.values()).map(account => ({ ...account })),
      usage: Array.from(usage.values()).map(record => ({ ...record })),
      entries: entries.map(entry => ({ ...entry }))
    })
  }
}

module.exports = { createLedger }
