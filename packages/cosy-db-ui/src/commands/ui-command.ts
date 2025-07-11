import { Command } from 'commander';
import { DatabaseUIServer } from '../server/DatabaseUIServer.js';
import chalk from 'chalk';
import ora from 'ora';

/**
 * 配置数据库UI命令
 * 这个函数会被 cosy 框架调用来注册 db ui 命令
 */
export default function configureDbUICommand(program: Command): void {
  // 找到或创建 db 命令组
  let dbCommand: Command;

  try {
    // 尝试找到现有的 db 命令
    const existingDbCommand = program.commands.find(
      (cmd) => cmd.name() === 'db'
    );

    if (existingDbCommand) {
      dbCommand = existingDbCommand;
    } else {
      // 如果没有找到，创建一个新的 db 命令
      dbCommand = program
        .command('db')
        .description('Database management commands');
    }
  } catch {
    // 如果出现错误，创建新的 db 命令
    dbCommand = program
      .command('db')
      .description('Database management commands');
  }

  // 添加 ui 子命令
  dbCommand
    .command('ui')
    .description('Open database management UI in browser')
    .option('-p, --port <number>', 'Port to run the UI server on', '3001')
    .option('--host <host>', 'Host to bind the server to', 'localhost')
    .option('--no-open', 'Do not automatically open browser')
    .option('--debug', 'Enable debug mode')
    .addHelpText(
      'after',
      `
💡 示例:
   cosy db ui                在默认端口(3001)启动数据库UI
   cosy db ui -p 4000        在指定端口启动数据库UI
   cosy db ui --host 0.0.0.0 绑定到所有网络接口
   cosy db ui --no-open      启动服务器但不自动打开浏览器
   cosy db ui --debug        启用调试模式

📝 说明:
   此命令会启动一个现代化的Web界面，用于管理数据库，包括:
   • 📊 数据浏览器 - 查看、编辑和搜索数据库表数据
   • ⚡ SQL查询器 - 内置SQL编辑器和查询执行
   • 🏗️ 架构管理 - 管理数据库表结构和索引
   • 📡 实时监控 - WebSocket实时数据更新
   • 🔒 安全连接 - 支持多种数据库连接

🎯 特性:
   • 现代化响应式UI设计
   • RESTful API支持
   • WebSocket实时通信
   • 完整的错误处理
   • 健康检查端点
   • CORS跨域支持

🌐 访问地址:
   启动后可通过 http://localhost:端口 访问Web界面
   API文档: http://localhost:端口/api/status
   健康检查: http://localhost:端口/health
`
    )
    .action(
      async (options: {
        port: string;
        host: string;
        open: boolean;
        debug?: boolean;
      }) => {
        const spinner = ora('正在启动数据库UI服务器...').start();

        try {
          // 验证端口号
          const port = parseInt(options.port, 10);
          if (isNaN(port) || port < 1 || port > 65535) {
            throw new Error(
              `无效的端口号: ${options.port}，必须是1-65535之间的数字`
            );
          }

          // 验证主机地址
          const host = options.host.trim();
          if (!host) {
            throw new Error('主机地址不能为空');
          }

          if (options.debug) {
            spinner.text = '正在启动数据库UI服务器 (调试模式)...';
          }

          // 创建并启动数据库UI服务器
          const server = new DatabaseUIServer({
            port,
            host,
            autoOpen: options.open,
            debug: options.debug || false,
          });

          await server.start();

          spinner.succeed(chalk.green('🎉 数据库UI服务器已启动'));

          // 显示连接信息
          console.log(
            chalk.cyan(`\n🚀 数据库UI访问地址: ${server.getServerAddress()}`)
          );
          console.log(
            chalk.gray(`   API状态: ${server.getServerAddress()}/api/status`)
          );
          console.log(
            chalk.gray(`   健康检查: ${server.getServerAddress()}/health`)
          );
          console.log(chalk.gray(`   WebSocket: ws://${host}:${port}/ws`));

          if (options.debug) {
            console.log(chalk.yellow('\n🔍 调试模式已启用'));
          }

          console.log(chalk.gray('\n💡 使用 Ctrl+C 停止服务器'));
          console.log(chalk.gray('💡 使用 --help 查看更多选项\n'));

          // 处理优雅退出
          const handleShutdown = async (signal: string) => {
            console.log(
              chalk.yellow(`\n\n📝 收到 ${signal} 信号，正在关闭服务器...`)
            );

            const shutdownSpinner = ora('正在关闭数据库UI服务器...').start();

            try {
              await server.stop();
              shutdownSpinner.succeed(
                chalk.green('✅ 数据库UI服务器已安全关闭')
              );
              console.log(chalk.gray('感谢使用 Cosy Database UI! 👋\n'));
              process.exit(0);
            } catch (error) {
              shutdownSpinner.fail(chalk.red('❌ 关闭服务器时发生错误'));

              if (error instanceof Error) {
                console.error(chalk.red(`错误详情: ${error.message}`));
              }

              process.exit(1);
            }
          };

          // 注册信号处理器
          process.on('SIGINT', () => handleShutdown('SIGINT'));
          process.on('SIGTERM', () => handleShutdown('SIGTERM'));

          // 处理未捕获的异常
          process.on('uncaughtException', (error) => {
            console.error(chalk.red('\n❌ 未捕获的异常:'), error);
            handleShutdown('UNCAUGHT_EXCEPTION');
          });

          process.on('unhandledRejection', (reason) => {
            console.error(chalk.red('\n❌ 未处理的Promise拒绝:'), reason);
            handleShutdown('UNHANDLED_REJECTION');
          });

          // 保持进程运行
          await new Promise<void>(() => {
            // 这个Promise永远不会resolve，保持进程运行
          });
        } catch (error) {
          spinner.fail(chalk.red('❌ 启动失败'));

          if (error instanceof Error) {
            console.error(chalk.red(`\n💥 错误: ${error.message}`));

            // 提供具体的错误建议
            if (error.message.includes('EADDRINUSE')) {
              console.error(chalk.yellow('\n🔧 解决方案:'));
              console.error(
                chalk.gray(
                  `   • 使用其他端口: cosy db ui -p ${parseInt(options.port) + 1}`
                )
              );
              console.error(chalk.gray('   • 停止占用该端口的其他服务'));
              console.error(
                chalk.gray(`   • 查看端口占用: lsof -i :${options.port}`)
              );
            } else if (error.message.includes('EACCES')) {
              console.error(chalk.yellow('\n🔧 解决方案:'));
              console.error(
                chalk.gray('   • 使用其他端口(1024以上): cosy db ui -p 3001')
              );
              console.error(chalk.gray('   • 使用sudo运行(不推荐)'));
            } else if (error.message.includes('无效的端口号')) {
              console.error(chalk.yellow('\n🔧 解决方案:'));
              console.error(
                chalk.gray('   • 使用有效端口号: cosy db ui -p 3001')
              );
              console.error(chalk.gray('   • 端口范围: 1-65535'));
            }
          } else {
            console.error(chalk.red(`\n💥 未知错误: ${error}`));
          }

          console.error(chalk.gray('\n💡 使用 --debug 查看详细错误信息'));
          console.error(chalk.gray('💡 使用 --help 查看使用说明'));

          process.exit(1);
        }
      }
    );
}
