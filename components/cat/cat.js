// 线稿猫猫判官：纯 CSS 单线稿，mood / motion / size 与 UI Figma 契约对齐
Component({
  properties: {
    // calm: 圆点眼 / thinking: 思考点 / happy: 弯弯眼 / alert: 警觉 / sleep: 闭眼
    mood: { type: String, value: 'calm' },
    // calm / breathe / think / none；保留 breathe 布尔属性兼容旧页面
    motion: { type: String, value: 'none' },
    // small / medium / large
    size: { type: String, value: 'medium' },
    // 猫身体的填充色，需与所在背景一致（默认暖白）
    bg: { type: String, value: '#FFF9F1' },
    breathe: { type: Boolean, value: false }
  }
})
