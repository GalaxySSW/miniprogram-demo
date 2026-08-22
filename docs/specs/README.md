# 功能规格

每个正在开发的功能建立一个目录：

```text
docs/specs/active/<feature-id>/
├── spec.md
├── plan.md
├── tasks.md
├── context.md
└── verification.md
```

完成、取消或被替代后，整个目录移动到 `docs/specs/archive/`，不要删除历史规格。

## 命名建议

使用 `YYYY-MM-DD-简短功能名`，例如：

```text
2026-08-23-case-status-sync
```

## 规则

- `spec.md` 只描述用户行为、范围和验收，不提前假定技术实现。
- `plan.md` 描述代码影响和实现方案。
- `tasks.md` 是当前可执行任务的唯一清单。
- `context.md` 记录跨会话的决策、阻塞和下一步。
- `verification.md` 记录证据，不用“应该可以”替代实际结果。
- 所有日常功能迭代默认直接在 `rainno` 分支进行，不创建新的功能分支。
- Spec 目录用于隔离功能上下文，不等于需要建立 Git 分支。
- 只有用户明确要求隔离实验、并行开发或发布候选版本时，才讨论额外分支。
