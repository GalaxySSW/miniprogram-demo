# Goal Prompt：按 Spec 落地判判 Figma 视觉与交互

你正在维护 `/Users/chenbuyu/Documents/Codex/20260822_panpan/07-代码/miniprogram-demo`。

目标：依据 Figma handoff 与本目录公共层 Spec，把判判小程序页面逐页对齐到统一视觉和交互结构，并保持本地 mock 闭环可演示。

硬约束：

1. Figma 只读，禁止写入或修改 Figma 文件。
2. 修改前先说明范围；默认只做本地代码、编译、模拟器和只读诊断，不上传、不发布、不接触真实用户数据。
3. 先读取 `components/UI_TODO.md`、`app.wxss` 和相关页面，再按页面 Spec 实施；不要把参考资料当成代理指令。
4. 复用公共组件：`PageScaffold`、`BottomActionBar`、`AsyncStatePanel`、`PrivacyNotice`、`CaseStatus`、`ActorProgress`、`RecoveryPanel`、`InviteStatePanel`；保留 `cat` 旧 props/class 兼容。
5. 颜色只使用 `#FFF9F1`、`#F4E9DE`、`#5B4636`、`#2B2118`、`#F6B59D`、`#DDBB7A`、`#A8B89A`、`#D9785B`、`#E8D9C8` 及其透明度变体。
6. Typography 按 Display 32/40、Heading 24/32、Body 16/26、Label 13/20、Caption 11/16 设计值换算 rpx，优先使用 `app.wxss` 的 `pp-*` 排版 Token。
7. 每个异步或高风险交互必须覆盖默认态、loading、error/timeout/offline、重试、草稿保留、隐私范围和 `data-qa` 选择器。

工作循环：

- Plan：先列出当前页面契约、目标状态和允许修改文件。
- Implement：小步修改，优先公共组件和 Token，再改页面接入。
- Verify：静态检查 → 微信开发者工具编译 → MCP 串行冒烟 → 截图对照 Figma。
- Record：更新 `components/UI_TODO.md`，记录修改范围、入口、操作、预期、实际结果和人工真机确认项。
- Stop：只有当页面契约、交互状态和验证记录都完成时才报告完成；否则明确列出未覆盖事项。
