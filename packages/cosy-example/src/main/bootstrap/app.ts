/**
 * 应用启动文件
 * 使用 Electron Laravel Framework
 * 负责应用的初始化和配置
 */

import { app } from 'electron';
import { registerRoutes } from '../routes/index.js';
import {
  ApplicationConfig,
  createElectronApp,
  ILogManager,
  setupIPCHandlers,
  SettingServiceProvider,
  LoggingMiddleware,
} from '@coffic/cosy-framework';
import { UpdateServiceProvider } from '@coffic/cosy-framework';
import { KeyboardServiceProvider } from '@coffic/cosy-keyboard';
import { McpServiceProvider } from '../providers/mcp/McpServiceProvider.js';
import { WindowServiceProvider } from '../providers/window/WindowServiceProvider.js';
import { StateServiceProvider } from '../providers/state/StateServiceProvider.js';
import { StateManager } from '../providers/state/StateManager.js';

// 应用配置
const config: ApplicationConfig = {
  name: 'Buddy',
  env: app.isPackaged ? 'production' : 'development',
  debug: true,
  providers: [
    SettingServiceProvider,
    KeyboardServiceProvider,
    UpdateServiceProvider,
    WindowServiceProvider,
    McpServiceProvider,
    StateServiceProvider,
  ],
  paths: {
    userData: app.getPath('userData'),
  },
  middleware: [LoggingMiddleware({ logLevel: 'debug' })],
};

/**
 * 启动应用
 */
export async function bootApplication(): Promise<void> {
  let logger: ILogManager | null = null;
  try {
    // 等待 Electron 准备就绪
    await app.whenReady();

    // 使用框架启动应用
    const application = await createElectronApp(config);

    // 从容器中获取日志管理器
    logger = application.make<ILogManager>('log');

    // 监听应用的日志事件
    application.on('log', (level, message, context) => {
      logger?.channel()[level](message, context);
    });

    application.on('window:show', () => {
      const stateManager = application.make<StateManager>('state');
      stateManager.updateActiveApp('window:show');
    });

    // 注册所有路由
    registerRoutes();

    setupIPCHandlers(application);

    logger.channel('app').info('✅ [Bootstrap] 应用核心服务已启动');
  } catch (error) {
    const errorMessage = '❌ Application failed to start';
    if (logger) {
      logger.channel().error(errorMessage, { error });
    } else {
      console.error(errorMessage, error);
    }
    throw error;
  }
}

// 设置应用事件监听
app.on('will-quit', async () => {
  console.log('👋 Buddy 应用正在关闭...');
});
