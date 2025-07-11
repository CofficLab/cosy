import { Command } from 'commander';
import { ServiceProvider } from '../setting/ServiceProvider.js';

/**
 * 扩展包信息接口
 */
export interface IExtensionPackage {
  /** 包名 */
  name: string;
  /** 版本 */
  version: string;
  /** 描述 */
  description?: string;
  /** 包的根路径 */
  path: string;
  /** 是否为 cosy 扩展 */
  isCosyExtension: boolean;
  /** 扩展配置 */
  cosyConfig?: ICosyExtensionConfig;
}

/**
 * Cosy 扩展配置接口
 */
export interface ICosyExtensionConfig {
  /** 扩展类型 */
  type: 'command' | 'service' | 'plugin';
  /** 命令配置（当type为command时） */
  commands?: IExtensionCommand[];
  /** 服务提供者（当type为service时） */
  providers?: string[];
  /** 入口文件 */
  entry?: string;
}

/**
 * 扩展命令配置接口
 */
export interface IExtensionCommand {
  /** 命令名称 */
  name: string;
  /** 命令描述 */
  description?: string;
  /** 配置函数路径 */
  configure: string;
}

/**
 * 扩展命令配置函数类型
 */
export type ExtensionCommandConfigurer = (program: Command) => void;

/**
 * 扩展管理器接口
 */
export interface IExtensionManager {
  /**
   * 发现所有可用的扩展包
   */
  discoverExtensions(): Promise<IExtensionPackage[]>;

  /**
   * 加载指定的扩展包
   * @param extension 扩展包信息
   */
  loadExtension(extension: IExtensionPackage): Promise<void>;

  /**
   * 加载所有扩展包
   */
  loadAllExtensions(): Promise<void>;

  /**
   * 获取已加载的扩展包列表
   */
  getLoadedExtensions(): IExtensionPackage[];

  /**
   * 注册扩展命令到 CLI
   * @param program Commander 程序实例
   */
  registerCommands(program: Command): Promise<void>;

  /**
   * 注册扩展服务提供者
   * @param providers 服务提供者数组
   */
  registerProviders(
    providers: Array<new (...args: any[]) => ServiceProvider>
  ): Promise<void>;
}
