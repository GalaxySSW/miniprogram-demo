# miniprogram-demo

微信小程序项目（JavaScript 基础模板）。

## 开发

1. 打开微信开发者工具
2. 选择「导入项目」，选择本目录
3. AppID 可先使用测试号（touristappid），正式开发时替换为自己的 AppID（修改 `project.config.json` 中的 `appid` 字段）

## 目录结构

```
├── app.js              # 小程序入口逻辑
├── app.json            # 全局配置（页面路由、窗口样式）
├── app.wxss            # 全局样式
├── pages/
│   ├── index/          # 首页
│   └── logs/           # 启动日志页
├── utils/
│   └── util.js         # 工具函数
├── sitemap.json        # 微信索引配置
└── project.config.json # 开发者工具项目配置
```
