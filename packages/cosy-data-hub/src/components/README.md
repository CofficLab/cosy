# 组件说明

本目录包含了 SQLite 数据库管理工具的各个组件，每个组件都有特定的职责。

## 🚀 架构改进

### 使用 Astro Actions 替代 API 端点

我们使用了 Astro Actions 来处理服务器端逻辑，这比传统的 API 端点更加简洁和类型安全：

**优势：**

- ✅ **类型安全**: 自动生成的 TypeScript 类型
- ✅ **输入验证**: 使用 Zod 自动验证输入参数
- ✅ **错误处理**: 标准化的错误处理机制
- ✅ **简化调用**: 无需手动 `fetch()` 和 JSON 解析
- ✅ **开发体验**: 更好的 IDE 支持和调试体验

## 组件列表

### 1. Layout.astro

- **职责**: 页面布局组件
- **功能**: 提供统一的页面结构，包含头部、标题和内容区域
- **使用**: 作为其他页面的包装器

### 2. ConnectionConfig.astro

- **职责**: 数据库连接配置组件
- **功能**:
  - 提供数据库文件路径输入
  - 使用 `actions.testConnection` 测试数据库连接
  - 使用 `actions.connectToDatabase` 建立数据库连接
  - 显示连接状态
- **事件**: 连接成功时触发 `database-connected` 事件
- **Actions**:
  - `testConnection`: 测试数据库连接
  - `connectToDatabase`: 建立数据库连接

### 3. TablesList.astro

- **职责**: 数据表列表组件
- **功能**:
  - 使用 `actions.getTables` 获取数据库中的所有表
  - 显示每个表的基本信息（行数、列数）
  - 提供查看表数据的按钮
- **事件**:
  - 监听 `database-connected` 事件来加载表列表
  - 点击查看按钮时触发 `view-table` 事件
- **Actions**:
  - `getTables`: 获取表列表

### 4. TableData.astro

- **职责**: 表数据显示组件
- **功能**:
  - 使用 `actions.getTableData` 获取选中表的数据
  - 以表格形式展示数据
  - 支持大数据量的分页显示
- **事件**: 监听 `view-table` 事件来显示表数据
- **Actions**:
  - `getTableData`: 获取表数据

### 5. SqlQuery.astro

- **职责**: SQL 查询组件
- **功能**:
  - 提供 SQL 查询输入框
  - 使用 `actions.executeQuery` 执行 SQL 查询
  - 显示查询结果
  - 显示执行时间和行数统计
- **事件**: 监听 `database-connected` 事件来更新连接状态
- **Actions**:
  - `executeQuery`: 执行 SQL 查询

## Actions 定义

### src/actions/index.ts

我们定义了以下 Actions 来处理数据库操作：

```typescript
export const server = {
  // 测试数据库连接
  testConnection: defineAction({
    input: z.object({
      type: z.literal('sqlite'),
      filename: z.string(),
    }),
    handler: async (input) => {
      /* ... */
    },
  }),

  // 连接数据库
  connectToDatabase: defineAction({
    input: z.object({
      type: z.literal('sqlite'),
      filename: z.string(),
    }),
    handler: async (input) => {
      /* ... */
    },
  }),

  // 获取表列表
  getTables: defineAction({
    input: z.object({}),
    handler: async () => {
      /* ... */
    },
  }),

  // 执行SQL查询
  executeQuery: defineAction({
    input: z.object({
      sql: z.string(),
    }),
    handler: async (input) => {
      /* ... */
    },
  }),

  // 获取表数据
  getTableData: defineAction({
    input: z.object({
      tableName: z.string(),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(50),
    }),
    handler: async (input) => {
      /* ... */
    },
  }),
};
```

## 工具函数

### scripts/utils.ts

- `showStatus()`: 显示状态消息的工具函数
- `StatusType`: 状态类型定义

## 组件间通信

组件之间通过自定义事件进行通信：

1. **ConnectionConfig** → **TablesList**: `database-connected` 事件
2. **ConnectionConfig** → **SqlQuery**: `database-connected` 事件
3. **TablesList** → **TableData**: `view-table` 事件

这种设计使得组件之间松耦合，便于维护和扩展。

## 配置要求

### astro.config.mjs

为了使用 Astro Actions，需要在配置中启用服务器渲染：

```javascript
export default defineConfig({
  output: 'server',
  // ... 其他配置
});
```

## 使用示例

### 在组件中调用 Actions

```typescript
// 在客户端脚本中
const { actions } = await import('astro:actions');

// 测试连接
const result = await actions.testConnection({
  type: 'sqlite',
  filename: './database.db',
});

if (result.data?.success) {
  console.log('连接成功!');
} else {
  console.error('连接失败:', result.data?.error);
}
```

### 完整页面示例

```astro
---
import Layout from '../components/Layout.astro';
import {
  ConnectionConfig,
  TablesList,
  TableData,
  SqlQuery
} from '../components/index.ts';
---

<Layout title="数据库管理">
  <ConnectionConfig />
  <TablesList />
  <TableData />
  <SqlQuery />
</Layout>
```

## 开发和调试

### 启动开发服务器

```bash
pnpm dev
```

### 测试 Actions

Actions 可以通过 HTTP 端点直接测试：

```bash
# 测试连接
curl -X POST http://localhost:4321/_actions/testConnection \
  -H "Content-Type: application/json" \
  -d '{"type":"sqlite","filename":"./test.db"}'

# 获取表列表
curl -X POST http://localhost:4321/_actions/getTables \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 迁移说明

### 从 API 端点迁移到 Actions

**之前 (API 端点):**

```javascript
const response = await fetch('/api/test-connection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'sqlite', filename }),
});
const result = await response.json();
```

**现在 (Actions):**

```javascript
const { actions } = await import('astro:actions');
const result = await actions.testConnection({
  type: 'sqlite',
  filename,
});
```

这种方式更加简洁，并且提供了完整的类型安全和错误处理。
