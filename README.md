# 爱情判官

情侣吵架后，AI「猫猫判官」先接住当事人的情绪；双方在各自的空间里被听见后开庭，输出一份共同可见的判决书——不判人对错，只判「误会」有罪。

微信小程序 · 黑客松 MVP。UI 遵循「线稿猫 · 奶油纸 · 平面无衬线」设计规范（UI v2）。

交互 Deck：<https://galaxyssw.github.io/panpan/deck/>（单文件自包含，也可直接下载 [deck/index.html](deck/index.html) 本地打开）

## 当前状态

- ✅ 19 个页面已注册，主流程可用本地 mock 数据演示：
  首页 → 呈上证据 → 引导陈述 → 受理确认 → 先回一句 → 传票预览 → 发出传票 →（TA 视角）应诉 → 应诉陈述 → 开庭动画 → 判决书 → 约定/递石子 → 卷宗 / 我的
- ⏳ 云函数、云数据库和 DeepSeek API 已有接入骨架，仍需 staging、真机、双账号和安全验收
- ⏳ 真实 AI、隐私销毁、案件级鉴权和双设备判决流程不能以本地 mock 通过代替

## 开发

微信开发者工具「导入项目」选择本目录，AppID 可先用测试号。

Codex 联调和 `weapp-agent-mcp` 的连接、验证、故障排查与安全边界，见工作区文档 [微信开发者工具与 Codex 联调工作流](../../06-进度记录/微信开发者工具与Codex联调工作流.md)；本目录的 Codex 规则见 [AGENTS.md](AGENTS.md)。

开发迭代的 Spec、Plan、Tasks、验证记录和当前状态见：

- [当前状态](docs/status.md)
- [产品契约](docs/product.md)
- [功能规格](docs/specs/README.md)
- [验证记录](docs/qa/README.md)

## 目录结构

```
├── app.js                 # 全局 mock 数据（案件状态机、判决书样例、话术）
├── app.wxss               # UI v2 设计规范：奶油纸 #FAF7F2 / 墨黑 #1A1918 / 陶土 #C9573F / 蜜色 #B0793F
├── components/cat/        # 线稿猫猫判官（纯 CSS，mood: calm/happy/sleep）
└── pages/
    ├── home/              # 01 首页：我要立案 / 我收到了传票 / 金句跑马灯
    ├── evidence/          # 02 呈上证据：截图 ≤9 张，可跳过
    ├── statement/         # 03 引导式陈述：3 个小问题 + 再补一句
    ├── accept/            # 04 受理确认:案号 + 落章动画，分叉「先回一句」
    ├── reply/             # 05 先回一句：低风险话术，复制即用
    ├── preview/           # 06 传票预览：TA 能看到 / 看不到什么
    ├── share/             # 07 发出传票：onShareAppMessage + 演示切视角
    ├── respond/           # 08 对方应诉：三条承诺 + 体面退出口
    ├── their-statement/   # 09 应诉陈述：开放问题 + 情绪标签
    ├── interview/         # 10 背对背问话：多轮追问
    ├── trial/             # 11 开庭动画：三步打勾，覆盖 AI 生成耗时
    ├── verdict/           # 12 判决书：案情还原/证词翻译/判决/和解执行令
    ├── waiting/            # 13 等待进度：轮询与站内提醒
    ├── poster/             # 14 判决长图：脱敏分享
    ├── pact/               # 15 本庭约定（三选一）
    ├── pebble/             # 16 情侣石子：关系维度互动
    ├── history/            # 17 卷宗：案件历史与销毁提示
    ├── review/             # 18 复盘：用户自选回顾与重审
    └── profile/            # 19 我的：情侣关系与个人入口
```

## 页面导航说明

流程中段使用 `redirectTo` 而非 `navigateTo`，避免超出小程序 10 层页面栈上限。
