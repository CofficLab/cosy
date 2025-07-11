import { CommanderApp } from '@/application/Commander.js';

/**
 * 创建命令行应用程序
 *
 * @example
 * ```typescript
 * const app = ApplicationFactory.createCliApp({
 *   name: 'cosy',
 *   description: 'Cosy Framework CLI',
 *   version: '1.0.0'
 * });
 *
 * app.command('serve').action(async () => {
 *   // 执行 serve 命令
 * });
 *
 * await app.parse();
 * ```
 *
 * @param config CLI 应用程序配置
 * @returns CLI Application 实例
 */
export function createCliApp(
  config: {
    name?: string;
    description?: string;
    version?: string;
    debug?: boolean;
  } = {}
): CommanderApp {
  return new CommanderApp(undefined, {
    name: config.name || 'cosy',
    description: config.description || 'Cosy Framework CLI',
    version: config.version || '0.1.0',
    debug: config.debug || false,
  });
}
