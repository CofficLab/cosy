import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { BrowserWindow, dialog } from 'electron';
import { IUpdateConfig } from './IUpdateConfig.js';
import { IApplication } from '../contract/IApplication.js';
import { IUpdateManager } from './IUpdateManager.js';
import { ILogLevel } from '../contract/logger/ILogLevel.js';
import { ILogManager } from '../contract/logger/ILogManager.js';
import { IWindowManager } from '@/contract/IWindowManager.js';

export class UpdateManager implements IUpdateManager {
  constructor(
    private readonly app: IApplication,
    private readonly logger: ILogManager,
    private updaterConfig?: IUpdateConfig
  ) {}

  public boot(): void {
    const updaterConfig = this.updaterConfig ?? {
      allowDowngrade: true,
      allowPrerelease: true,
      forceDevUpdateConfig: false,
      autoCheck: true,
      autoCheckDelay: 3000,
    };

    autoUpdater.logger = this.logger.createChannel('update', {
      driver: 'file',
      level: ILogLevel.DEBUG,
      format: 'structured',
      includeTimestamp: false,
    });
    autoUpdater.allowDowngrade = updaterConfig.allowDowngrade ?? true;
    autoUpdater.allowPrerelease = updaterConfig.allowPrerelease ?? true;

    if (this.app.isDevelopment()) {
      autoUpdater.forceDevUpdateConfig =
        updaterConfig.forceDevUpdateConfig ?? false;
    }

    this.setupEventListeners();

    if (updaterConfig.autoCheck) {
      setTimeout(() => {
        this.checkForUpdates();
      }, updaterConfig.autoCheckDelay || 3000);
    }
  }

  private setupEventListeners(): void {
    autoUpdater.on('error', (error) => {
      this.logger
        .channel('updater')
        .error('Update check failed', { error: error.message });
    });

    autoUpdater.on('checking-for-update', () => {
      this.logger.channel('updater').info('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
      this.logger
        .channel('updater')
        .info('Update available.', { version: info.version });
      this.notifyUpdateAvailable(info);
    });

    autoUpdater.on('update-not-available', (info) => {
      this.logger
        .channel('updater')
        .info('Update not available.', { version: info.version });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.logger.channel('updater').debug('Downloading update', {
        percent: progressObj.percent,
        speed: progressObj.bytesPerSecond,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.logger
        .channel('updater')
        .info('Update downloaded', { version: info.version });
      this.notifyUpdateReady(info);
    });
  }

  private notifyUpdateAvailable(info: any): void {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) {
      this.logger.channel('updater').warn('Main window not found');
      return;
    }

    this.logger.channel('updater').info('Notifying update available', {
      version: info.version,
    });

    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `A new version ${info.version} is available.`,
        detail: 'Do you want to download it now?',
        buttons: ['Download', 'Later'],
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
  }

  private notifyUpdateReady(info: any): void {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) {
      this.logger.channel('updater').warn('Main window not found');
      return;
    }

    this.logger.channel('updater').info('Notifying update ready', {
      version: info.version,
    });

    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Install Update',
        message: `Version ${info.version} is ready to install.`,
        detail: 'The application will be restarted to install the update.',
        buttons: ['Install Now', 'Later'],
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall(false, true);
        }
      });
  }

  /**
   * 手动检查更新
   * @returns null if the updater is disabled, otherwise info about the latest version
   */
  public async checkForUpdates(): Promise<string> {
    this.logger.channel('updater').info('Manually checking for updates...');

    const result = await autoUpdater.checkForUpdates();
    if (result) {
      this.logger.channel('updater').info('Update check result', {
        version: result.updateInfo.version,
      });
      return result.updateInfo.version;
    }

    this.logger
      .channel('updater')
      .warn('Update check result is null, means the updater is disabled');
    return '更新被禁用';
  }

  private getMainWindow(): BrowserWindow | null {
    return this.app.make<IWindowManager>('window.manager').getMainWindow();
  }
}
