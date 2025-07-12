import type {
  DatabaseTable,
  DatabaseInfo,
  IDatabaseConfig,
  IConnectionInfo,
  ITableInfo,
  IQueryResult,
} from '../../types/database';
import { SqliteDriver } from './sqlite-driver';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private connections: Map<string, SqliteDriver> = new Map();
  private activeConnection: string | null = null;

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 连接数据库
   */
  async connect(config: IDatabaseConfig): Promise<string> {
    const connectionId = `${config.type}_${Date.now()}`;
    const driver = new SqliteDriver();

    await driver.connect(config);
    this.connections.set(connectionId, driver);
    this.activeConnection = connectionId;

    return connectionId;
  }

  /**
   * 断开连接
   */
  async disconnect(connectionId?: string): Promise<void> {
    const id = connectionId || this.activeConnection;
    if (!id) return;

    const driver = this.connections.get(id);
    if (driver) {
      await driver.disconnect();
      this.connections.delete(id);

      if (this.activeConnection === id) {
        this.activeConnection = null;
      }
    }
  }

  /**
   * 断开所有连接
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.connections.entries()).map(
      ([id, driver]) => driver.disconnect()
    );

    await Promise.all(promises);
    this.connections.clear();
    this.activeConnection = null;
  }

  /**
   * 获取当前活动的驱动
   */
  getActiveDriver(): SqliteDriver | null {
    if (!this.activeConnection) return null;
    return this.connections.get(this.activeConnection) || null;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.activeConnection !== null;
  }

  /**
   * 测试数据库连接
   */
  async testConnection(
    config: IDatabaseConfig
  ): Promise<{ success: boolean; error?: string }> {
    console.log('testConnection', config);
    const driver = new SqliteDriver();
    try {
      await driver.connect(config);
      const result = await driver.testConnection();
      await driver.disconnect();
      return {
        success: result,
        error: result ? undefined : 'Connection test failed',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown connection error',
      };
    }
  }

  /**
   * 获取表列表
   */
  async getTables(): Promise<ITableInfo[]> {
    const driver = this.getActiveDriver();
    if (!driver) {
      return [];
    }
    return await driver.getTables();
  }

  /**
   * 获取表数据
   */
  async getTableData(
    tableName: string,
    page = 1,
    pageSize = 50
  ): Promise<{ data: Record<string, any>[]; total: number }> {
    const driver = this.getActiveDriver();
    if (!driver) {
      return { data: [], total: 0 };
    }
    return await driver.getTableData(tableName, page, pageSize);
  }

  /**
   * 获取表结构
   */
  async getTableStructure(tableName: string): Promise<DatabaseTable> {
    const driver = this.getActiveDriver();
    if (!driver) {
      throw new Error('No active database connection');
    }
    return await driver.getTableStructure(tableName);
  }

  /**
   * 执行SQL查询
   */
  async executeQuery(sql: string): Promise<IQueryResult> {
    const driver = this.getActiveDriver();
    if (!driver) {
      throw new Error('No active database connection');
    }
    return await driver.executeQuery(sql);
  }

  /**
   * 插入记录
   */
  async insertRecord(
    tableName: string,
    record: Record<string, any>
  ): Promise<void> {
    const driver = this.getActiveDriver();
    if (!driver) {
      throw new Error('No active database connection');
    }
    await driver.insertRecord(tableName, record);
  }

  /**
   * 更新记录
   */
  async updateRecord(
    tableName: string,
    id: any,
    data: Record<string, any>
  ): Promise<void> {
    const driver = this.getActiveDriver();
    if (!driver) {
      throw new Error('No active database connection');
    }
    await driver.updateRecord(tableName, id, data);
  }

  /**
   * 删除记录
   */
  async deleteRecord(tableName: string, id: any): Promise<void> {
    const driver = this.getActiveDriver();
    if (!driver) {
      throw new Error('No active database connection');
    }
    await driver.deleteRecord(tableName, id);
  }

  /**
   * 获取数据库信息
   */
  async getDatabaseInfo(): Promise<DatabaseInfo> {
    const driver = this.getActiveDriver();
    if (!driver) {
      throw new Error('No active database connection');
    }
    return await driver.getDatabaseInfo();
  }

  /**
   * 获取活动连接数量
   */
  getActiveConnectionsCount(): number {
    return this.connections.size;
  }

  /**
   * 获取所有连接ID
   */
  getAllConnectionIds(): string[] {
    return Array.from(this.connections.keys());
  }

  getConnectionInfo(): IConnectionInfo | null {
    if (!this.activeConnection) return null;

    return {
      id: this.activeConnection,
      config: { type: 'sqlite', filename: '' }, // 简化配置
      connected: true,
      connectedAt: new Date(),
    };
  }
}

// 导出单例实例
export const databaseManager = DatabaseManager.getInstance();
