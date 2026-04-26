# 农业保险IT员工通用胜任力综合测评系统

## 项目简介

为农业保险公司IT部门员工提供在线胜任力测评工具，涵盖4个维度（农业保险专业知识、系统操作能力、问题解决与沟通协调、合规与风险意识），共20道选择题，自动评分并生成雷达图测评报告。

## 技术栈

- **前端**：React 18 + TypeScript + Ant Design 5 + ECharts 5 + Zustand
- **后端**：Node.js 20 + Express 4 + TypeScript + better-sqlite3
- **认证**：JWT
- **数据库**：SQLite

## 快速开始

### 前置要求

- Node.js 20+

### 安装依赖

```bash
# 安装后端依赖
cd server && npm install

# 安装前端依赖
cd ../client && npm install
```

### 启动开发服务

```bash
# 后端（在 server 目录）
npm run dev

# 前端（在 client 目录）
npm run dev
```

- 前端访问：http://localhost:5173
- 后端 API：http://localhost:3001

### 默认管理员账号

- 工号：`000000`
- 密码：`Admin123`

> 注意：种子数据中的密码hash是示例值，首次运行后需通过数据库初始化脚本生成正确的hash。

## 项目结构

```
├── client/                  # 前端 React 项目
│   ├── src/
│   │   ├── components/      # 通用组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API 调用层
│   │   ├── stores/          # 状态管理
│   │   └── types/           # 类型定义
│   └── ...
├── server/                  # 后端 Express 项目
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/      # 中间件
│   │   ├── models/          # 数据访问层
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务逻辑
│   │   └── config/          # 配置
│   ├── database/            # SQL 脚本
│   └── ...
└── docs/                    # 文档
    ├── requirements.md
    └── technical-solution.md
```
