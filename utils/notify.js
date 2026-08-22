// 消息通知
//
// 两条腿走路：
// 1. 站内提醒——打开小程序就能看到「有什么新进展」，不依赖任何授权，永远可用
// 2. 订阅消息——微信的推送，能把人从小程序外面叫回来，但每次推送都要用户单独授权，
//    且需要在小程序后台先建好模板。TEMPLATES 填上模板 ID 后自动生效，为空时静默跳过。
const casedb = require('./casedb.js')

// 在 mp.weixin.qq.com「功能 → 订阅消息」里建模板后，把 ID 填到这里
const TEMPLATES = {
  responded: '',   // TA 应诉了，可以开庭
  verdict: '',     // 判决书已就绪
  review: ''       // 三天后回访
}

// 已经看过的事，本地记一下，避免每次打开都重复提醒
function seenKey(item) { return `seen:${item.docId}:${item.kind}` }

function unseen(items) {
  return (items || []).filter(it => {
    try { return !wx.getStorageSync(seenKey(it)) } catch (e) { return true }
  })
}

function markSeen(item) {
  try { wx.setStorageSync(seenKey(item), 1) } catch (e) {}
}

// 取回未读提醒
function fetch() {
  return casedb.inbox().then(items => unseen(items))
}

// 在关键节点顺手请求一次订阅授权：一次授权对应一次推送
// 必须由用户点击触发，不能自动调用
function askSubscribe(kinds) {
  const ids = (kinds || []).map(k => TEMPLATES[k]).filter(Boolean)
  if (!ids.length) return Promise.resolve(false)
  return new Promise(resolve => {
    wx.requestSubscribeMessage({
      tmplIds: ids,
      success: (res) => resolve(ids.some(id => res[id] === 'accept')),
      fail: () => resolve(false)
    })
  })
}

module.exports = { fetch, markSeen, askSubscribe, TEMPLATES }
