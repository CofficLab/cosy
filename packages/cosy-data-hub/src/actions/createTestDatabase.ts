import { defineAction } from 'astro:actions';
import path from 'node:path';
import fs from 'node:fs/promises';
import Database from 'better-sqlite3';

export const createTestDatabase = defineAction({
  accept: 'json',
  handler: async () => {
    try {
      // Astro's CWD is the root of the Astro project, which is packages/cosy-data-hub
      const tempDir = path.resolve(process.cwd(), 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      const dbPath = path.join(tempDir, 'test.db');
      const relativeDbPath = './temp/test.db';

      // The better-sqlite3 constructor will create the file if it doesn't exist.
      const db = new Database(dbPath);
      db.close();

      return {
        success: true,
        message: '测试数据库创建成功',
        path: relativeDbPath,
      };
    } catch (error) {
      console.error('Failed to create test database:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '创建测试数据库时发生未知错误',
      };
    }
  },
});
