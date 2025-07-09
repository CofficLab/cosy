/**
 * 窗口管理器的契约接口
 * 定义了窗口管理相关的核心功能
 */
import { IWindowConfig, IWindowManager } from '@coffic/cosy-framework';

/**
 * 窗口管理器工厂契约
 */
export interface IWindowFactory {
  /**
   * 创建窗口管理器实例
   */
  createManager(config: IWindowConfig): IWindowManager;
}
