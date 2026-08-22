// 结案长图：只画判决金句与误会指数，绝不含陈述原文、案由、台阶等隐私内容
const app = getApp()

const W = 750           // 9:16 竖版，适配朋友圈与小红书信息流
const PAD = 60
const CREAM = '#FAF7F2'
const INK = '#1A1918'
const CLAY = '#C9573F'
const HONEY = '#B0793F'
const LINE = '#E1DACE'
const MUTE = '#9C958A'

Page({
  data: {
    imgPath: '',
    building: true,
    ratio: 1
  },

  onLoad() {
    wx.createSelectorQuery().select('#poster').fields({ node: true, size: true }).exec(res => {
      if (!res[0]) return this.setData({ building: false })
      this.draw(res[0].node)
    })
  },

  // 按宽度断行，返回实际画到的 y
  wrap(ctx, text, x, y, maxW, lineH, align) {
    const chars = String(text || '').split('')
    let line = ''
    for (const ch of chars) {
      const test = line + ch
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, align === 'center' ? W / 2 : x, y)
        line = ch
        y += lineH
      } else {
        line = test
      }
    }
    if (line) {
      ctx.fillText(line, align === 'center' ? W / 2 : x, y)
      y += lineH
    }
    return y
  },

  draw(canvas) {
    const v = app.globalData.verdict || {}
    const caseId = app.globalData.caseData.id || ''
    const dpr = wx.getSystemInfoSync().pixelRatio || 2
    const H = 1334

    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // 纸底
    ctx.fillStyle = CREAM
    ctx.fillRect(0, 0, W, H)

    let y = 130

    // 抬头
    ctx.fillStyle = HONEY
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('爱 情 判 官', W / 2, y)
    y += 60

    ctx.fillStyle = INK
    ctx.font = '46px sans-serif'
    ctx.fillText('判 决 书', W / 2, y)
    y += 40

    ctx.fillStyle = MUTE
    ctx.font = '20px sans-serif'
    ctx.fillText(caseId, W / 2, y)
    y += 50

    ctx.strokeStyle = LINE
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
    y += 90

    // 误会指数：全图唯一的数字
    ctx.fillStyle = CLAY
    ctx.font = '120px sans-serif'
    ctx.fillText(String(v.index || 87) + '%', W / 2, y)
    y += 40
    ctx.fillStyle = MUTE
    ctx.font = '22px sans-serif'
    ctx.fillText('是误会，不是不爱', W / 2, y)
    y += 50

    // 指数条
    const barW = W - PAD * 2
    const pct = Math.max(1, Math.min(100, Number(v.index) || 87)) / 100
    ctx.fillStyle = 'rgba(201, 87, 63, 0.14)'
    ctx.fillRect(PAD, y, barW, 8)
    ctx.fillStyle = CLAY
    ctx.fillRect(PAD, y, barW * pct, 8)
    y += 130

    // 只画脱敏金句：判决主文可能带着可被认出的具体情节，绝不能进分享图
    ctx.fillStyle = INK
    ctx.font = '40px sans-serif'
    y = this.wrap(ctx, v.shareLine || v.verdictTitle || '本案不存在被告。', PAD, y, barW - 20, 62, 'center')
    y += 110

    // 印章
    const seal = { misunderstanding: ['误会', '有罪'], breach: ['有错', '可改'], mismatch: ['未曾', '对齐'] }
    const s = seal[v.caseType] || seal.misunderstanding
    const cx = W / 2, cy = y + 60
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(-12 * Math.PI / 180)
    ctx.strokeStyle = CLAY
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(0, 0, 62, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = CLAY
    ctx.font = '30px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(s[0], 0, -6)
    ctx.fillText(s[1], 0, 34)
    ctx.restore()
    y = cy + 130

    // 页脚固定在底部
    ctx.fillStyle = MUTE
    ctx.font = '20px sans-serif'
    ctx.fillText('本图只含判决金句，不含任何聊天内容', W / 2, H - 96)
    ctx.fillStyle = HONEY
    ctx.font = '22px sans-serif'
    ctx.fillText('爱情判官 · 吵不明白的架，交给本庭', W / 2, H - 56)

    // 竖版比例固定，页脚压在底部，不按内容裁剪
    const finalH = H
    wx.canvasToTempFilePath({
      canvas,
      x: 0, y: 0, width: W, height: finalH,
      destWidth: W * dpr, destHeight: finalH * dpr,
      success: (r) => this.setData({
        imgPath: r.tempFilePath,
        building: false,
        ratio: finalH / W
      }),
      fail: (e) => {
        console.warn('[poster] 生成失败', e)
        this.setData({ building: false })
      }
    })
  },

  save() {
    if (!this.data.imgPath) return
    wx.saveImageToPhotosAlbum({
      filePath: this.data.imgPath,
      success: () => wx.showToast({ title: '已存进相册', icon: 'none' }),
      fail: (e) => {
        if (/auth|deny/i.test(e.errMsg || '')) {
          wx.showModal({
            title: '需要相册权限',
            content: '开启后才能把判决书存下来。',
            confirmText: '去开启',
            success: (r) => { if (r.confirm) wx.openSetting({}) }
          })
        } else {
          wx.showToast({ title: '没存成，再试一次', icon: 'none' })
        }
      }
    })
  },

  preview() {
    if (!this.data.imgPath) return
    wx.previewImage({ urls: [this.data.imgPath] })
  }
})
