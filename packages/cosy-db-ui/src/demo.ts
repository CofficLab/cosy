#!/usr/bin/env node
import { DatabaseUIServer } from './server/DatabaseUIServer.js';

const server = new DatabaseUIServer({
  port: 8080,
  host: 'localhost',
  autoOpen: true,
  debug: true,
});

console.log('🚀 启动 Cosy Database UI 服务器...');

server
  .start()
  .then(() => {
    console.log('✅ 服务器启动成功！');
    console.log(`🌐 访问地址: ${server.getServerAddress()}`);
  })
  .catch((error) => {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  });

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...');
  await server.stop();
  console.log('👋 服务器已关闭');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 正在关闭服务器...');
  await server.stop();
  console.log('👋 服务器已关闭');
  process.exit(0);
});
