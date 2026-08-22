// 小猫脸头像：只画脸，不画身体——全身缩放会带来布局溢出和气泡重叠
// 动态是刻意克制的：平时每 6 秒眨一次眼，思考时慢慢歪头，幅度都很小，不抢注意力
Component({
  properties: {
    // calm 平静 / thinking 思考中（歪头）/ happy 弯弯眼
    mood: { type: String, value: 'calm' }
  }
})
