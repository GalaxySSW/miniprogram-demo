// 临时身份诊断云函数：只用于获取当前调用者的 OPENID。
// 拿到管理员 OPENID 后应删除或停用，不要用于生产业务。
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return {
      ok: false,
      errorCode: 'OPENID_REQUIRED',
      error: '无法取得当前用户 OPENID'
    }
  }

  console.log('whoami OPENID requested')

  return {
    ok: true,
    openid: OPENID
  }
}
