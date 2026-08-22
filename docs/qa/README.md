# QA 与验证记录

- `scenarios/`：可重复执行的短场景，只描述入口、操作、预期路由和预期数据。
- `runs/`：每次实际执行的结果，记录日期、分支、提交、环境和证据。

验证必须区分：

1. `Code implemented`：代码已写入。
2. `Static checked`：静态检查通过。
3. `Mock verified`：本地 mock、开发者工具或 MCP 场景通过。
4. `Real verified`：真机、双设备、云端或真实 AI 已专项验证。

不得把前一种状态写成后一种状态。
