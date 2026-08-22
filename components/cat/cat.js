// 线稿猫猫判官：纯 CSS 单线稿，mood 切换表情
Component({
  properties: {
    // calm: 圆点眼 / happy: 弯弯眼 / sleep: 闭眼
    mood: { type: String, value: 'calm' },
    // 猫身体的填充色，需与所在背景一致（默认奶油纸）
    bg: { type: String, value: '#FAF7F2' },
    breathe: { type: Boolean, value: false }
  }
})
