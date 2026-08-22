# 实施计划：关系首页与案件回访入口

本计划对应功能规格：

- [产品 Spec](../../specs/active/2026-08-23-home-entry-experience/spec.md)
- [技术 Plan](../../specs/active/2026-08-23-home-entry-experience/plan.md)
- [设计方案](../../specs/active/2026-08-23-home-entry-experience/design.md)
- [任务清单](../../specs/active/2026-08-23-home-entry-experience/tasks.md)

## 实施顺序

1. 冻结 19 页页面契约、案件状态、权限和隐私枚举。
2. 建立 P0 公共组件和 CatJudge 契约。
3. 实现 Home 三态和任务优先级。
4. 改造卷宗列表和状态路由。
5. 补齐系统态、失败恢复、安全干预和删除流程。
6. 同步 Figma UI Contract、Screens、Prototype 和 Handoff。
7. 完成静态检查、Mock、微信开发者工具和双设备验证。

## 预期提交边界

- 仅修改小程序入口、卷宗、公共状态组件、CatJudge、路由工具和相关文档。
- 首轮不修改 AI、云数据库结构、支付、发布配置或真实用户数据。
- 首轮不新增独立 Landing Page 或 P0 案件详情路由。
- 每一阶段应有独立的静态检查和可回退结果。

## 当前状态

- 产品、技术、设计三层方案：已完成并已根据只读评审更新。
- Figma 品牌基础：已有；UI Contract、Screens、System States、Prototype、Handoff：待执行。
- 代码实现：未开始。
- 微信开发者工具验证：待执行。
- 双设备和真实云端验证：待执行。
