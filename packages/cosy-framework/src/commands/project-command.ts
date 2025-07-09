import { Command } from 'commander';
import { formatBytes } from './command-util.js';

/**
 * 配置另一个示例命令 - 项目信息
 * @param program Commander 程序实例
 */
export function configureProjectInfoCommand(program: Command): void {
  program
    .command('project')
    .description('Display project information and statistics')
    .option('-s, --stats', 'show detailed statistics')
    .option('--json', 'output as JSON')
    .addHelpText(
      'after',
      `
💡 示例:
   cosy project         显示基本项目信息
   cosy project --stats 显示详细统计信息
   cosy project --json  以 JSON 格式输出

📝 说明:
   此命令会分析当前项目并显示有用信息，包括:
   • 项目基本信息
   • 依赖分析
   • 文件统计
   • 配置检查

🎯 用途:
   • 项目概览
   • 依赖审计
   • 开发状态检查
`
    )
    .action(async (options: { stats?: boolean; json?: boolean }) => {
      const projectInfo = await analyzeProject(options.stats || false);

      if (options.json) {
        console.log(JSON.stringify(projectInfo, null, 2));
        return;
      }

      displayProjectInfo(projectInfo, options.stats || false);
    });
}

/**
 * 分析项目信息
 */
async function analyzeProject(includeStats: boolean): Promise<any> {
  const { readFileSync, existsSync } = await import('fs');
  const { join } = await import('path');

  const projectInfo: any = {
    name: '未知项目',
    version: '未知',
    description: '',
    hasPackageJson: false,
    packageManager: '未知',
    timestamp: new Date().toISOString(),
  };

  try {
    // 查找项目根目录的 package.json
    let currentDir = process.cwd();
    while (currentDir !== '/') {
      const packageJsonPath = join(currentDir, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        projectInfo.name = packageJson.name || '未知项目';
        projectInfo.version = packageJson.version || '未知';
        projectInfo.description = packageJson.description || '';
        projectInfo.hasPackageJson = true;
        projectInfo.rootPath = currentDir;

        if (packageJson.dependencies) {
          projectInfo.dependencies = Object.keys(
            packageJson.dependencies
          ).length;
        }
        if (packageJson.devDependencies) {
          projectInfo.devDependencies = Object.keys(
            packageJson.devDependencies
          ).length;
        }

        break;
      }

      const parentDir = join(currentDir, '..');
      if (parentDir === currentDir) break;
      currentDir = parentDir;
    }

    // 检测包管理器
    if (existsSync(join(currentDir, 'pnpm-lock.yaml'))) {
      projectInfo.packageManager = 'pnpm';
    } else if (existsSync(join(currentDir, 'yarn.lock'))) {
      projectInfo.packageManager = 'yarn';
    } else if (existsSync(join(currentDir, 'package-lock.json'))) {
      projectInfo.packageManager = 'npm';
    }

    // 详细统计（可选）
    if (includeStats && projectInfo.rootPath) {
      projectInfo.stats = await collectProjectStats(projectInfo.rootPath);
    }
  } catch (error) {
    projectInfo.error = error instanceof Error ? error.message : String(error);
  }

  return projectInfo;
}

/**
 * 收集项目统计信息
 */
async function collectProjectStats(rootPath: string): Promise<any> {
  const { readdirSync, statSync } = await import('fs');
  const { join, extname } = await import('path');

  const stats = {
    totalFiles: 0,
    totalDirectories: 0,
    filesByExtension: {} as Record<string, number>,
    totalSize: 0,
  };

  const excludeDirs = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.nuxt',
  ]);

  function scanDirectory(dirPath: string) {
    try {
      const items = readdirSync(dirPath);

      for (const item of items) {
        const itemPath = join(dirPath, item);
        const stat = statSync(itemPath);

        if (stat.isDirectory()) {
          if (!excludeDirs.has(item)) {
            stats.totalDirectories++;
            scanDirectory(itemPath);
          }
        } else {
          stats.totalFiles++;
          stats.totalSize += stat.size;

          const ext = extname(item).toLowerCase();
          const extension = ext || '(无扩展名)';
          stats.filesByExtension[extension] =
            (stats.filesByExtension[extension] || 0) + 1;
        }
      }
    } catch {
      // 忽略无法访问的目录
    }
  }

  scanDirectory(rootPath);
  return stats;
}

/**
 * 显示项目信息
 */
function displayProjectInfo(projectInfo: any, showStats: boolean): void {
  console.log('\n📁 项目信息\n');

  console.log('🏷️  基本信息:');
  console.log(`   项目名称:     ${projectInfo.name}`);
  console.log(`   版本:         ${projectInfo.version}`);
  console.log(`   描述:         ${projectInfo.description || '(无描述)'}`);
  console.log(`   包管理器:     ${projectInfo.packageManager}`);
  console.log(`   根目录:       ${projectInfo.rootPath || process.cwd()}`);
  console.log('');

  if (
    projectInfo.dependencies !== undefined ||
    projectInfo.devDependencies !== undefined
  ) {
    console.log('📦 依赖信息:');
    if (projectInfo.dependencies !== undefined) {
      console.log(`   生产依赖:     ${projectInfo.dependencies} 个`);
    }
    if (projectInfo.devDependencies !== undefined) {
      console.log(`   开发依赖:     ${projectInfo.devDependencies} 个`);
    }
    console.log('');
  }

  if (showStats && projectInfo.stats) {
    console.log('📊 项目统计:');
    console.log(`   文件总数:     ${projectInfo.stats.totalFiles}`);
    console.log(`   目录总数:     ${projectInfo.stats.totalDirectories}`);
    console.log(`   项目大小:     ${formatBytes(projectInfo.stats.totalSize)}`);
    console.log('');

    if (Object.keys(projectInfo.stats.filesByExtension).length > 0) {
      console.log('📄 文件类型分布:');
      const sortedExtensions = Object.entries(
        projectInfo.stats.filesByExtension
      )
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10); // 只显示前10种文件类型

      for (const [ext, count] of sortedExtensions) {
        console.log(`   ${ext.padEnd(15)} ${count} 个`);
      }
      console.log('');
    }
  }

  if (projectInfo.error) {
    console.log('⚠️  错误:');
    console.log(`   ${projectInfo.error}`);
    console.log('');
  }
}
