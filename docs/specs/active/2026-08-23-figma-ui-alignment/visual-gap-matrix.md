# Visual Gap Matrix：Figma ↔ 微信开发者工具

日期：2026-08-23  
基线：Figma `20260822_panpan_UI_design` 只读证据、用户提供的 390×844 Home 截图、微信开发者工具 iPhone 15 Pro Max 模拟器与 MCP 截图。

## 资产存储决策

| 资产类型 | 当前处理 | 原因 | 验收方式 |
|---|---|---|---|
| Logo、Mascot、固定品牌 icon | 小程序包内本地 SVG | 固定、版本随代码发布，不应依赖 Figma 临时 URL 或网络 | 断网仍可渲染；截图线稿/比例与 Figma 一致 |
| 用户上传聊天截图/证据 | 云存储 fileID/受控临时 URL | 运行时产生，涉及双方授权和跨设备读取 | 上传失败可重试，不把本地临时路径当永久数据 |
| 用户语音 | 云存储 fileID，完成转写后按策略清理 | 运行时产生且需要云端转写 | 权限、上传、ASR 失败均有可恢复状态 |
| Poster/canvas 生成图 | 先本地临时文件；用户保存/分享时再决定是否上传 | 生成结果属于用户动作，不应首屏强制上传 | 本地预览成功；保存/分享失败可重试 |
| Figma MCP 临时 asset URL | 不直接提交 | URL 有效期和访问条件不稳定 | 下载为本地精确字节，代码仅引用本地路径 |

当前本地品牌资产：

- `assets/brand/panpan-mascot.svg`：Home header/companion 使用的猫咪。
- `assets/brand/panpan-logo-lockup-full.svg`：用户提供的 610×150 完整 Logo Lockup，供品牌/分享类页面复用。
- `assets/brand/panpan-logo-lockup.svg`：Figma 导出的猫咪 Lockup 资产，历史命名保留，后续统一命名时不改变字节内容。

## 页面差异与修复队列

| Route | 当前主要 Gap | 资产/数据风险 | 优先级 | 当前状态 |
|---|---|---|---|---|
| `pages/home/home` | 首屏 Header、Hero、CTA、案件状态层级与 Figma 对齐；窄屏文字不溢出 | 品牌猫咪已改本地；案件数据保持动态，不硬编码成功态 | P0 | Home 首轮已修，MCP 截图通过；需继续做 390 宽复核 |
| `pages/evidence/evidence` | 顶部安全区；`＋`/隐私字符 icon 与 Figma 不一致；上传失败态不完整 | 图片需云存储，临时路径不能写入长期案件 | P0 | 待修 |
| `pages/statement/statement` | 顶部安全区；语音字符 icon；底部操作栏溢出风险 | 语音需云存储和 ASR，草稿必须本地保留 | P0 | 待修 |
| `pages/accept/accept` | CSS 猫咪与 Figma 资产不一致；mock 受理态需明确 | 不得把 fallback 显示为真实受理成功 | P0 | 待修 |
| `pages/preview/preview` | 视觉基线被 AI/积分弹窗遮挡；顶部/底部安全区 | AI 与账单是动态云端能力，视觉验收默认 mock | P0 | 待修 |
| `pages/share/share` | CSS 猫咪；发送前写入案件状态的时机需收紧 | 分享图可本地预览；真正分享时才决定云端 | P0 | 待修 |
| `pages/waiting/waiting` | 时间线图标/勾选字符；底部安全区 | 轮询失败必须可重试，不假装对方已加入 | P0 | 待修 |
| `pages/respond/respond` | CSS 猫咪；邀请异常态契约需显式 | 不泄露无权限案件存在性 | P0 | 待修 |
| `pages/their-statement/their-statement` | 底部语音栏色值和 Emoji icon；安全区 | 语音上传/权限失败可恢复，草稿不丢 | P0 | 待修 |
| `pages/interview/interview` | AI 弹窗遮挡；聊天头像/气泡内联绘制；色值混用 | 默认 mock/fallback 要有克制标记 | P0 | 待修 |
| `pages/trial/trial` | AI 弹窗遮挡；CSS 猫咪；步骤节奏与 Spec 不一致 | 真实 AI 未完成时不可跳假结果 | P0 | 待修 |
| `pages/verdict/verdict` | 猫咪/印章与素材不一致；inline style 多 | 只展示共同可见、脱敏后的结果 | P0 | 待修 |
| `pages/pact/pact` | 局部颜色/尺寸写死；猫咪不一致 | fallback 约定必须标注来源，不伪装真实确认 | P0 | 待修 |
| `pages/case-detail/case-detail` | 状态卡接近，但时间轴/安全区仍需对齐 | 必须以 `docId` 读安全投影，不能只依赖 globalData | P0 | 待修 |
| `pages/history/history` | 列表需和 Home 入口统一；长标题溢出 | 案件摘要只展示安全投影 | P0 入口 | 待修 |
| `pages/reply/reply` | P1 页面需补齐素材和长文案策略 | 仅共同可见内容可分享 | P1 | 待修 |
| `pages/poster/poster` | Canvas 结果与 Figma 分享稿待对齐 | 生成图先本地；保存/分享再考虑云端 | P1 | 待修 |
| `pages/pebble/pebble` | 图片/Emoji/歌名混合态待对齐 | 图片需云存储，不能把 tempFilePath 写入云数据 | P1 | 待修 |
| `pages/review/review` | 复盘卡片和状态待对齐 | 复盘结果属于双方共同数据 | P1 | 待修 |
| `pages/profile/profile` | 资料页与品牌/安全区待对齐 | 不显示敏感原文和外部 AI 输入 | P1 | 待修 |

## Home 当前截图验收

- 入口：`pages/home/home`
- 操作：`mp_ensureConnection` → `reLaunch Home` → MCP snapshot → 串行截图。
- 预期：品牌猫咪本地渲染；Hero 不横向溢出；主 CTA 满宽；有进行中案件时隐藏次级“收到传票”按钮。
- 实际：主 CTA `386×59px`，Hero 标题/正文均在容器内换行，案件主题单行省略，footer 位于安全区上方；截图文件 `/tmp/home-figma-compare-v2.png`。
- 待人工真机确认：系统胶囊与自定义 TopBar 的垂直关系；字体在不同系统字号设置下的实际换行。

## 导航与返回验收

- `app.json` 当前 20 个 route 已按 JSON 的 `navigationStyle` 扫描。
- 默认导航页：移除页面内 `‹ 返回`/`‹ 首页`，保留微信原生导航返回，避免出现两套返回。
- 自定义导航页：仅 `evidence`、`statement` 保留页面内返回；返回控件改为固定尺寸 `view`，避免原生 button 默认宽度撑开标题。
- `evidence/statement` 的页面内仿制 `.page-capsule` 已移除，右上角交给微信宿主菜单。
- 静态扫描结果：`navigation-back-scan: ok (20 routes)`；MCP 抽查 `accept`、`evidence`、`statement` 均无重复返回/胶囊节点。

## Statement 溢出修复（2026-08-23）

- 原因：微信原生 `<button>` 的默认宽度覆盖了页面级 `width: 100%`，导致渐进按钮和提交按钮只有约 184px。
- 修复：将纯布局交互按钮改为 `view`，保留 `qa-*`、tap handler 和 JS 幂等校验；提交按钮恢复为内容容器宽度。
- 防回归：textarea 增加最大高度和滚动；长问题/说明允许断行；提交按钮单行省略；语音按钮显式 `width: 100%`。
- MCP 结构化证据：`#qa-statement-next-question` 与 `#qa-statement-submit` 均为 `376px` 宽，`.statement-voice-dock` 为 `430px` 宽。
- 视觉截图注意：截图通道在复核时被并发页面状态切换到 `verdict`，因此未将该张截图作为 statement 证据；结构化尺寸和静态检查通过，需在单独人工 statement 页面上再做一次截图确认。
