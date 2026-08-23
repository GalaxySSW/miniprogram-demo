# Context：Figma UI 对齐 Spec

- 功能 ID：`2026-08-23-figma-ui-alignment`
- 目标代码目录：`07-代码/miniprogram-demo/`
- 当前阶段：Spec/Plan、Foundation 与 P0 首轮切片已完成；已修复一次真实 WXML 编译错误，并完成 DevTools 编译、Home/创建案件首段 MCP 冒烟和首轮视觉截图校对
- 本轮实际修改：本目录 Spec 文档、`app.wxss`、公共 UI 组件、Home/首段流程和其余 P0 页面
- 本轮明确不修改：Figma 文件、云函数数据结构、真实数据、支付、发布配置

## 权威资料与阅读顺序

1. 用户当前消息与明确边界：Figma 只读；只写 Spec 文档。
2. 根目录 `AGENTS.md` 与 `07-代码/miniprogram-demo/AGENTS.md`。
3. `07-代码/miniprogram-demo/app.json`：当前实际注册的 route 真源。
4. 既有 `docs/specs/active/2026-08-23-home-entry-experience/`：产品边界、页面契约、状态枚举、mock-first 和验证约定。
5. `13-UI-Figma前端Handoff.md`、`11-UI设计稿执行TODO.md`：既有设计交接和未完成项。
6. 用户提供的 Figma CSS 导出附件：UI Design System v2、UI Foundations、Button、Home、Evidence、Reply、Screen、Prototype、Handoff Board。
7. Figma 链接仅用于只读核对；本轮没有创建、移动、删除、改名或修改任何 Figma 节点。

## 当前仓库基线

- 这是原生微信小程序，页面由 WXML/WXSS/JS/JSON 组成。
- `app.json` 当前注册 20 个页面，包含 P0 `case-detail`。仓库中部分旧文档仍写 19 个页面；本 Spec 统一以 `app.json` 的 20 个 route 为准。
- 默认入口是 `pages/home/home`，首轮演示必须走本地 mock/fallback 闭环；不能把模拟器跑通描述成真实双设备、真实用户数据或生产能力。
- 当前已有 `components/cat/`；页面中仍可见不少内联公共结构。工作区也可能包含用户此前新增但尚未提交的公共组件，本轮不将其视为已验收能力，后续仍需按本 Spec 逐项核对。
- `app.wxss` 已完成一轮运行时 Token 审计：移动端 Figma 使用 `#FAF7F2/#FFFDF9/#1A1918/#3B2919/#E1DACE`，Handoff 看板色保留为文档参考，不直接作为运行时主色。
- `app.globalData.caseData` 只适合短期流程上下文，不能作为历史案件和 `case-detail` 的唯一来源；案件详情必须以 `docId` 安全读取。

## 资产与溢出决策（2026-08-23）

- 固定 Logo、Mascot、状态 icon 统一作为本地静态素材提交；不把 Figma MCP 的临时 URL 直接写入 WXML/WXSS。
- 用户上传的聊天截图、证据图片和语音继续走云存储/受控临时 URL；Poster canvas 先生成本地临时文件，用户明确保存或分享时再决定是否上传。
- 文案默认允许换行；案号、状态、案件主题、按钮和底部隐私文案必须有 `min-width: 0`、`overflow`、`text-overflow` 或可滚动策略，禁止撑破横向容器。
- 自定义导航页必须把顶部/底部安全区纳入布局；微信系统胶囊属于运行时宿主 UI，需用 DevTools 截图人工确认不遮挡关键字。
- 默认导航页只使用微信原生返回；页面 WXML 不再重复绘制 `‹ 返回`/`‹ 首页`。只有 `navigationStyle: custom` 的 `evidence/statement` 保留固定尺寸的页面内返回控件，且不再仿制右上角系统胶囊。

## 设计证据的解释

Figma 导出中存在两种颜色上下文，后续实现不得混用：

| 上下文 | 典型来源 | 用途 |
|---|---|---|
| 移动端运行时 UI | `UI Design System / v2`、`home-default`、`evidence`、`reply`、`Button` | 小程序页面、组件和交互状态 |
| Handoff 文档画布 | `handoff-board` | 交付看板、表格和研发说明，不自动等同于页面运行时颜色 |

移动端参考画布以 390×844 为主；Figma 的桌面 Foundations/Handoff 页面是设计交接文档，不是小程序 viewport。后续实现应使用 rpx、安全区和可滚动页面结构，不把 1440×900 或 390×844 的画布尺寸硬编码成业务布局。

## 已确认决策

- Figma 是只读视觉参考；实现以本 Spec、既有业务契约和代码真实能力为边界。
- 视觉对齐先建立 Token/Typography/组件契约，再按 P0 主流程、Home 三态、Case Detail、P1 扩展页面推进。
- 异常、权限、隐私、恢复和安全暂停优先作为页面状态或公共组件承载，不为每种状态新增业务 route。
- UI 交互必须显式表达 `RequestState`、`PersistenceState`、`RuntimeMode`，不得用 mock 输出掩盖失败或显示假成功。
- 任何涉及敏感关系内容、语音、截图、外部 AI、真实云环境、支付或发布的动作均不在本轮授权范围内。

## 本轮验证发现

- 微信开发者工具首次编译定位到 `components/recovery-panel/recovery-panel.wxml:2` 的错误属性 `wx:else"`；已修复为 `wx:else`，修复后 DevTools 模拟器成功渲染 Home，错误计数为 0。
- MCP 重启后恢复成功，当前页面可读取为 `pages/home/home`；Home → Evidence → Statement 路由和关键 `qa-*` 元素已通过短场景断言。
- Statement 输入 `#qa-statement-field-what` 后，`answers.what` 正确更新，第二个问题按渐进披露规则出现；已保存串行截图用于视觉复核。

## 未决问题

- Figma 运行时 Token 与现有 `app.wxss` 的变量值存在两套历史映射；实现前需完成一次逐项 Token 审计并冻结最终值。
- `expired`、`revoked`、`bound` 邀请状态当前后端字段不足，只能作为设计预留，不能在实现阶段伪造为已可靠判断。
- 冷启动草稿恢复、真机相册/麦克风/保存权限、双账号/双设备和云端数据必须单独验证；当前文档不宣称已实现。

## 本轮产出与下一步

本轮已产出本目录六份 Spec 文档，并完成 Foundation、Home、创建案件首段和 P0 页面代码落地。下一步是补齐 P0 其余流程、P1 页面、公共组件逐页接入和真机/双设备验证；当前 DevTools 编译、Home/首段 MCP 冒烟和首轮视觉截图已具备真实证据。
