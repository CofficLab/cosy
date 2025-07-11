import { promises as fs } from 'fs';
import { join } from 'path';

const nodeModulesPath = '/Users/angel/Code/Coffic/cosy/node_modules';

console.log('扫描:', nodeModulesPath);

try {
  const entries = await fs.readdir(nodeModulesPath, { withFileTypes: true });

  console.log('总条目数:', entries.length);

  const packages = [];

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      const entryPath = join(nodeModulesPath, entry.name);

      if (entry.name.startsWith('@')) {
        if (entry.name === '@coffic') {
          console.log('\n=== 详细分析 @coffic 目录 ===');
          console.log('路径:', entryPath);
        }

        try {
          const scopedEntries = await fs.readdir(entryPath, {
            withFileTypes: true,
          });

          if (entry.name === '@coffic') {
            console.log('子条目数量:', scopedEntries.length);
            scopedEntries.forEach((sub) => {
              console.log(
                `  - ${sub.name} (目录: ${sub.isDirectory()}, 符号链接: ${sub.isSymbolicLink()})`
              );
            });
          }

          for (const scopedEntry of scopedEntries) {
            if (
              scopedEntry.isDirectory() &&
              !scopedEntry.name.startsWith('.')
            ) {
              const fullName = `${entry.name}/${scopedEntry.name}`;
              const fullPath = join(entryPath, scopedEntry.name);

              if (entry.name === '@coffic') {
                console.log(`  -> 添加包: ${fullName}, 路径: ${fullPath}`);
              }

              packages.push({
                name: fullName,
                path: fullPath,
              });
            }
          }
        } catch (error) {
          console.log(`  -> 读取作用域包失败 ${entry.name}:`, error.message);
        }
      } else {
        packages.push({
          name: entry.name,
          path: entryPath,
        });
      }
    }
  }

  console.log('\n找到的包数量:', packages.length);

  // 查找我们的扩展
  const target = packages.find((p) => p.name === '@coffic/cosy-db-ui');
  if (target) {
    console.log('找到目标包:', target);

    // 检查 package.json
    try {
      const pkgPath = join(target.path, 'package.json');
      console.log('尝试读取:', pkgPath);
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);
      console.log('包名:', pkg.name);
      console.log('关键词:', pkg.keywords);
      console.log('Cosy配置:', pkg.cosy);
    } catch (error) {
      console.log('读取package.json失败:', error.message);
    }
  } else {
    console.log('未找到目标包 @coffic/cosy-db-ui');
    console.log('所有 @coffic 包:');
    packages
      .filter((p) => p.name.startsWith('@coffic/'))
      .forEach((p) => {
        console.log(`  - ${p.name} -> ${p.path}`);
      });
  }
} catch (error) {
  console.error('扫描失败:', error);
}
