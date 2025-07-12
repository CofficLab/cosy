export interface DatabaseConnection {
  id?: string;
  name: string;
  type: 'sqlite' | 'mysql';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  file?: string; // SQLite 文件路径
  connected?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DatabaseTable {
  name: string;
  type: 'table' | 'view';
  rowCount?: number;
  columns: DatabaseColumn[];
  indexes?: DatabaseIndex[];
  foreignKeys?: DatabaseForeignKey[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isPrimaryKey?: boolean;
  isAutoIncrement?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
}

export interface DatabaseIndex {
  name: string;
  columns: string[];
  unique: boolean;
  type: 'primary' | 'unique' | 'index';
}

export interface DatabaseForeignKey {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

export interface TableRecord {
  [key: string]: any;
}

export interface QueryResult {
  rows: TableRecord[];
  rowCount: number;
  columns: string[];
  executionTime: number;
}

export interface DatabaseInfo {
  name: string;
  type: string;
  version: string;
  size?: number;
  tables: number;
  views: number;
  indexes: number;
  lastBackup?: Date;
}

export interface ConnectionConfig {
  connections: DatabaseConnection[];
  activeConnectionId?: string;
}

export interface SqlQuery {
  id: string;
  name: string;
  sql: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportOptions {
  format: 'sql' | 'csv' | 'json';
  tables: string[];
  includeSchema: boolean;
  includeData: boolean;
}

export interface ImportOptions {
  format: 'sql' | 'csv' | 'json';
  file: File;
  table?: string;
  createTable: boolean;
  truncateTable: boolean;
}
