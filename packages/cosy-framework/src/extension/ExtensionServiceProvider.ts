import { ServiceProvider } from '../setting/ServiceProvider.js';
import { ExtensionManager } from './ExtensionManager.js';
import { IExtensionManager } from '../contract/IExtensionManager.js';
import { EMOJI } from '../constants.js';

/**
 * 扩展服务提供者
 * 负责注册和启动扩展管理器
 */
export class ExtensionServiceProvider extends ServiceProvider {
  public static ExtensionManager = 'extension';

  /**
   * 注册扩展服务
   */
  public register(): void {
    this.app.singleton(ExtensionServiceProvider.ExtensionManager, () => {
      return new ExtensionManager(this.app.config().debug);
    });
  }

  /**
   * 启动扩展服务
   */
  public override async boot(): Promise<void> {
    const manager = this.app.make<IExtensionManager>(
      ExtensionServiceProvider.ExtensionManager
    );

    try {
      // 加载所有扩展
      await manager.loadAllExtensions();

      if (this.app.config().debug) {
        const loadedExtensions = manager.getLoadedExtensions();
        console.log(
          `${EMOJI} [ExtensionServiceProvider] 已加载 ${loadedExtensions.length} 个扩展`
        );

        if (loadedExtensions.length > 0) {
          console.log('  扩展列表:');
          loadedExtensions.forEach((ext) => {
            console.log(
              `    • ${ext.name} v${ext.version} (${ext.cosyConfig?.type || 'unknown'})`
            );
          });
        }
      }
    } catch (error) {
      console.error(
        `${EMOJI} [ExtensionServiceProvider] 扩展系统启动失败:`,
        error
      );
    }
  }

  /**
   * 获取提供的服务
   */
  public override provides(): string[] {
    return ['extension'];
  }
}
