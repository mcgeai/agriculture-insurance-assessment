# 农业保险IT员工通用胜任力综合测评网站 — 技术方案

## 1. 系统架构

### 1.1 整体架构

采用前后端分离的B/S架构：

```
┌─────────────┐     HTTP/HTTPS     ┌──────────────┐     SQL     ┌─────────┐
│   Browser   │ ◄──────────────► │  Express API  │ ◄────────► │ SQLite  │
│  React SPA  │    JSON/JWT       │  (Node.js)   │             │  (.db)  │
└─────────────┘                    └──────────────┘             └─────────┘
```

### 1.2 分层架构

**前端（React SPA）**

```
src/
├── components/          # 通用组件
│   ├── Layout/          # 布局组件（Header/Sidebar/Footer）
│   └── Charts/          # ECharts封装组件（RadarChart/BarChart/PieChart）
├── pages/
│   ├── Login/           # 登录页
│   ├── Home/            # 测评首页
│   ├── Quiz/            # 答题页
│   ├── Report/          # 测评报告页
│   ├── History/         # 历史记录页
│   └── Admin/           # 管理员后台
│       ├── QuestionManage/   # 题目管理
│       ├── DataOverview/     # 数据总览
│       ├── EmployeeDetail/   # 员工明细
│       └── AccountManage/    # 账号管理
├── services/            # API调用层
├── stores/              # 状态管理（Zustand）
├── utils/               # 工具函数（JWT解析、权限校验等）
├── types/               # TypeScript类型定义
└── App.tsx
```

**后端（Express）**

```
server/
├── src/
│   ├── config/          # 配置（JWT密钥、数据库路径等）
│   ├── middleware/       # 中间件（auth、errorHandler、rateLimit）
│   ├── routes/          # 路由定义
│   │   ├── auth.ts
│   │   ├── quiz.ts
│   │   ├── assessment.ts
│   │   └── admin.ts
│   ├── controllers/     # 控制器
│   ├── services/        # 业务逻辑
│   ├── models/          # 数据访问层（better-sqlite3）
│   └── utils/           # 工具函数
├── database/
│   ├── init.sql         # 建表脚本
│   └── seed.sql         # 初始数据（默认题目、管理员账号）
└── app.ts
```

---

## 2. 技术栈详细说明

### 2.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI框架 |
| TypeScript | 5.x | 类型安全 |
| Ant Design | 5.x | UI组件库 |
| ECharts | 5.x | 图表（雷达图、柱状图、饼图） |
| echarts-for-react | 3.x | ECharts React封装 |
| Zustand | 4.x | 轻量状态管理 |
| Axios | 1.x | HTTP客户端 |
| React Router | 6.x | 前端路由 |
| dayjs | 1.x | 日期处理 |
| xlsx | 0.18.x | Excel导出 |

### 2.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20.x LTS | 运行时 |
| Express | 4.x | Web框架 |
| TypeScript | 5.x | 类型安全 |
| better-sqlite3 | 11.x | SQLite驱动（同步API，性能优） |
| bcryptjs | 2.x | 密码加密 |
| jsonwebtoken | 9.x | JWT签发与验证 |
| express-rate-limit | 7.x | 接口限流 |
| cors | 2.x | 跨域支持 |
| helmet | 7.x | 安全头设置 |
| celebrate / Joi | 1.x | 请求参数校验 |

### 2.3 开发与构建工具

| 工具 | 用途 |
|------|------|
| Vite | 前端构建 |
| tsx | 后端TypeScript执行 |
| ESLint + Prettier | 代码规范 |
| concurrently | 前后端并发启动 |

---

## 3. 数据库设计

### 3.1 ER图

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│   User   │ 1───N │  Assessment  │ 1───N │  Answer  │
└──────────┘       └──────────────┘       └──────────┘
                         │ 1
                         │
                         │ 4
                         ▼
                  ┌────────────────┐
                  │ DimensionScore │
                  └────────────────┘

┌──────────┐       ┌──────────┐
│ Question │ 1───N │  Answer  │
└──────────┘       └──────────┘
```

### 3.2 表结构

#### users（用户表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTOINCREMENT | 主键 |
| employee_no | TEXT | UNIQUE, NOT NULL | 工号 |
| name | TEXT | NOT NULL | 姓名 |
| department | TEXT | NOT NULL | 部门 |
| password_hash | TEXT | NOT NULL | bcrypt加密后的密码 |
| role | TEXT | NOT NULL, DEFAULT 'employee' | 角色：employee / admin |
| must_change_pwd | INTEGER | NOT NULL, DEFAULT 1 | 是否需要修改密码 |
| failed_login_count | INTEGER | NOT NULL, DEFAULT 0 | 连续登录失败次数 |
| locked_until | TEXT | NULL | 锁定截止时间 |
| status | TEXT | NOT NULL, DEFAULT 'active' | 状态：active / disabled |
| created_at | TEXT | NOT NULL | 创建时间 |
| updated_at | TEXT | NOT NULL | 更新时间 |

#### questions（题目表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTOINCREMENT | 主键 |
| dimension | TEXT | NOT NULL | 维度：D1/D2/D3/D4 |
| content | TEXT | NOT NULL | 题干 |
| option_a | TEXT | NOT NULL | 选项A |
| option_b | TEXT | NOT NULL | 选项B |
| option_c | TEXT | NOT NULL | 选项C |
| option_d | TEXT | NOT NULL | 选项D |
| correct_answer | TEXT | NOT NULL | 正确答案：A/B/C/D |
| is_active | INTEGER | NOT NULL, DEFAULT 1 | 是否启用 |
| created_at | TEXT | NOT NULL | 创建时间 |
| updated_at | TEXT | NOT NULL | 更新时间 |

#### assessments（测评记录表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTOINCREMENT | 主键 |
| user_id | INTEGER | FK → users.id, NOT NULL | 用户ID |
| total_score | INTEGER | NOT NULL | 总分（百分制） |
| rating | TEXT | NOT NULL | 评级：A/B/C/D |
| started_at | TEXT | NOT NULL | 开始时间 |
| submitted_at | TEXT | NOT NULL | 提交时间 |

#### answers（答题明细表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTOINCREMENT | 主键 |
| assessment_id | INTEGER | FK → assessments.id, NOT NULL | 测评ID |
| question_id | INTEGER | FK → questions.id, NOT NULL | 题目ID |
| selected_answer | TEXT | NOT NULL | 所选答案 |
| is_correct | INTEGER | NOT NULL | 是否正确（0/1） |

#### dimension_scores（维度得分表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTOINCREMENT | 主键 |
| assessment_id | INTEGER | FK → assessments.id, NOT NULL | 测评ID |
| dimension | TEXT | NOT NULL | 维度：D1/D2/D3/D4 |
| score | INTEGER | NOT NULL | 该维度得分（百分制） |
| correct_count | INTEGER | NOT NULL | 答对题数 |

### 3.3 索引

```sql
CREATE UNIQUE INDEX idx_users_employee_no ON users(employee_no);
CREATE INDEX idx_questions_dimension ON questions(dimension);
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_answers_assessment_id ON answers(assessment_id);
CREATE INDEX idx_dimension_scores_assessment_id ON dimension_scores(assessment_id);
```

---

## 4. API设计

### 4.1 认证相关

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/auth/login | 登录 | 公开 |
| PUT | /api/auth/password | 修改密码 | 已登录 |

**POST /api/auth/login**

```
Request:
{
  "employee_no": "100001",
  "password": "Abc12345"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "must_change_pwd": true,
  "user": {
    "id": 1,
    "employee_no": "100001",
    "name": "张三",
    "department": "IT部",
    "role": "employee"
  }
}
```

**PUT /api/auth/password**

```
Request:
{
  "old_password": "Abc12345",
  "new_password": "Xyz67890"
}

Response 200:
{
  "message": "密码修改成功"
}
```

### 4.2 测评相关

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/quiz/questions | 获取测评题目（每个维度随机5题） | employee |
| POST | /api/quiz/submit | 提交测评答案 | employee |
| GET | /api/assessments | 获取当前用户测评历史 | employee |
| GET | /api/assessments/:id | 获取单次测评详情（含维度得分和答题明细） | employee（仅自己的） |

**GET /api/quiz/questions**

```
Response 200:
{
  "assessment_id": 15,
  "time_limit": 3600,
  "questions": [
    {
      "id": 3,
      "dimension": "D1",
      "content": "政策性农业保险的保费构成中，中央财政补贴比例一般为？",
      "option_a": "10%-20%",
      "option_b": "25%-35%",
      "option_c": "35%-45%",
      "option_d": "50%-60%"
    },
    // ... 共20题
  ]
}
```

**POST /api/quiz/submit**

```
Request:
{
  "assessment_id": 15,
  "answers": {
    "3": "B",
    "7": "A",
    // ... 共20条
  }
}

Response 200:
{
  "assessment_id": 15,
  "total_score": 75,
  "rating": "B",
  "dimension_scores": {
    "D1": { "score": 80, "correct_count": 4 },
    "D2": { "score": 60, "correct_count": 3 },
    "D3": { "score": 80, "correct_count": 4 },
    "D4": { "score": 80, "correct_count": 4 }
  }
}
```

### 4.3 报告相关

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/assessments/:id/report | 获取完整测评报告 | employee（仅自己的） |

**GET /api/assessments/:id/report**

```
Response 200:
{
  "user": { "name": "张三", "employee_no": "100001", "department": "IT部" },
  "assessment": {
    "id": 15,
    "total_score": 75,
    "rating": "B",
    "started_at": "2026-04-26T10:00:00",
    "submitted_at": "2026-04-26T10:35:00"
  },
  "dimension_scores": [
    {
      "dimension": "D1",
      "label": "农业保险专业知识",
      "score": 80,
      "correct_count": 4,
      "total_count": 5,
      "rating": "B",
      "suggestion": "建议参加农险业务培训..."
    },
    // ... D2, D3, D4
  ],
  "answers": [
    {
      "question_id": 3,
      "dimension": "D1",
      "content": "...",
      "selected_answer": "B",
      "correct_answer": "B",
      "is_correct": true
    },
    // ...
  ]
}
```

### 4.4 管理员接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/admin/questions | 题目列表（支持维度筛选、分页） | admin |
| POST | /api/admin/questions | 新增题目 | admin |
| PUT | /api/admin/questions/:id | 编辑题目 | admin |
| DELETE | /api/admin/questions/:id | 删除题目 | admin |
| PATCH | /api/admin/questions/:id/status | 启用/停用题目 | admin |
| GET | /api/admin/overview | 测评数据总览 | admin |
| GET | /api/admin/employees | 员工测评明细列表 | admin |
| GET | /api/admin/employees/:id/assessments | 查看某员工测评历史 | admin |
| GET | /api/admin/export | 导出测评数据Excel | admin |
| POST | /api/admin/users | 新增员工账号 | admin |
| PUT | /api/admin/users/:id | 编辑员工信息 | admin |
| PATCH | /api/admin/users/:id/status | 启用/停用账号 | admin |
| POST | /api/admin/users/:id/reset-password | 重置密码 | admin |

**GET /api/admin/overview**

```
Response 200:
{
  "total_participants": 42,
  "avg_score": 72.5,
  "max_score": 95,
  "min_score": 40,
  "rating_distribution": {
    "A": 5, "B": 18, "C": 14, "D": 5
  },
  "dimension_avg": {
    "D1": 68, "D2": 75, "D3": 70, "D4": 77
  }
}
```

### 4.5 通用响应格式

```
成功：
{ "data": {...}, "message": "操作成功" }

分页：
{ "data": [...], "pagination": { "page": 1, "page_size": 20, "total": 100 } }

错误：
{ "error": { "code": "AUTH_FAILED", "message": "工号或密码错误" } }
```

### 4.6 错误码

| HTTP状态码 | 错误码 | 说明 |
|-----------|--------|------|
| 400 | VALIDATION_ERROR | 请求参数校验失败 |
| 401 | AUTH_FAILED | 认证失败 |
| 401 | TOKEN_EXPIRED | Token过期 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | ACCOUNT_LOCKED | 账户已锁定 |
| 429 | RATE_LIMITED | 请求过于频繁 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

---

## 5. 前端路由设计

| 路径 | 页面 | 权限 |
|------|------|------|
| /login | 登录 | 公开 |
| /home | 测评首页 | employee |
| /quiz | 答题页 | employee |
| /report/:id | 测评报告 | employee |
| /history | 历史记录 | employee |
| /admin/questions | 题目管理 | admin |
| /admin/overview | 数据总览 | admin |
| /admin/employees | 员工明细 | admin |
| /admin/accounts | 账号管理 | admin |

路由守卫逻辑：
1. 未登录 → 重定向至 /login
2. 首次登录（must_change_pwd=true）→ 强制跳转修改密码页
3. employee角色访问 /admin/* → 403页面
4. admin角色访问 /quiz → 重定向至 /admin/overview

---

## 6. 核心业务逻辑

### 6.1 测评流程

```
用户点击"开始测评"
        │
        ▼
后端创建Assessment记录（status=ongoing, started_at=now）
从每个维度随机抽5道is_active=1的题目，共20题
返回题目列表（不含correct_answer）+ assessment_id
        │
        ▼
前端答题（逐题选择，本地缓存答案，避免刷新丢失）
        │
        ▼
用户点击"提交" / 超时自动提交
        │
        ▼
后端校验：assessment_id有效 + 属于当前用户 + 未提交过
批量对比答案，计算得分
写入answers、dimension_scores、更新assessment
返回评分结果
```

### 6.2 评分算法

```typescript
function calculateScore(correctCount: number, totalCount: number): number {
  return Math.round((correctCount / totalCount) * 100);
}

function getRating(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}
```

### 6.3 抽题算法

```typescript
function selectQuestions(db: Database): Question[] {
  const dimensions: Dimension[] = ['D1', 'D2', 'D3', 'D4'];
  const selected: Question[] = [];

  for (const dim of dimensions) {
    const pool = db.query(
      'SELECT * FROM questions WHERE dimension = ? AND is_active = 1 ORDER BY RANDOM() LIMIT 5',
      [dim]
    );
    selected.push(...pool);
  }

  // 打乱维度间题目顺序（可选，保持维度内顺序）
  return selected;
}
```

### 6.4 JWT Token设计

```typescript
// Payload
{
  "sub": 1,              // user.id
  "employee_no": "100001",
  "role": "employee",
  "iat": 1714108800,
  "exp": 1714116000      // 2小时后过期
}

// 刷新策略
// - Token过期返回401 + TOKEN_EXPIRED
// - 前端检测到TOKEN_EXPIRED后调用刷新接口（如有）或跳转登录页
// - 简化方案：不设刷新Token，过期后重新登录
```

---

## 7. 安全方案

### 7.1 认证与授权

- JWT签名密钥存储在环境变量中，不硬编码
- Token有效期2小时
- 中间件校验每个API请求的Token
- 管理员接口额外校验role=admin

### 7.2 密码安全

- bcrypt加密，salt rounds = 10
- 初始密码由管理员创建，首次登录强制修改
- 旧密码验证后才允许修改

### 7.3 输入安全

- 后端使用Joi校验所有输入参数
- SQL使用参数化查询（better-sqlite3的prepare/bind）
- 前端对用户输入做HTML转义
- Helmet中间件设置安全响应头

### 7.4 限流

- 登录接口：同一IP每分钟最多10次请求
- 普通接口：同一Token每分钟最多60次请求
- 使用express-rate-limit实现

### 7.5 测评防作弊

- 提交后不可修改
- 同一assessment_id只能提交一次
- 题目随机抽取，每次顺序不同

---

## 8. 项目配置

### 8.1 目录结构总览

```
agriculture-insurance-assessment/
├── client/                     # 前端项目
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                     # 后端项目
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   ├── database/
│   │   ├── init.sql
│   │   └── seed.sql
│   ├── tsconfig.json
│   └── package.json
├── docs/
│   ├── requirements.md
│   └── technical-solution.md
├── .gitignore
├── .env.example
└── README.md
```

### 8.2 环境变量

```env
# .env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=2h
DB_PATH=./database/assessment.db
BCRYPT_SALT_ROUNDS=10
LOGIN_RATE_LIMIT_MAX=10
LOGIN_RATE_LIMIT_WINDOW_MS=60000
```

### 8.3 启动脚本

```json
// 根目录 package.json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "cd client && npm run build",
    "init:db": "cd server && npm run init:db"
  }
}
```

---

## 9. 部署方案

### 9.1 单机部署（推荐，满足50并发）

```
┌─────────────────────────────────┐
│           Nginx (反向代理)        │
│  /api/* → localhost:3001        │
│  /*     → 静态文件 (client/dist) │
└─────────────────────────────────┘
        │
        ▼
┌──────────────────┐
│  Node.js Express │
│  (PM2 守护)      │
│  Port: 3001      │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  SQLite (.db)    │
│  + 每日备份脚本   │
└──────────────────┘
```

### 9.2 部署步骤

1. 构建前端：`cd client && npm run build`
2. 将 `client/dist` 部署至Nginx静态目录
3. 启动后端：`cd server && pm2 start npm --name "assessment-api" -- start`
4. 配置Nginx反向代理 `/api` 至 `localhost:3001`
5. 配置HTTPS证书
6. 设置crontab每日备份SQLite文件

### 9.3 备份脚本

```bash
#!/bin/bash
BACKUP_DIR="/data/backups/assessment"
DB_PATH="/path/to/server/database/assessment.db"
DATE=$(date +%Y%m%d)
cp "$DB_PATH" "$BACKUP_DIR/assessment_$DATE.db"
# 保留最近30天备份
find "$BACKUP_DIR" -name "assessment_*.db" -mtime +30 -delete
```

---

## 10. 测试策略

| 层级 | 工具 | 覆盖范围 |
|------|------|----------|
| 单元测试 | Vitest（前端）、Jest（后端） | 工具函数、评分算法、业务逻辑 |
| 集成测试 | Supertest（后端） | API接口全流程 |
| E2E测试 | Playwright | 关键用户路径（登录→答题→报告） |
| 安全测试 | 手动 + npm audit | OWASP Top 10 |

---

## 11. 开发里程碑

| 阶段 | 交付内容 |
|------|----------|
| P1 | 项目骨架搭建、数据库初始化、登录认证 |
| P2 | 答题模块、评分逻辑 |
| P3 | 测评报告（雷达图）、历史记录 |
| P4 | 管理员后台（题目管理、数据总览） |
| P5 | 管理员后台（员工明细、账号管理、Excel导出） |
| P6 | 安全加固、性能优化、部署上线 |
