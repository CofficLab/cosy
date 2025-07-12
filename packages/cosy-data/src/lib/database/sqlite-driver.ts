import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import type {
  DatabaseTable,
  DatabaseColumn,
  DatabaseIndex,
  DatabaseForeignKey,
  DatabaseInfo,
  IDatabaseConfig,
  ITableInfo,
  IQueryResult,
  IColumnInfo,
} from '../../types/database';

export interface ISqliteDriver {
  connect(config: IDatabaseConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  testConnection(): Promise<boolean>;
  getTables(): Promise<ITableInfo[]>;
  getTableData(
    tableName: string,
    page?: number,
    pageSize?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    search?: string
  ): Promise<{ data: Record<string, any>[]; total: number }>;
  getTableStructure(tableName: string): Promise<DatabaseTable>;
  executeQuery(sql: string): Promise<IQueryResult>;
  insertRecord(tableName: string, record: Record<string, any>): Promise<void>;
  updateRecord(
    tableName: string,
    id: any,
    data: Record<string, any>
  ): Promise<void>;
  deleteRecord(tableName: string, id: any): Promise<void>;
  getDatabaseInfo(): Promise<DatabaseInfo>;
}

export class SqliteDriver implements ISqliteDriver {
  private sqlite: Database.Database | null = null;
  private db: ReturnType<typeof drizzle> | null = null;

  constructor() {}

  async connect(config: IDatabaseConfig): Promise<void> {
    console.log('SQLite connect', config);
    if (!config.filename) {
      throw new Error('SQLite filename is required');
    }

    try {
      this.sqlite = new Database(config.filename);
      this.db = drizzle(this.sqlite);

      // 测试连接
      this.sqlite.pragma('journal_mode = WAL');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to connect to SQLite database: ${errorMessage}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.sqlite) {
      this.sqlite.close();
      this.sqlite = null;
      this.db = null;
    }
  }

  isConnected(): boolean {
    return this.db !== null && this.sqlite !== null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.sqlite) {
      return false;
    }

    try {
      this.sqlite.prepare('SELECT 1').get();
      return true;
    } catch (error) {
      console.error('SQLite test connection failed:', error);
      return false;
    }
  }

  async getTables(): Promise<ITableInfo[]> {
    if (!this.sqlite) {
      throw new Error('Database not connected');
    }

    const tables = this.sqlite
      .prepare(
        `
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `
      )
      .all() as { name: string }[];

    const result: ITableInfo[] = [];

    for (const table of tables) {
      const columns = await this.getTableColumns(table.name);
      const indexes = await this.getTableIndexes(table.name);
      const foreignKeys = await this.getTableForeignKeys(table.name);
      const rowCount = await this.getTableRowCount(table.name);

      result.push({
        name: table.name,
        columns,
        indexes,
        foreignKeys,
        rowCount,
      });
    }

    return result;
  }

  async getTableData(
    tableName: string,
    page: number = 1,
    pageSize: number = 50,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc',
    search?: string
  ): Promise<{ data: Record<string, any>[]; total: number }> {
    if (!this.sqlite) {
      throw new Error('Database not connected');
    }

    let query = `SELECT * FROM "${tableName}"`;
    const params: any[] = [];

    if (search) {
      const columns = await this.getTableColumns(tableName);
      const searchConditions = columns
        .map((col) => `"${col.name}" LIKE ?`)
        .join(' OR ');
      query += ` WHERE ${searchConditions}`;
      columns.forEach(() => params.push(`%${search}%`));
    }

    if (sortBy) {
      query += ` ORDER BY "${sortBy}" ${sortOrder.toUpperCase()}`;
    }

    const offset = (page - 1) * pageSize;
    query += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const data = this.sqlite.prepare(query).all(...params);

    // 获取总行数
    let countQuery = `SELECT COUNT(*) as count FROM "${tableName}"`;
    const countParams: any[] = [];

    if (search) {
      const columns = await this.getTableColumns(tableName);
      const searchConditions = columns
        .map((col) => `"${col.name}" LIKE ?`)
        .join(' OR ');
      countQuery += ` WHERE ${searchConditions}`;
      columns.forEach(() => countParams.push(`%${search}%`));
    }

    const countResult = this.sqlite.prepare(countQuery).get(...countParams) as {
      count: number;
    };

    return {
      data: data as Record<string, any>[],
      total: countResult.count,
    };
  }

  async executeQuery(sqlQuery: string): Promise<IQueryResult> {
    if (!this.sqlite) {
      throw new Error('Database not connected');
    }

    const startTime = Date.now();

    try {
      const stmt = this.sqlite.prepare(sqlQuery);
      const result = stmt.all();
      const executionTime = Date.now() - startTime;

      if (result.length === 0) {
        return {
          columns: [],
          rows: [],
          rowCount: 0,
          executionTime,
        };
      }

      const columns = Object.keys(result[0] as Record<string, any>);

      return {
        columns,
        rows: result as Record<string, any>[],
        rowCount: result.length,
        executionTime,
      };
    } catch (error) {
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  async insertRecord(
    tableName: string,
    data: Record<string, any>
  ): Promise<void> {
    if (!this.sqlite) {
      throw new Error('Database not connected');
    }

    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const query = `INSERT INTO "${tableName}" (${columns.map((col) => `"${col}"`).join(', ')}) VALUES (${placeholders})`;

    try {
      this.sqlite.prepare(query).run(...values);
    } catch (error) {
      throw new Error(`Failed to insert record: ${error}`);
    }
  }

  async updateRecord(
    tableName: string,
    id: any,
    data: Record<string, any>
  ): Promise<void> {
    if (!this.sqlite) {
      throw new Error('Database not connected');
    }

    const columns = Object.keys(data);
    const setClause = columns.map((col) => `"${col}" = ?`).join(', ');
    const values = [...Object.values(data), id];

    const query = `UPDATE "${tableName}" SET ${setClause} WHERE rowid = ?`;

    try {
      this.sqlite.prepare(query).run(...values);
    } catch (error) {
      throw new Error(`Failed to update record: ${error}`);
    }
  }

  async deleteRecord(tableName: string, id: any): Promise<void> {
    if (!this.sqlite) {
      throw new Error('Database not connected');
    }

    const query = `DELETE FROM "${tableName}" WHERE rowid = ?`;

    try {
      this.sqlite.prepare(query).run(id);
    } catch (error) {
      throw new Error(`Failed to delete record: ${error}`);
    }
  }

  private async getTableColumns(tableName: string): Promise<IColumnInfo[]> {
    if (!this.sqlite) {
      throw new Error('Database not connected');
    }

    const columns = this.sqlite
      .prepare(`PRAGMA table_info("${tableName}")`)
      .all() as any[];

    return columns.map((col: any) => ({
      name: col.name,
      type: col.type,
      nullable: col.notnull === 0,
      defaultValue: col.dflt_value,
      isPrimaryKey: col.pk === 1,
      isAutoIncrement: col.pk === 1 && col.type.toUpperCase() === 'INTEGER',
    }));
  }

  private async getTableIndexes(tableName: string): Promise<any[]> {
    if (!this.sqlite) {
      throw new Error('Database not connected');
    }

    const indexes = this.sqlite
      .prepare(`PRAGMA index_list("${tableName}")`)
      .all() as any[];

    return indexes.map((index: any) => ({
      name: index.name,
      columns: [], // SQLite需要额外查询获取列信息
      unique: index.unique === 1,
    }));
  }

  private async getTableForeignKeys(tableName: string): Promise<any[]> {
    if (!this.sqlite) {
      throw new Error('Database not connected');
    }

    const foreignKeys = this.sqlite
      .prepare(`PRAGMA foreign_key_list("${tableName}")`)
      .all() as any[];

    return foreignKeys.map((fk: any) => ({
      name: `fk_${tableName}_${fk.from}`,
      column: fk.from,
      referencedTable: fk.table,
      referencedColumn: fk.to,
    }));
  }

  private async getTableRowCount(tableName: string): Promise<number> {
    if (!this.sqlite) {
      throw new Error('Database not connected');
    }

    const result = this.sqlite
      .prepare(`SELECT COUNT(*) as count FROM "${tableName}"`)
      .get() as { count: number };
    return result.count;
  }

  async getTableStructure(tableName: string): Promise<DatabaseTable> {
    if (!this.sqlite) {
      throw new Error('数据库未连接');
    }

    try {
      // 获取列信息
      const columnsInfo = this.sqlite
        .prepare(`PRAGMA table_info("${tableName}")`)
        .all() as any[];

      const columns: DatabaseColumn[] = columnsInfo.map((col: any) => ({
        name: col.name,
        type: col.type,
        nullable: col.notnull === 0,
        primaryKey: col.pk === 1,
        autoIncrement: col.pk === 1 && col.type.toUpperCase() === 'INTEGER',
        defaultValue: col.dflt_value,
      }));

      // 获取主键
      const primaryKeys = columns
        .filter((col) => col.primaryKey)
        .map((col) => col.name);

      // 获取外键
      const foreignKeysInfo = this.sqlite
        .prepare(`PRAGMA foreign_key_list("${tableName}")`)
        .all() as any[];

      const foreignKeys: DatabaseForeignKey[] = foreignKeysInfo.map(
        (fk: any) => ({
          name: `fk_${tableName}_${fk.from}`,
          column: fk.from,
          referencedTable: fk.table,
          referencedColumn: fk.to,
          onDelete: fk.on_delete,
          onUpdate: fk.on_update,
        })
      );

      // 获取索引
      const indexesInfo = this.sqlite
        .prepare(`PRAGMA index_list("${tableName}")`)
        .all() as any[];

      const indexes: DatabaseIndex[] = [];
      for (const idx of indexesInfo) {
        const indexColumns = this.sqlite
          .prepare(`PRAGMA index_info("${idx.name}")`)
          .all() as any[];

        indexes.push({
          name: idx.name,
          columns: indexColumns.map((col: any) => col.name),
          unique: idx.unique === 1,
        });
      }

      // 获取行数
      const countResult = this.sqlite
        .prepare(`SELECT COUNT(*) as count FROM "${tableName}"`)
        .get() as { count: number };

      return {
        name: tableName,
        columns,
        primaryKeys,
        foreignKeys,
        indexes,
        rowCount: countResult.count,
      };
    } catch (error) {
      throw new Error(
        `获取表结构失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  async getDatabaseInfo(): Promise<DatabaseInfo> {
    if (!this.sqlite) {
      throw new Error('数据库未连接');
    }

    try {
      // 获取SQLite版本
      const versionResult = this.sqlite
        .prepare('SELECT sqlite_version() as version')
        .get() as { version: string };

      // 获取表数量
      const tablesResult = this.sqlite
        .prepare(
          `
        SELECT COUNT(*) as count FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `
        )
        .get() as { count: number };

      return {
        name: 'SQLite Database',
        type: 'sqlite',
        version: versionResult.version,
        size: 0, // 暂时设为0，避免文件系统访问
        tables: tablesResult.count,
        createdAt: new Date(),
        lastModified: new Date(),
      };
    } catch (error) {
      throw new Error(
        `获取数据库信息失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }
}
