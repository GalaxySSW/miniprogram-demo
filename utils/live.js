// 实时进展：轮询云函数拿案件时间线
//
// 为什么不用云数据库的 watch：前端 watch 要求放开集合读权限，而 cases 里存着双方的
// 陈述原文——放开等于任何人拿到记录 ID 就能读到别人吵架的内容，与产品的隐私承诺冲突。
// 走云函数轮询效果一样，权限一点不放开。以后若把状态拆到独立的公开集合，可无缝换成 watch。
const casedb = require('./casedb.js')

const FAST = 3000     // 有人在等的时候
const SLOW = 8000     // 页面在后台或长时间没变化

function start(docId, onChange, opts) {
  if (!docId) return { stop() {} }
  let timer = null
  let stopped = false
  let last = ''
  let idle = 0

  const tick = () => {
    if (stopped) return
    casedb.timeline(docId).then(t => {
      if (stopped || !t) return schedule()
      const sig = JSON.stringify(t)
      if (sig !== last) {
        last = sig
        idle = 0
        onChange(t)
      } else {
        idle += 1
      }
      schedule()
    }).catch(schedule)
  }

  const schedule = () => {
    if (stopped) return
    // 连续多次没变化就放慢，省调用次数
    timer = setTimeout(tick, idle > 6 ? SLOW : ((opts && opts.interval) || FAST))
  }

  tick()
  return {
    stop() {
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }
}

module.exports = { start }
