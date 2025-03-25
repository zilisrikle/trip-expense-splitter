# 旅行AA计算器

一个美观实用的旅行费用分摊工具，帮助团队轻松管理和分配旅行支出。

## 主要功能

- 💰 多币种支持：支持人民币、美元、日元等多种货币
- 📊 实时数据统计：自动计算总支出、人均支出和待结算金额
- 📈 可视化图表：直观展示支出分布和趋势
- 👥 智能分摊：支持自定义分摊比例
- 💳 多种支付方式：支持现金、信用卡、支付宝、微信等
- 📱 响应式设计：完美适配电脑和手机

## 在线使用

访问：[https://trip-expense-splitter.vercel.app](https://trip-expense-splitter.vercel.app)

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 启动服务器：
```bash
npm start
```

3. 访问应用：
打开浏览器访问 http://localhost:3000

## 技术栈

- 前端：HTML5, CSS3 (Tailwind CSS), JavaScript
- 后端：Node.js, Express
- 图表：Chart.js
- 部署：Vercel

## 数据存储

目前使用本地文件存储，数据保存在 data 目录下：
- expenses.json：存储所有费用记录
- participants.json：存储所有参与者信息

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目。

## 许可证

MIT License
