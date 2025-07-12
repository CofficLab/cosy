# cosy-datahub

**Cosy DataHub** 是 [Cosy Framework](https://github.com/coffic/cosy) 的数据库 UI 扩展，基于 Astro + TailwindCSS，专注于 SQLite 数据库的可视化管理。

## ✨ 功能特性

- **数据库连接管理**：支持通过 UI 配置和测试 SQLite 数据库连接
- **表结构与数据浏览**：可视化查看所有表及其数据，支持分页
- **SQL 查询执行**：内置 SQL 编辑器，支持自定义查询与结果展示
- **类型安全的 Actions**：后端逻辑通过 Astro Actions 实现，类型安全、自动校验、标准化错误处理
- **现代前端架构**：基于 Astro 组件化开发，UI 体验现代美观

## 📦 安装与开发

```bash
pnpm install
pnpm dev
```

## 🏗️ 目录结构

```tree
src/
  actions/         # 所有数据库相关的 actions（已模块化拆分）
  components/      # UI 组件（连接配置、表列表、表数据、SQL 查询等）
  lib/database/    # 数据库管理与驱动
  pages/           # Astro 页面与 API
  scripts/         # 工具脚本
  styles/          # 全局样式
  types/           # 类型定义
```

## 🚀 主要 Actions

- `testConnection`：测试数据库连接
- `connectToDatabase`：建立数据库连接
- `getTables`：获取所有表
- `getTableData`：获取指定表的数据（支持分页）
- `executeQuery`：执行 SQL 查询

调用示例：

```ts
import { server as actions } from './actions';

// 测试连接
const result = await actions.testConnection({
  type: 'sqlite',
  filename: './test.db',
});
if (result.success) {
  // 连接成功
}
```

## 🧩 主要组件

- `ConnectionConfig.astro`：数据库连接配置与测试
- `TablesList.astro`：表列表展示
- `TableData.astro`：表数据分页浏览
- `SqlQuery.astro`：SQL 查询编辑与结果展示
- `Layout.astro`：页面布局

## 🛠️ 开发与调试

- 启动开发服务器：`pnpm dev`
- 构建生产包：`pnpm build`
- 清理构建产物：`pnpm clean`

### Actions HTTP 调用示例

```bash
curl -X POST http://localhost:4321/_actions/testConnection \
  -H "Content-Type: application/json" \
  -d '{"type":"sqlite","filename":"./test.db"}'
```

## 📝 配置说明

- 需在 `astro.config.mjs` 中启用 SSR：
  ```js
  export default defineConfig({
    output: 'server',
    // ... 其他配置
  });
  ```

## 📄 License

MIT

---

如需更详细的组件说明、二次开发指南，请参考 `src/components/README.md`。
