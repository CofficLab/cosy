import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { Command } from 'commander';
import {
  IExtensionManager,
  IExtensionPackage,
  ICosyExtensionConfig,
  ExtensionCommandConfigurer,
} from '../contract/IExtensionManager.js';
import { ServiceProvider } from '../setting/ServiceProvider.js';
import { EMOJI } from '../constants.js';

/**
 * 扩展管理器实现
 * 参考 Laravel 的包发现机制，自动发现和加载 cosy 扩展
 */
export class ExtensionManager implements IExtensionManager {
  private loadedExtensions: IExtensionPackage[] = [];
  private debug: boolean;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  /**
   * 发现所有可用的扩展包
   */
  async discoverExtensions(): Promise<IExtensionPackage[]> {
    const extensions: IExtensionPackage[] = [];

    try {
      // 从当前工作目录开始向上查找 node_modules
      const nodeModulesPath = await this.findNodeModules();
      if (!nodeModulesPath) {
        if (this.debug) {
          console.log(`${EMOJI} [ExtensionManager] 未找到 node_modules 目录`);
        }
        return extensions;
      }

      if (this.debug) {
        console.log(
          `${EMOJI} [ExtensionManager] 扫描扩展包: ${nodeModulesPath}`
        );
      }

      // 扫描 node_modules 中的所有包
      const packages = await this.scanNodeModules(nodeModulesPath);

      for (const pkg of packages) {
        try {
          const packageJson = await this.readPackageJson(pkg.path);
          const extensionInfo = this.analyzePackage(packageJson, pkg.path);

          if (extensionInfo.isCosyExtension) {
            extensions.push(extensionInfo);

            if (this.debug) {
              console.log(
                `${EMOJI} [ExtensionManager] 发现扩展: ${extensionInfo.name}`
              );
            }
          }
        } catch (error) {
          if (this.debug) {
            console.warn(`⚠️ 分析包失败 ${pkg.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`${EMOJI} [ExtensionManager] 扩展发现失败:`, error);
    }

    return extensions;
  }

  /**
   * 加载指定的扩展包
   */
  async loadExtension(extension: IExtensionPackage): Promise<void> {
    try {
      if (this.debug) {
        console.log(`${EMOJI} [ExtensionManager] 加载扩展: ${extension.name}`);
      }

      // 检查是否已加载
      if (this.loadedExtensions.find((ext) => ext.name === extension.name)) {
        if (this.debug) {
          console.log(
            `${EMOJI} [ExtensionManager] 扩展已加载: ${extension.name}`
          );
        }
        return;
      }

      // 根据扩展类型加载
      if (extension.cosyConfig?.type === 'command') {
        await this.loadCommandExtension(extension);
      } else if (extension.cosyConfig?.type === 'service') {
        await this.loadServiceExtension(extension);
      }

      this.loadedExtensions.push(extension);

      if (this.debug) {
        console.log(
          `${EMOJI} [ExtensionManager] 扩展加载完成: ${extension.name}`
        );
      }
    } catch (error) {
      console.error(
        `${EMOJI} [ExtensionManager] 扩展加载失败 ${extension.name}:`,
        error
      );
      throw error;
    }
  }

  /**
   * 加载所有扩展包
   */
  async loadAllExtensions(): Promise<void> {
    const extensions = await this.discoverExtensions();

    for (const extension of extensions) {
      try {
        await this.loadExtension(extension);
      } catch (error) {
        // 继续加载其他扩展，即使某个扩展加载失败
        console.error(`跳过扩展 ${extension.name}:`, error);
      }
    }
  }

  /**
   * 获取已加载的扩展包列表
   */
  getLoadedExtensions(): IExtensionPackage[] {
    return [...this.loadedExtensions];
  }

  /**
   * 注册扩展命令到 CLI
   */
  async registerCommands(program: Command): Promise<void> {
    for (const extension of this.loadedExtensions) {
      if (
        extension.cosyConfig?.type === 'command' &&
        extension.cosyConfig.commands
      ) {
        for (const commandConfig of extension.cosyConfig.commands) {
          try {
            const configurePath = join(extension.path, commandConfig.configure);
            const configureModule = await import(configurePath);

            // 支持默认导出和命名导出
            const configurer: ExtensionCommandConfigurer =
              configureModule.default ||
              configureModule[commandConfig.name] ||
              configureModule.configure;

            if (typeof configurer === 'function') {
              configurer(program);

              if (this.debug) {
                console.log(
                  `${EMOJI} [ExtensionManager] 命令已注册: ${commandConfig.name}`
                );
              }
            } else {
              console.warn(
                `⚠️ 扩展 ${extension.name} 的命令配置器不是函数: ${commandConfig.configure}`
              );
            }
          } catch (error) {
            console.error(
              `❌ 注册命令失败 ${extension.name}.${commandConfig.name}:`,
              error
            );
          }
        }
      }
    }
  }

  /**
   * 注册扩展服务提供者
   */
  async registerProviders(
    providers: Array<new (...args: any[]) => ServiceProvider>
  ): Promise<void> {
    for (const extension of this.loadedExtensions) {
      if (
        extension.cosyConfig?.type === 'service' &&
        extension.cosyConfig.providers
      ) {
        for (const providerPath of extension.cosyConfig.providers) {
          try {
            const fullProviderPath = join(extension.path, providerPath);
            const providerModule = await import(fullProviderPath);

            // 支持默认导出和命名导出
            const ProviderClass =
              providerModule.default || Object.values(providerModule)[0];

            if (typeof ProviderClass === 'function') {
              providers.push(
                ProviderClass as new (...args: any[]) => ServiceProvider
              );

              if (this.debug) {
                console.log(
                  `${EMOJI} [ExtensionManager] 服务提供者已注册: ${providerPath}`
                );
              }
            }
          } catch (error) {
            console.error(
              `❌ 注册服务提供者失败 ${extension.name}.${providerPath}:`,
              error
            );
          }
        }
      }
    }
  }

  /**
   * 查找 node_modules 目录
   */
  private async findNodeModules(): Promise<string | null> {
    let currentDir = process.cwd();
    const root = '/';

    while (currentDir !== root) {
      const nodeModulesPath = join(currentDir, 'node_modules');

      try {
        await fs.access(nodeModulesPath);
        return nodeModulesPath;
      } catch {
        // 继续向上查找
      }

      const parentDir = dirname(currentDir);
      if (parentDir === currentDir) break;
      currentDir = parentDir;
    }

    return null;
  }

  /**
   * 扫描 node_modules 中的包
   */
  private async scanNodeModules(
    nodeModulesPath: string
  ): Promise<Array<{ name: string; path: string }>> {
    const packages: Array<{ name: string; path: string }> = [];

    try {
      const entries = await fs.readdir(nodeModulesPath, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const entryPath = join(nodeModulesPath, entry.name);

          if (entry.name.startsWith('@')) {
            // 处理作用域包
            try {
              const scopedEntries = await fs.readdir(entryPath, {
                withFileTypes: true,
              });
              for (const scopedEntry of scopedEntries) {
                if (
                  (scopedEntry.isDirectory() || scopedEntry.isSymbolicLink()) &&
                  !scopedEntry.name.startsWith('.')
                ) {
                  packages.push({
                    name: `${entry.name}/${scopedEntry.name}`,
                    path: join(entryPath, scopedEntry.name),
                  });
                }
              }
            } catch {
              // 忽略读取错误
            }
          } else {
            packages.push({
              name: entry.name,
              path: entryPath,
            });
          }
        }
      }
    } catch (error) {
      throw new Error(`扫描 node_modules 失败: ${error}`);
    }

    return packages;
  }

  /**
   * 读取包的 package.json
   */
  private async readPackageJson(packagePath: string): Promise<any> {
    try {
      // 尝试解析符号链接
      const realPath = await fs.realpath(packagePath);
      const packageJsonPath = join(realPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // 如果符号链接解析失败，尝试直接读取
      const packageJsonPath = join(packagePath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      return JSON.parse(content);
    }
  }

  /**
   * 分析包是否为 cosy 扩展
   */
  private analyzePackage(
    packageJson: any,
    packagePath: string
  ): IExtensionPackage {
    const isCosyExtension = !!(
      packageJson.cosy ||
      packageJson.keywords?.includes('cosy-extension') ||
      packageJson.keywords?.includes('cosy-framework')
    );

    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      path: packagePath,
      isCosyExtension,
      cosyConfig: packageJson.cosy as ICosyExtensionConfig,
    };
  }

  /**
   * 加载命令扩展
   */
  private async loadCommandExtension(
    extension: IExtensionPackage
  ): Promise<void> {
    // 命令扩展在 registerCommands 时才真正注册
    if (this.debug) {
      console.log(
        `${EMOJI} [ExtensionManager] 准备命令扩展: ${extension.name}`
      );
    }
  }

  /**
   * 加载服务扩展
   */
  private async loadServiceExtension(
    extension: IExtensionPackage
  ): Promise<void> {
    // 服务扩展在 registerProviders 时才真正注册
    if (this.debug) {
      console.log(
        `${EMOJI} [ExtensionManager] 准备服务扩展: ${extension.name}`
      );
    }
  }
}
