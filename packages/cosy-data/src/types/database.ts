export interface IDatabaseConfig {
  type: 'sqlite';
  filename: string;
}

export interface IColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: any;
  isPrimaryKey: boolean;
  isAutoIncrement: boolean;
}

export interface ITableInfo {
  name: string;
  columns: IColumnInfo[];
  indexes: any[];
  foreignKeys: any[];
  rowCount: number;
}

export interface IQueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTime: number;
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  defaultValue: any;
}

export interface DatabaseIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface DatabaseForeignKey {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete: string;
  onUpdate: string;
}

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  primaryKeys: string[];
  foreignKeys: DatabaseForeignKey[];
  indexes: DatabaseIndex[];
  rowCount: number;
}

export interface DatabaseInfo {
  name: string;
  type: string;
  version: string;
  size: number;
  tables: number;
  createdAt: Date;
  lastModified: Date;
}

export interface IConnectionInfo {
  id: string;
  config: IDatabaseConfig;
  connected: boolean;
  connectedAt: Date;
}

export type TableRecord = Record<string, any>;
export type QueryResult = IQueryResult;
