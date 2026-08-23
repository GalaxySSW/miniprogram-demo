const assert = require('assert')
const { createLedger } = require('./billing-ledger')

function run() {
  const ledger = createLedger({ userA: { available: 10 } })

  const first = ledger.reserve({
    openid: 'userA', requestId: 'req-1', idempotencyKey: 'key-1',
    action: 'verdict', cost: 6, inputHash: 'hash-a'
  })
  assert.strictEqual(first.usage.state, 'reserved')
  assert.strictEqual(first.account.available, 4)
  assert.strictEqual(first.account.reserved, 6)

  const replay = ledger.reserve({
    openid: 'userA', requestId: 'req-other', idempotencyKey: 'key-1',
    action: 'verdict', cost: 6, inputHash: 'hash-a'
  })
  assert.strictEqual(replay.replay, true)
  assert.strictEqual(ledger.snapshot().entries.length, 1)

  assert.throws(() => ledger.reserve({
    openid: 'userA', requestId: 'req-2', idempotencyKey: 'key-2',
    action: 'verdict', cost: 6, inputHash: 'hash-b'
  }), /INSUFFICIENT_CREDITS/)

  const settled = ledger.settle({ usageId: first.usage.usageId, resultHash: 'result-a' })
  assert.strictEqual(settled.usage.state, 'settled')
  assert.strictEqual(settled.usage.chargedCredits, 6)
  assert.strictEqual(settled.account.available, 4)
  assert.strictEqual(settled.account.reserved, 0)

  const second = ledger.reserve({
    openid: 'userA', requestId: 'req-3', idempotencyKey: 'key-3',
    action: 'intake', cost: 1, inputHash: 'hash-c'
  })
  const released = ledger.release({ usageId: second.usage.usageId, errorCode: 'UPSTREAM_TIMEOUT' })
  assert.strictEqual(released.usage.state, 'released')
  assert.strictEqual(released.account.available, 4)
  assert.strictEqual(released.account.reserved, 0)

  assert.throws(() => ledger.reserve({
    openid: 'userA', requestId: 'req-4', idempotencyKey: 'key-1',
    action: 'verdict', cost: 6, inputHash: 'different'
  }), /IDEMPOTENCY_CONFLICT/)

  console.log('ledger tests passed')
}

run()
