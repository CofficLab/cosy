# 🗄️ Cosy Database UI Extension

[![npm version](https://badge.fury.io/js/@coffic%2Fcosy-db-ui.svg)](https://badge.fury.io/js/@coffic%2Fcosy-db-ui) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

这是 Cosy Framework 的数据库UI管理扩展包，提供了一个现代化、响应式的Web界面来管理数据库。

## ✨ 特性

### 🎯 核心功能

- **📊 数据浏览器** - 直观地查看、编辑和搜索数据库表数据
- **⚡ SQL查询器** - 内置SQL编辑器，支持查询执行和结果展示
- **🏗️ 架构管理** - 管理数据库表结构、索引和约束
- **📡 实时监控** - WebSocket实时数据更新和状态监控

### 🚀 技术特色

- **现代化UI** - 响应式设计，支持桌面和移动设备
- **RESTful API** - 完整的REST API支持
- **WebSocket通信** - 实时双向通信
- **健壮错误处理** - 完善的错误处理和用户反馈
- **安全连接** - 支持多种数据库连接类型
- **CORS支持** - 跨域资源共享支持

## 📦 安装

### 使用 pnpm (推荐)

```bash
pnpm add @coffic/cosy-db-ui
```

### 使用 npm

```bash
npm install @coffic/cosy-db-ui
```

### 使用 yarn

```bash
yarn add @coffic/cosy-db-ui
```

## 🚀 快速开始

安装扩展后，会自动在 `cosy` CLI 中注册 `db ui` 命令：

### 基本使用

```bash
# 启动数据库UI (默认端口3001)
pnpm cosy db ui

# 指定端口启动
pnpm cosy db ui -p 4000

# 绑定到所有网络接口
pnpm cosy db ui --host 0.0.0.0

# 启动但不自动打开浏览器
pnpm cosy db ui --no-open

# 启用调试模式
pnpm cosy db ui --debug
```

### 查看帮助

```bash
pnpm cosy db ui --help
```

## 🌐 Web界面

启动后可通过浏览器访问：

- **主界面**: `http://localhost:3001`
- **API状态**: `http://localhost:3001/api/status`
- **健康检查**: `http://localhost:3001/health`
- **WebSocket**: `ws://localhost:3001/ws`

## 🔗 API 端点

### 核心API

| 方法   | 端点                                    | 描述           |
| ------ | --------------------------------------- | -------------- |
| `GET`  | `/health`                               | 健康检查       |
| `GET`  | `/api/status`                           | 服务器状态信息 |
| `GET`  | `/api/databases`                        | 获取数据库列表 |
| `GET`  | `/api/databases/:db/tables`             | 获取表列表     |
| `GET`  | `/api/databases/:db/tables/:table/data` | 获取表数据     |
| `POST` | `/api/query`                            | 执行SQL查询    |
| `POST` | `/api/test-connection`                  | 测试数据库连接 |

### API示例

#### 获取服务器状态

```bash
curl http://localhost:3001/api/status
```

#### 执行SQL查询

```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM users LIMIT 10", "database": "test_db"}'
```

## 🔌 WebSocket API

### 连接

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
```

### 消息类型

```javascript
// Ping/Pong
ws.send(JSON.stringify({ type: 'ping' }));

// 订阅数据更新
ws.send(
  JSON.stringify({
    type: 'subscribe',
    topic: 'table:users',
  })
);

// 取消订阅
ws.send(
  JSON.stringify({
    type: 'unsubscribe',
    topic: 'table:users',
  })
);
```

## ⚙️ 配置选项

### 命令行选项

| 选项        | 短参数 | 默认值      | 描述             |
| ----------- | ------ | ----------- | ---------------- |
| `--port`    | `-p`   | `3001`      | 服务器端口       |
| `--host`    |        | `localhost` | 服务器主机       |
| `--no-open` |        | `false`     | 不自动打开浏览器 |
| `--debug`   |        | `false`     | 启用调试模式     |

### 扩展配置

在 `package.json` 中的扩展配置：

```json
{
  "cosy": {
    "type": "command",
    "commands": [
      {
        "name": "ui",
        "description": "Open database UI in browser",
        "configure": "dist/commands/ui-command.js"
      }
    ]
  }
}
```

## 🛠️ 开发

### 开发环境设置

```bash
# 克隆项目
git clone <repository-url>
cd cosy-db-ui

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck

# 测试
pnpm test
```

### 项目结构

```tree
packages/cosy-db-ui/
├── src/
│   ├── commands/          # 命令实现
│   │   └── ui-command.ts
│   ├── server/           # 服务器实现
│   │   └── DatabaseUIServer.ts
│   └── index.ts          # 入口文件
├── dist/                 # 构建输出
├── package.json
├── tsconfig.json
└── README.md
```

## 🎨 扩展开发示例

这个包展示了如何为 Cosy Framework 创建命令扩展的最佳实践：

### 1. package.json 配置

```json
{
  "keywords": ["cosy-extension", "cosy-framework"],
  "cosy": {
    "type": "command",
    "commands": [...]
  }
}
```

### 2. 命令配置函数

```typescript
export default function configureDbUICommand(program: Command): void {
  // 扩展现有的 db 命令
  const dbCommand = program.commands.find((cmd) => cmd.name() === 'db');

  dbCommand
    .command('ui')
    .description('Open database UI')
    .action(async (options) => {
      // 命令实现
    });
}
```

### 3. 健壮性设计

- ✅ 完整的错误处理
- ✅ 参数验证
- ✅ 优雅退出处理
- ✅ 详细的用户反馈
- ✅ 调试模式支持

## 🔧 故障排除

### 常见问题

#### 端口被占用

```bash
# 查看端口占用
lsof -i :3001

# 使用其他端口
pnpm cosy db ui -p 3002
```

#### 权限错误

```bash
# 使用高端口号 (>1024)
pnpm cosy db ui -p 3001

# 检查防火墙设置
```

#### 浏览器无法访问

```bash
# 检查服务器是否启动
curl http://localhost:3001/health

# 检查网络连接
ping localhost
```

### 调试模式

启用调试模式获取详细信息：

```bash
pnpm cosy db ui --debug
```

## 📋 版本要求

- **Node.js**: >= 18.0.0
- **Cosy Framework**: ^1.0.0
- **TypeScript**: ^5.0.0

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Express.js](https://expressjs.com/) - Web服务器框架
- [WebSocket](https://github.com/websockets/ws) - WebSocket实现
- [Commander.js](https://github.com/tj/commander.js/) - 命令行接口
- [Chalk](https://github.com/chalk/chalk) - 终端字符串样式
- [Ora](https://github.com/sindresorhus/ora) - 终端加载指示器

---

**由 [Cosy Framework](https://github.com/cofficlab/cosy) 强力驱动** 🚀
