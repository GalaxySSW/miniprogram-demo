# Verification：关系首页与案件回访入口

> 当前状态：设计交付已完成初版；运行时验证按页面和状态持续补充。本文件不把设计方案直接当作运行时验证。

## 验证记录模板

每次验证记录以下字段：

- 日期：
- 修改范围：
- 入口页面：
- 操作步骤：
- 预期路由/数据：
- 实际结果：
- 是否需要人工真机确认：
- 证据：截图、控制台输出、MCP 结果或命令输出

## 静态检查

| 检查 | 命令 | 状态 | 证据 |
|---|---|---|---|
| JavaScript 语法 | `node --check app.js` 及 pages/utils/cloudfunctions 全量检查 | 已通过 | `node --check` 全量执行，无语法错误 |
| JSON 语法 | 本轮变更 JSON 定向解析 | 已通过 | `app.json`、`case-detail.json`、`billing-account/package.json` 解析通过；仓库全量 `jq` 受既有非标准 JSON/依赖目录干扰 |
| 页面注册 | 核对 `app.json` 与 20 个页面 | 已通过 | `app.json` 注册 20 个 route，`pages/case-detail/` 文件存在 |
| 路由引用 | 检查所有新旧路径存在 | 待实现后执行 | 待补 |

## P0 安全与数据适配

| 检查 | 入口/范围 | 预期 | 状态 |
|---|---|---|---|
| 案件成员读权限 | `get` / `patterns` / `timeline` | 成员可读；非成员统一 `UNAUTHORIZED`，不泄露案件存在性 | 待验证 |
| 案件成员写权限 | `saveNote` / `saveVerdict` / `savePact` / `confirmPact` / `saveReview` / `destroy` | 非成员不能写；所有者规则有明确记录 | 待验证 |
| 石子接收方权限 | `receivePebble` | 只有目标接收方能标记已收下 | 待验证 |
| 数据结果协议 | `utils/casedb.js` | 区分云端空数据、业务失败、网络失败、Mock 和 fallback | 待验证 |

## Home 状态场景

| 场景 | 入口 | 预期 | 状态 |
|---|---|---|---|
| 新用户 | 普通打开 | `first-use`，看到立案和传票入口 | 待验证 |
| 有应诉案件 | 普通打开 | `action-center`，主按钮进入开庭 | 待验证 |
| 有判决无约定 | 普通打开 | 主按钮进入约定 | 待验证 |
| 有待复盘约定 | 普通打开 | 主按钮进入复盘 | 待验证 |
| 有历史无待办 | 普通打开 | `relationship-home`，看到最近案件和卷宗入口 | 待验证 |
| 云端空数据 | 普通打开 | 可理解空状态，不显示虚构云端历史 | 待验证 |
| 云端失败 | 普通打开 | 保留基础入口，提供重试或回 Home | 待验证 |

## 20 页页面契约

每个页面必须补齐以下字段，状态为“已完成”前不得只以正常态截图作为证据：

```text
route / entry condition / actor / privacy scope / async state
failure & retry / back & cancel / data saved / qa-* selector / priority
```

| 页面范围 | 最低交付 | 状态 |
|---|---|---|
| `home` | 三态、待办优先级、空态、云端失败、隐私说明 | 待验证 |
| `evidence` / `statement` | 权限、上传/转写、草稿保留、失败重试 | 待验证 |
| `accept` / `preview` / `share` | AI 生成中、可见范围、邀请异常、复制/发送成功 | 待验证 |
| `waiting` / `respond` / `their-statement` | 双方进度、口令异常、等待/超时、隐私范围 | 待验证 |
| `interview` / `trial` / `verdict` | 思考态、AI 超时、字段缺失、缺席/安全边界 | 待验证 |
| `pact` | 单方选择、双方确认、约定冲突、重新选择 | 待验证 |
| `reply` / `poster` / `pebble` | 生成失败、权限拒绝、上传失败、额度上限 | 待验证 |
| `history` / `review` / `profile` | 空数据、状态路由、删除、复盘和隐私承诺 | 待验证 |

## 跨页面状态契约

| 契约 | 必须覆盖 | 状态 |
|---|---|---|
| `RequestState` | idle/loading/success/failed/offline/timeout | 待验证 |
| `PersistenceState` | unsaved/saving/saved/draft-preserved/save-failed | 待验证 |
| `RuntimeMode` | cloud/mock/fallback | 待验证 |
| `PrivacyScope` | private-me/private-ta/joint/public-redacted | 待验证 |
| `InviteState` | valid/invalid/self/unauthorized/closed；expired/revoked/bound 为设计预留 | 待验证 |
| `SafetyState` | none/caution/intervene/help | 待验证 |
| `DeletionState` | idle/confirming/deleting/failed-retryable/deleted | 待验证 |
| `PermissionState` | unknown/granted/denied/blocked | 待验证 |
| `ActorProgress` | me-pending/me-done/ta-pending/ta-done/joint-done | 待验证 |

## 系统状态场景

| 场景 | 操作 | 预期 | 状态 |
|---|---|---|---|
| AI 超时 | 提交陈述或开庭 | 显示正在处理/超时原因，保留草稿，允许重试 | 待验证 |
| 云端保存失败 | 提交案件或约定 | 明确是否保存，不跳转到伪成功页面 | 待验证 |
| 冷启动恢复 | 输入后退出再进入 | 恢复草稿或明确无法恢复 | 待验证 |
| 权限拒绝 | 拒绝相册/麦克风/保存权限 | 解释用途，提供重试或跳过 | 待验证 |
| 邀请失效 | 输入过期/撤销口令 | 不泄露案件存在性，允许回 Home | 待验证 |
| 安全风险 | 输入触发干预 | 暂停普通流程，显示退出/求助入口 | 待验证 |
| 删除失败 | 确认删除 | 显示删除失败，可重试，不能误报完成 | 待验证 |
| 约定冲突 | 双方选择不同约定 | 允许重新选择，不自动强行合并 | 待验证 |

## 卷宗状态摘要卡与目标页场景

| 场景 | 操作 | 预期 | 状态 |
|---|---|---|---|
| 未发传票案件 | 卷宗状态摘要卡 | 显示继续发传票 | 待验证 |
| 等待应诉案件 | 卷宗状态摘要卡 | 显示等待 TA，并能查看进度 | 待验证 |
| 已应诉案件 | 卷宗状态摘要卡 | 显示开庭 | 待验证 |
| 已判决案件 | 卷宗状态摘要卡 | 显示查看判决或共同定约定 | 待验证 |
| 已结案未复盘 | 卷宗状态摘要卡 | 显示复盘 | 待验证 |
| 连续打开两桩案件 | 依次打开 A、B | B 不读取 A 的判决、约定或编号 | 待验证 |

## 返回链路场景

| 场景 | 操作 | 预期 | 状态 |
|---|---|---|---|
| Home → 新建流程 | 点击返回 | 返回上一步，不丢当前流程 | 待验证 |
| History → 状态目标页 | 点击返回首页 | 回到 Home | 待验证 |
| 状态目标页 → Verdict | 完成后回首页 | Home 重新加载最新待办 | 待验证 |
| 分享直达应诉 | 点击返回 | 不出现空白页或失效页面栈 | 待验证 |
| 页面栈为空 | 调用返回 | 兜底进入 Home | 待验证 |

## 隐私边界场景

| 场景 | 预期 | 状态 |
|---|---|---|
| Home 列表 | 不出现双方原话和截图原图 | 待验证 |
| 卷宗状态摘要卡 | 只出现脱敏案由和共同输出 | 待验证 |
| B 方打开案件 | 不能看到 A 方私密陈述 | 待验证 |
| 云端失败 | 不把旧的全局案件误展示为当前案件 | 待验证 |

## Figma 交付验证

| 交付对象 | 预期 | 状态 |
|---|---|---|
| UI Contract | 20 页均有入口、角色、隐私、异步、返回、保存和 `qa-*` 标注 | 已通过初版 |
| UI Foundations | 设计变量能映射现有/最终 `app.wxss` token | 已通过初版 | UI Figma 变量 + `app.wxss` CSS variables |
| UI Components | 公共组件有 Variants，包含正常、加载、失败和禁用 | 已通过初版 | `02 Components` + 组件契约矩阵 |
| Core/Extended Screens | P0/P1 页面主态和关键系统态完成 | 已通过初版 | `04 P0 Screens`、`05 P1 Screens`、`06 System States` |
| System States | 跨页面异常、权限、删除、安全状态集中出稿 | 已通过初版 | `06 System States` 8 类状态 |
| Prototype | 正常流程、失败恢复、安全暂停三条链路可点击 | 已通过初版 | `07 Prototype` 三条流程 |
| Handoff | 页面 ID、状态名、CTA、动效和研发标注完整 | 需重新生成 | 旧 Handoff 已有 19 个 route，新增 `case-detail` 后由 Figma Agent 补齐 |

## 运行时证据要求

## 本轮运行时记录

- 日期：2026-08-23
- 修改范围：`app.wxss` UI Token 与 `components/cat/` 的 `mood / motion / size` 契约；未修改业务数据和路由逻辑。
- 入口页面：`pages/home/home`
- 操作步骤：通过 `mp_ensureConnection` 连接微信开发者工具（自动化端口 9420），读取当前路由并截图。
- 预期路由/数据：当前路由为 `pages/home/home`；Home 正常渲染，主按钮、案件卡片、猫组件和页面背景可见。
- 实际结果：路由为 `pages/home/home`；页面正常渲染，截图无明显溢出或重叠。
- 是否需要人工真机确认：需要；当前仅为微信开发者工具模拟器证据。
- 证据：`/private/tmp/panpan-home-token-qa.png`；MCP 返回 `currentPage.path=pages/home/home`。
- 本轮静态路由核对：`app.json` 注册 20 个 route，包含 `pages/case-detail/case-detail`；微信开发者工具/MCP 运行时路由冒烟尚未执行。

实现完成后，必须补充：

- 微信开发者工具编译结果。
- 至少一组本地 Mock 主流程截图。
- 至少一组 Home 三态切换结果。
- 至少一组历史案件按 `docId` 打开结果。
- 至少一组返回 Home 的实际路由结果。
- 19 页页面契约表和状态矩阵。
- Figma UI Contract、系统态和 Prototype 的只读核对记录。
- 如使用 MCP，记录入口、操作、预期路由/数据和实际结果。
