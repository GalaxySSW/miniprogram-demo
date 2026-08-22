# Changelog

本文件记录用户可感知的功能变化；内部重构和每次会话记录放在对应 Spec、Verification 和 Git 提交中。

## Unreleased

- 建立 Spec、Plan、Tasks、QA 和跨会话状态文档结构。
- 增加 Pull Request 验收与 AI 辅助范围模板。

## 2026-08-23 — `bb582bf`

- 内联小猫脸头像组件，删除未被依赖分析识别的 `components/catface`，避免开发者工具因无引用文件导致启动失败。
- 将相关样式前缀统一移入全局样式。
