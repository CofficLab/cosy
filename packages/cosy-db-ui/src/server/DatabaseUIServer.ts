import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DatabaseUIServerConfig {
  /** 服务器端口 */
  port: number;
  /** 服务器主机 */
  host: string;
  /** 是否自动打开浏览器 */
  autoOpen: boolean;
  /** 是否启用调试模式 */
  debug?: boolean;
}

/**
 * 数据库UI服务器
 * 提供现代化的Web界面用于数据库管理
 */
export class DatabaseUIServer {
  private app: Express;
  private server?: Server;
  private wss?: WebSocketServer;
  private config: DatabaseUIServerConfig;
  private isRunning = false;

  constructor(config: DatabaseUIServerConfig) {
    this.config = {
      debug: false,
      ...config,
    };
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('服务器已经在运行中');
    }

    return new Promise((resolve, reject) => {
      try {
        this.server = createServer(this.app);

        // 设置WebSocket服务器
        this.wss = new WebSocketServer({
          server: this.server,
          path: '/ws',
        });
        this.setupWebSocket();

        // 监听端口
        this.server.listen(this.config.port, this.config.host, () => {
          this.isRunning = true;

          if (this.config.debug) {
            console.log(`🗄️ 数据库UI服务器启动成功`);
            console.log(
              `   地址: http://${this.config.host}:${this.config.port}`
            );
            console.log(
              `   WebSocket: ws://${this.config.host}:${this.config.port}/ws`
            );
          }

          if (this.config.autoOpen) {
            this.openBrowser().catch((error) => {
              if (this.config.debug) {
                console.warn('无法自动打开浏览器:', error.message);
              }
            });
          }

          resolve();
        });

        // 监听错误
        this.server.on('error', (error: any) => {
          this.isRunning = false;

          if (error.code === 'EADDRINUSE') {
            reject(
              new Error(`端口 ${this.config.port} 已被占用，请尝试其他端口`)
            );
          } else if (error.code === 'EACCES') {
            reject(new Error(`没有权限绑定到端口 ${this.config.port}`));
          } else {
            reject(error);
          }
        });
      } catch (error) {
        this.isRunning = false;
        reject(error);
      }
    });
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        this.isRunning = false;
        if (this.config.debug) {
          console.log('🔴 数据库UI服务器已停止');
        }
      };

      // 关闭WebSocket服务器
      if (this.wss) {
        this.wss.close(() => {
          if (this.config.debug) {
            console.log('WebSocket服务器已关闭');
          }
        });
      }

      // 关闭HTTP服务器
      if (this.server) {
        this.server.close((error) => {
          cleanup();
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } else {
        cleanup();
        resolve();
      }
    });
  }

  /**
   * 检查服务器是否正在运行
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 获取服务器地址
   */
  getServerAddress(): string {
    return `http://${this.config.host}:${this.config.port}`;
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 请求日志中间件
    if (this.config.debug) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
        next();
      });
    }

    // 基础中间件
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // CORS支持
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // 静态文件服务（如果存在）
    const staticPath = join(__dirname, '../public');
    if (existsSync(staticPath)) {
      this.app.use('/static', express.static(staticPath));
    }
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // 主页
    this.app.get('/', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(this.getIndexHtml());
    });

    // API路由组
    this.setupApiRoutes();

    // 404处理
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `路径 ${req.originalUrl} 不存在`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * 设置API路由
   */
  private setupApiRoutes(): void {
    const apiRouter = express.Router();

    // API状态
    apiRouter.get('/status', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      });
    });

    // 数据库连接测试
    apiRouter.post('/test-connection', (req: Request, res: Response) => {
      const { host, port, database, username } = req.body;

      // TODO: 实现真实的数据库连接测试
      setTimeout(() => {
        res.json({
          success: true,
          message: '连接测试成功',
          connectionInfo: { host, port, database, username },
          timestamp: new Date().toISOString(),
        });
      }, 500);
    });

    // 获取数据库列表
    apiRouter.get('/databases', (req: Request, res: Response) => {
      // TODO: 实现真实的数据库列表获取
      res.json([
        {
          name: 'example_db',
          type: 'sqlite',
          path: './example.db',
          size: '2.5 MB',
          tables: 5,
          lastModified: new Date().toISOString(),
        },
        {
          name: 'test_db',
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          tables: 12,
          lastModified: new Date().toISOString(),
        },
      ]);
    });

    // 获取表列表
    apiRouter.get('/databases/:db/tables', (req: Request, res: Response) => {
      const { db } = req.params;

      // TODO: 实现真实的表列表获取
      console.log(`获取数据库 ${db} 的表列表`);
      res.json([
        {
          name: 'users',
          rows: 150,
          columns: 8,
          size: '1.2 MB',
          engine: 'InnoDB',
          lastModified: new Date().toISOString(),
        },
        {
          name: 'posts',
          rows: 89,
          columns: 6,
          size: '890 KB',
          engine: 'InnoDB',
          lastModified: new Date().toISOString(),
        },
      ]);
    });

    // 获取表数据
    apiRouter.get(
      '/databases/:db/tables/:table/data',
      (req: Request, res: Response) => {
        const { db, table } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // TODO: 实现真实的表数据获取
        res.json({
          database: db,
          table: table,
          columns: [
            { name: 'id', type: 'int', nullable: false, primaryKey: true },
            { name: 'name', type: 'varchar(255)', nullable: false },
            {
              name: 'email',
              type: 'varchar(255)',
              nullable: false,
              unique: true,
            },
            { name: 'created_at', type: 'timestamp', nullable: false },
          ],
          rows: [
            [1, 'John Doe', 'john@example.com', '2023-01-15T10:30:00Z'],
            [2, 'Jane Smith', 'jane@example.com', '2023-01-16T14:20:00Z'],
            [3, 'Bob Johnson', 'bob@example.com', '2023-01-17T09:15:00Z'],
          ],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 150,
            totalPages: Math.ceil(150 / Number(limit)),
          },
          timestamp: new Date().toISOString(),
        });
      }
    );

    // 执行SQL查询
    apiRouter.post('/query', (req: Request, res: Response) => {
      const { sql, database } = req.body;

      if (!sql || typeof sql !== 'string') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'SQL查询不能为空',
        });
      }

      // TODO: 实现真实的SQL查询执行
      setTimeout(() => {
        res.json({
          success: true,
          sql: sql.trim(),
          database,
          results: {
            columns: ['id', 'name', 'count'],
            rows: [
              [1, 'Sample Result', 42],
              [2, 'Another Row', 24],
            ],
          },
          executionTime: Math.random() * 100,
          timestamp: new Date().toISOString(),
        });
      }, 200);
    });

    this.app.use('/api', apiRouter);
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 全局错误处理
    this.app.use(
      (error: Error, req: Request, res: Response, next: NextFunction) => {
        if (this.config.debug) {
          console.error('服务器错误:', error);
        }

        res.status(500).json({
          error: 'Internal Server Error',
          message: this.config.debug ? error.message : '服务器内部错误',
          timestamp: new Date().toISOString(),
        });
      }
    );
  }

  /**
   * 设置WebSocket
   */
  private setupWebSocket(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, req) => {
      if (this.config.debug) {
        console.log(`WebSocket客户端已连接: ${req.socket.remoteAddress}`);
      }

      // 发送欢迎消息
      ws.send(
        JSON.stringify({
          type: 'welcome',
          message: '欢迎使用Cosy数据库UI',
          serverTime: new Date().toISOString(),
        })
      );

      // 处理消息
      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: '无效的消息格式',
            })
          );
        }
      });

      // 处理连接关闭
      ws.on('close', (code, reason) => {
        if (this.config.debug) {
          console.log(`WebSocket客户端已断开: ${code} ${reason}`);
        }
      });

      // 处理错误
      ws.on('error', (error) => {
        if (this.config.debug) {
          console.error('WebSocket错误:', error);
        }
      });
    });
  }

  /**
   * 处理WebSocket消息
   */
  private handleWebSocketMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'ping':
        ws.send(
          JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString(),
          })
        );
        break;

      case 'subscribe':
        // TODO: 实现数据订阅功能
        ws.send(
          JSON.stringify({
            type: 'subscribed',
            topic: data.topic,
            message: `已订阅主题: ${data.topic}`,
          })
        );
        break;

      case 'unsubscribe':
        // TODO: 实现取消订阅功能
        ws.send(
          JSON.stringify({
            type: 'unsubscribed',
            topic: data.topic,
            message: `已取消订阅: ${data.topic}`,
          })
        );
        break;

      default:
        ws.send(
          JSON.stringify({
            type: 'error',
            message: `未知消息类型: ${data.type}`,
          })
        );
    }
  }

  /**
   * 打开浏览器
   */
  private async openBrowser(): Promise<void> {
    const url = this.getServerAddress();
    await open(url);
  }

  /**
   * 生成主页HTML
   */
  private getIndexHtml(): string {
    const { host, port } = this.config;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cosy Database UI</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }

        .container {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 800px;
            width: 90%;
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .logo {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 2s infinite;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }

        h1 {
            color: #333;
            margin-bottom: 0.5rem;
            font-size: 2.5rem;
            font-weight: 600;
        }

        .subtitle {
            color: #666;
            margin-bottom: 2rem;
            font-size: 1.2rem;
        }

        .status {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 1rem 2rem;
            border-radius: 50px;
            margin: 2rem 0;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }

        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }

        .feature {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 12px;
            border-left: 4px solid #667eea;
            transition: transform 0.2s ease;
        }

        .feature:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .feature h3 {
            color: #333;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
        }

        .feature p {
            color: #666;
            line-height: 1.5;
        }

        .api-section {
            background: #f0f2f5;
            padding: 1.5rem;
            border-radius: 12px;
            margin-top: 2rem;
            text-align: left;
        }

        .api-section h3 {
            margin-bottom: 1rem;
            color: #333;
            text-align: center;
        }

        .endpoint {
            background: white;
            padding: 0.75rem 1rem;
            margin: 0.5rem 0;
            border-radius: 8px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            border-left: 3px solid #667eea;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.2s ease;
        }

        .endpoint:hover {
            background: #f8f9fa;
        }

        .method {
            background: #667eea;
            color: white;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
        }

        .method.get { background: #4CAF50; }
        .method.post { background: #FF9800; }

        .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
            color: #888;
            font-size: 0.9rem;
        }

        .live-status {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #4CAF50;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        .connection-info {
            background: #e3f2fd;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            border-left: 4px solid #2196F3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🗄️</div>
        <h1>Cosy Database UI</h1>
        <p class="subtitle">强大且现代化的数据库管理界面</p>

        <div class="status">
            <span class="live-status"></span>
            服务器运行中 | 端口: ${port} | 主机: ${host}
        </div>

        <div class="connection-info">
            <strong>🔗 连接信息</strong><br>
            HTTP服务: <code>http://${host}:${port}</code><br>
            WebSocket: <code>ws://${host}:${port}/ws</code>
        </div>

        <div class="features">
            <div class="feature">
                <h3>📊 数据浏览器</h3>
                <p>直观地查看、编辑和搜索数据库表中的数据，支持分页和过滤</p>
            </div>
            <div class="feature">
                <h3>⚡ SQL 查询器</h3>
                <p>内置SQL编辑器，支持语法高亮、自动完成和查询历史</p>
            </div>
            <div class="feature">
                <h3>🏗️ 架构管理</h3>
                <p>管理数据库表结构、索引、约束和关系图可视化</p>
            </div>
            <div class="feature">
                <h3>📡 实时监控</h3>
                <p>WebSocket实时数据更新，监控数据库状态和性能指标</p>
            </div>
        </div>

        <div class="api-section">
            <h3>🔗 REST API 端点</h3>
            <div class="endpoint">
                <span><span class="method get">GET</span> /api/status</span>
                <span>服务器状态信息</span>
            </div>
            <div class="endpoint">
                <span><span class="method get">GET</span> /api/databases</span>
                <span>获取数据库列表</span>
            </div>
            <div class="endpoint">
                <span><span class="method get">GET</span> /api/databases/:db/tables</span>
                <span>获取表列表</span>
            </div>
            <div class="endpoint">
                <span><span class="method get">GET</span> /api/databases/:db/tables/:table/data</span>
                <span>获取表数据</span>
            </div>
            <div class="endpoint">
                <span><span class="method post">POST</span> /api/query</span>
                <span>执行SQL查询</span>
            </div>
            <div class="endpoint">
                <span><span class="method post">POST</span> /api/test-connection</span>
                <span>测试数据库连接</span>
            </div>
        </div>

        <div class="footer">
            <strong>Cosy Framework</strong> v1.0.0 •
            启动时间: ${new Date().toLocaleString('zh-CN')} •
            <a href="/health" style="color: #667eea;">健康检查</a>
        </div>
    </div>

    <script>
        console.log('🗄️ Cosy Database UI 已加载');

        // WebSocket连接
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = \`\${wsProtocol}//\${window.location.host}/ws\`;

        let ws;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;

        function connectWebSocket() {
            ws = new WebSocket(wsUrl);

            ws.onopen = function() {
                console.log('✅ WebSocket连接已建立');
                reconnectAttempts = 0;

                // 发送ping测试
                ws.send(JSON.stringify({ type: 'ping' }));
            };

            ws.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 收到消息:', data);

                    if (data.type === 'welcome') {
                        console.log('🎉', data.message);
                    }
                } catch (error) {
                    console.error('消息解析错误:', error);
                }
            };

            ws.onclose = function(event) {
                console.log('🔴 WebSocket连接已关闭:', event.code, event.reason);

                // 尝试重连
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    console.log(\`🔄 尝试重连 (\${reconnectAttempts}/\${maxReconnectAttempts})...\`);
                    setTimeout(connectWebSocket, 2000 * reconnectAttempts);
                }
            };

            ws.onerror = function(error) {
                console.error('❌ WebSocket错误:', error);
            };
        }

        // 建立WebSocket连接
        connectWebSocket();

        // 测试REST API
        fetch('/api/status')
            .then(response => response.json())
            .then(data => {
                console.log('📊 服务器状态:', data);
            })
            .catch(error => {
                console.error('❌ API调用失败:', error);
            });

        // 页面可见性变化时重连WebSocket
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && (!ws || ws.readyState === WebSocket.CLOSED)) {
                connectWebSocket();
            }
        });
    </script>
</body>
</html>`;
  }
}
