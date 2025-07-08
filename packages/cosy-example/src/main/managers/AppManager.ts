/**
 * 应用管理器
 * 负责应用的生命周期管理、初始化和清理工作
 */
import { app, BrowserWindow } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { WindowFacade } from '../providers/window/WindowFacade.js';

export class AppManager {
  private mainWindow: BrowserWindow | null = null;

  /**
   * 设置应用事件监听器
   */
  private setupEventListeners(): void {
    // 处理第二个实例启动
    app.on('second-instance', () => {
      console.info('检测到第二个应用实例启动，激活主窗口');
      this.mainWindow = WindowFacade.getMainWindow();
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });

    // 窗口创建事件
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    // macOS 激活事件
    app.on('activate', () => {
      console.info('应用被激活');
      if (BrowserWindow.getAllWindows().length === 0) {
        console.info('没有活动窗口，创建新窗口');
        this.mainWindow = WindowFacade.createWindow();
      }
    });

    // 窗口全部关闭事件
    app.on('window-all-closed', () => {
      console.info('所有窗口已关闭');
      if (process.platform !== 'darwin') {
        console.info('非macOS平台，退出应用');
        app.quit();
      }
    });

    // 应用退出前事件
    app.on('will-quit', () => {
      console.info('应用即将退出，执行清理工作');
      this.cleanup();
    });
  }

  /**
   * 初始化应用
   */
  private async initialize(): Promise<void> {
    // 设置应用ID
    electronApp.setAppUserModelId('com.electron');

    // 创建主窗口
    this.mainWindow = WindowFacade.createWindow();

    // updateManager.initialize(this.mainWindow);

    WindowFacade.setupGlobalShortcut();

    this.setupContextMenu();
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    WindowFacade.cleanup();
  }

  /**
   * 启动应用
   * 注意：Electron app.whenReady() 已经在 bootApplication 中处理
   */
  public async start(): Promise<void> {
    this.setupEventListeners();
    await this.initialize();
  }

  /**
   * 设置应用的右键菜单
   */
  private setupContextMenu(): void {
    const { Menu, ipcMain } = require('electron');

    // 通用上下文菜单
    const textContextMenu = Menu.buildFromTemplate([
      { label: '复制', role: 'copy' },
      { label: '粘贴', role: 'paste' },
      { label: '剪切', role: 'cut' },
      { type: 'separator' },
      { label: '全选', role: 'selectAll' },
    ]);

    // 聊天消息的上下文菜单
    const chatContextMenu = Menu.buildFromTemplate([
      { label: '复制消息', role: 'copy' },
      {
        label: '复制代码块',
        click: (_menuItem, browserWindow) => {
          if (browserWindow) {
            browserWindow.webContents.send('context-menu-copy-code');
          }
        },
      },
      { type: 'separator' },
      { label: '全选', role: 'selectAll' },
    ]);

    // 监听上下文菜单请求
    ipcMain.on('show-context-menu', (event, params) => {
      const { type } = params;
      const window = BrowserWindow.fromWebContents(event.sender);

      if (!window) return;

      if (type === 'chat-message') {
        chatContextMenu.popup({ window });
      } else {
        // 通用输入框上下文菜单
        textContextMenu.popup({ window });
      }
    });
  }
}

// 导出单例实例
export const appManager = new AppManager();
