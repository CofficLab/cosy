import { Command } from 'commander';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 配置数据库UI命令 (Astro版本)
 * 扩展现有的db命令，添加ui子命令
 */
export default function configureUICommand(program: Command): void {
  // 查找现有的 db 命令
  let dbCommand = program.commands.find((cmd) => cmd.name() === 'db');

  // 如果不存在 db 命令，创建一个
  if (!dbCommand) {
    dbCommand = program
      .command('db')
      .description('Database management commands');
  }

  dbCommand
    .command('ui')
    .description('Launch database UI in browser (Astro version)')
    .option('-p, --port <port>', 'Port to run the server on', '4321')
    .option('-H, --host <host>', 'Host to bind the server to', 'localhost')
    .option('--dev', 'Run in development mode', false)
    .option('--no-open', 'Do not automatically open browser', false)
    .addHelpText(
      'after',
      `
💡 示例:
   cosy db ui                启动数据库UI (生产模式，默认端口4321)
   cosy db ui -p 8080        在指定端口启动
   cosy db ui --dev          以开发模式启动
   cosy db ui --no-open      启动但不自动打开浏览器

📝 说明:
   此命令会启动一个基于Astro的数据库管理界面，支持:
   • SQLite 数据库连接和管理
   • 表数据的查看和编辑
   • SQL查询执行
   • 数据库结构查看
   • 现代化的Web界面 (Astro + Tailwind CSS)

🎯 用途:
   • 开发环境数据库管理
   • 数据查看和调试
   • 快速数据操作
   • 数据库结构分析

🚀 技术栈:
   • Astro - 现代静态站点生成器
   • Tailwind CSS - 实用优先的CSS框架
   • Better SQLite3 - 高性能SQLite驱动
   • TypeScript - 类型安全

⚙️ 模式说明:
   • 生产模式 (默认): 使用构建好的产物，启动速度快
   • 开发模式 (--dev): 实时编译，支持热重载
`
    )
    .action(async (options) => {
      const { port, host, dev, open } = options;

      console.log(`🚀 正在启动 Cosy Database UI (Astro版本)...`);
      console.log(`📍 服务器地址: http://${host}:${port}`);
      console.log(`🔧 运行模式: ${dev ? '开发模式' : '生产模式'}`);

      // 获取包根目录
      const packageRoot = resolve(__dirname, '../..');

      try {
        // 如果是生产模式，检查构建产物是否存在
        if (!dev) {
          const buildPath = resolve(packageRoot, 'dist');
          if (!existsSync(buildPath)) {
            console.log('📦 构建产物不存在，正在自动构建...');

            // 执行构建
            const buildProcess = spawn('pnpm', ['build'], {
              cwd: packageRoot,
              stdio: 'inherit',
              shell: true,
            });

            await new Promise((resolve, reject) => {
              buildProcess.on('exit', (code) => {
                if (code === 0) {
                  console.log('✅ 构建完成');
                  resolve(void 0);
                } else {
                  reject(new Error(`构建失败，退出码: ${code}`));
                }
              });
              buildProcess.on('error', reject);
            });
          }
        }

        // 启动Astro服务器
        const command = dev ? 'dev' : 'preview';
        const args = ['run', command];

        const child = spawn('pnpm', args, {
          cwd: packageRoot,
          env: {
            ...process.env,
            PORT: port,
            HOST: host,
          },
          stdio: 'inherit',
          shell: true,
        });

        // 如果需要自动打开浏览器
        if (open !== false) {
          setTimeout(() => {
            const url = `http://${host}:${port}`;
            const openCmd =
              process.platform === 'darwin'
                ? 'open'
                : process.platform === 'win32'
                  ? 'start'
                  : 'xdg-open';
            spawn(openCmd, [url], { stdio: 'ignore' });
            console.log(`🌐 已在浏览器中打开: ${url}`);
          }, 3000); // 等待3秒确保服务器启动
        }

        child.on('error', (error: Error) => {
          console.error('❌ 启动服务器失败:', error);
          if (error.message.includes('ENOENT')) {
            console.log('💡 提示: 请确保已安装pnpm');
            console.log('   运行: npm install -g pnpm');
          }
          process.exit(1);
        });

        child.on('exit', (code: number | null) => {
          if (code !== 0) {
            console.error(`❌ 服务器退出，错误代码: ${code}`);
            process.exit(code || 1);
          }
        });

        // 处理进程退出
        process.on('SIGINT', () => {
          console.log('\n⏹️  正在关闭服务器...');
          child.kill('SIGINT');
        });

        process.on('SIGTERM', () => {
          console.log('\n⏹️  正在关闭服务器...');
          child.kill('SIGTERM');
        });
      } catch (error) {
        console.error('❌ 启动服务器失败:', error);
        process.exit(1);
      }
    });
}
