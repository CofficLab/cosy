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

      // Delete existing database file to start fresh
      try {
        await fs.unlink(dbPath);
      } catch (error: any) {
        // Ignore error if file doesn't exist
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // The better-sqlite3 constructor will create the file if it doesn't exist.
      const db = new Database(dbPath);

      // Create tables
      db.exec(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE "orders" (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "user_id" INTEGER,
          "product_id" INTEGER,
          "quantity" INTEGER,
          "order_date" DATETIME,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(product_id) REFERENCES products(id)
        );
      `);

      // Populate tables with some data
      const insertUser = db.prepare(
        'INSERT INTO users (name, email) VALUES (?, ?)'
      );
      const insertProduct = db.prepare(
        'INSERT INTO products (name, price) VALUES (?, ?)'
      );
      const insertOrder = db.prepare(
        'INSERT INTO orders (user_id, product_id, quantity, order_date) VALUES (?, ?, ?, ?)'
      );

      const users = [
        { name: '张三', email: 'zhangsan@example.com' },
        { name: '李四', email: 'lisi@example.com' },
        { name: '王五', email: 'wangwu@example.com' },
      ];

      const products = [
        { name: '笔记本电脑', price: 7500.5 },
        { name: '无线鼠标', price: 125.0 },
        { name: '机械键盘', price: 475.99 },
        { name: '4K 显示器', price: 2300.0 },
        { name: 'USB-C 扩展坞', price: 350.0 },
      ];

      const orders = [
        { userId: 1, productId: 1, quantity: 1, date: '2023-01-15 10:30:00' },
        { userId: 1, productId: 3, quantity: 1, date: '2023-01-15 10:30:00' },
        { userId: 2, productId: 2, quantity: 2, date: '2023-02-20 14:00:00' },
        { userId: 3, productId: 4, quantity: 1, date: '2023-03-05 18:45:00' },
        { userId: 2, productId: 5, quantity: 1, date: '2023-04-10 09:00:00' },
      ];

      // Use a transaction for efficiency
      db.transaction(() => {
        for (const user of users) {
          insertUser.run(user.name, user.email);
        }
        for (const product of products) {
          insertProduct.run(product.name, product.price);
        }
        for (const order of orders) {
          insertOrder.run(
            order.userId,
            order.productId,
            order.quantity,
            order.date
          );
        }
      })();

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
