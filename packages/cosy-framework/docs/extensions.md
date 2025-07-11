# Cosy Framework 扩展系统

Cosy Framework 的扩展系统借鉴了 Laravel 的包发现机制，允许开发者通过安装 npm 包来扩展框架功能。

## 🎯 设计理念

扩展系统遵循以下设计原则：

1. **约定优于配置** - 通过标准化的配置格式自动发现扩展
2. **无侵入性** - 扩展不需要修改核心框架代码
3. **类型安全** - 完整的 TypeScript 支持
4. **防御性编程** - 扩展加载失败不会影响核心功能

## 📦 扩展类型

目前支持两种类型的扩展：

### 1. 命令扩展 (Command Extensions)

为 CLI 添加新命令的扩展。

```json
{
  "cosy": {
    "type": "command",
    "commands": [
      {
        "name": "ui",
        "description": "Open database UI",
        "configure": "dist/commands/ui-command.js"
      }
    ]
  }
}
```

### 2. 服务扩展 (Service Extensions)

添加新服务提供者的扩展。

```json
{
  "cosy": {
    "type": "service",
    "providers": ["dist/providers/MyServiceProvider.js"]
  }
}
```

## 🛠️ 创建扩展

### 第一步：初始化包

```bash
mkdir my-cosy-extension
cd my-cosy-extension
pnpm init
```

### 第二步：配置 package.json

```json
{
  "name": "@yourorg/cosy-my-extension",
  "version": "1.0.0",
  "keywords": ["cosy-extension", "cosy-framework"],
  "cosy": {
    "type": "command",
    "commands": [
      {
        "name": "my-command",
        "description": "My custom command",
        "configure": "dist/commands/my-command.js"
      }
    ]
  },
  "dependencies": {
    "@coffic/cosy-framework": "^1.0.0"
  }
}
```

### 第三步：实现命令配置函数

```typescript
// src/commands/my-command.ts
import { Command } from 'commander';

export default function configureMyCommand(program: Command): void {
  program
    .command('my-command')
    .description('My custom command')
    .option('-f, --flag', 'example flag')
    .action(async (options) => {
      console.log('执行自定义命令!', options);
    });
}
```

### 第四步：构建和发布

```bash
# 构建
pnpm build

# 发布到 npm (可选)
pnpm publish
```

## 🔍 扩展发现机制

框架使用以下策略发现扩展：

1. **包标识** - 检查 `keywords` 中是否包含 `cosy-extension`
2. **配置检查** - 验证 `package.json` 中的 `cosy` 配置
3. **类型验证** - 确保扩展类型为支持的类型

## 🚀 扩展加载流程

```bash
启动 CLI
    ↓
扫描 node_modules
    ↓
发现扩展包
    ↓
验证扩展配置
    ↓
加载扩展
    ↓
注册命令/服务
    ↓
执行用户命令
```

## 📝 扩展示例

### 数据库UI扩展

我们提供了一个完整的数据库UI扩展示例：

```bash
# 安装扩展
pnpm add @coffic/cosy-db-ui

# 使用扩展命令
pnpm cosy db ui
```

该扩展展示了：

- 如何扩展现有命令 (`db` 命令)
- 如何创建 Web 服务器
- 如何处理命令选项和参数
- 如何提供优雅的错误处理

## 🔧 高级功能

### 命令组合

扩展可以向现有命令添加子命令：

```typescript
export default function configureCommand(program: Command): void {
  // 查找现有的命令组
  const existingCommand = program.commands.find((cmd) => cmd.name() === 'db');

  if (existingCommand) {
    // 添加子命令到现有命令
    existingCommand
      .command('backup')
      .description('Backup database')
      .action(() => {
        // 实现备份逻辑
      });
  }
}
```

### 扩展验证

框架会验证扩展的完整性：

- 配置文件是否存在
- 命令配置函数是否可调用
- 依赖关系是否满足

### 错误处理

扩展加载失败不会影响核心功能：

```typescript
try {
  await extensionManager.loadAllExtensions();
} catch (error) {
  // 记录错误但继续执行
  console.warn('扩展加载失败:', error);
}
```

## 🏗️ 架构组件

### ExtensionManager

核心扩展管理器，负责：

- 发现扩展包
- 加载和验证扩展
- 注册扩展功能

### ExtensionServiceProvider

将扩展管理器注册到依赖注入容器。

### IExtensionManager

扩展管理器的接口契约。

## 🎨 最佳实践

1. **命名约定** - 使用描述性的包名，如 `@yourorg/cosy-feature-name`
2. **关键词标识** - 始终包含 `cosy-extension` 关键词
3. **版本管理** - 遵循语义化版本
4. **文档** - 提供清晰的 README 和使用示例
5. **错误处理** - 实现优雅的错误处理和用户反馈
6. **测试** - 为扩展编写单元测试

## 🚦 开发调试

启用调试模式查看扩展加载过程：

```bash
DEBUG=true pnpm cosy --debug
```

或者：

```bash
pnpm cosy --debug your-command
```

## 🔮 未来计划

- **插件扩展** - 支持 Electron 渲染进程插件
- **主题扩展** - 自定义 UI 主题
- **中间件扩展** - 自定义中间件注册
- **配置扩展** - 扩展配置系统

---

通过扩展系统，开发者可以轻松为 Cosy Framework 添加新功能，而无需修改核心代码，实现了真正的可扩展架构。
