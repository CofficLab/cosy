import { ExtensionManager } from './packages/cosy-framework/dist/extension/ExtensionManager.js';

const manager = new ExtensionManager(true);
const extensions = await manager.discoverExtensions();

console.log('发现的扩展数量:', extensions.length);
extensions.forEach((ext) => {
  console.log('扩展:', ext.name, '类型:', ext.cosyConfig?.type);
});

// 测试特定包
import { readFileSync } from 'fs';
const pkg = JSON.parse(
  readFileSync('./node_modules/@coffic/cosy-db-ui/package.json', 'utf-8')
);
console.log('\n数据库UI包信息:');
console.log('Keywords:', pkg.keywords);
console.log('Cosy config:', pkg.cosy);

// 测试分析逻辑
const analyzed = manager.constructor.prototype.analyzePackage.call(
  manager,
  pkg,
  './node_modules/@coffic/cosy-db-ui'
);
console.log('分析结果:', analyzed);
