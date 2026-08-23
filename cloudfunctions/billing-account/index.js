const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const tcb = require('@cloudbase/node-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function accountId(openid) {
  return hash(`account:${openid}`)
}

function summary(account) {
  if (!account) return { initialized: false, available: 0, reserved: 0, status: 'uninitialized' }
  return {
    initialized: true,
    available: Number(account.available || 0),
    reserved: Number(account.reserved || 0),
    grantedTotal: Number(account.grantedTotal || 0),
    consumedTotal: Number(account.consumedTotal || 0),
    status: account.status || 'active',
    planId: account.planId || null,
    planVersion: account.planVersion || null
  }
}

exports.main = async () => {
  try {
    const { OPENID } = cloud.getWXContext()
    if (!OPENID) return { ok: false, error: '无法取得用户身份', errorCode: 'OPENID_REQUIRED' }
    const options = { context: cloud.getWXContext() }
    if (process.env.CLOUDBASE_ENV_ID) options.env = process.env.CLOUDBASE_ENV_ID
    if (process.env.CLOUDBASE_APIKEY) options.accessKey = process.env.CLOUDBASE_APIKEY
    const db = tcb.init(options).database()
    const result = await db.collection('ai_accounts').doc(accountId(OPENID)).get()
    return { ok: true, result: summary(result && result.data) }
  } catch (error) {
    console.error('billing-account', error.code || error.message)
    return { ok: false, error: '积分账户暂时无法读取', errorCode: error.code || 'ACCOUNT_READ_FAILED' }
  }
}
