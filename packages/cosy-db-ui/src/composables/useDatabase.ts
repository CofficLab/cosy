import { ref } from 'vue';
import type {
  DatabaseConnection,
  DatabaseTable,
  TableRecord,
  QueryResult,
  DatabaseInfo,
} from '@/types/database';

// API 基础地址
const API_BASE = '/api';

// 全局状态
const currentConnection = ref<DatabaseConnection | null>(null);
const isConnected = ref(false);
const connectionError = ref<string | null>(null);

export function useDatabase() {
  // 连接数据库
  const connect = async (connection: DatabaseConnection): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '连接失败');
      }

      const result = await response.json();
      currentConnection.value = { ...connection, ...result };
      isConnected.value = true;
      connectionError.value = null;
    } catch (error) {
      connectionError.value =
        error instanceof Error ? error.message : '连接失败';
      isConnected.value = false;
      throw error;
    }
  };

  // 断开连接
  const disconnect = async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/disconnect`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('断开连接失败:', error);
    } finally {
      currentConnection.value = null;
      isConnected.value = false;
      connectionError.value = null;
    }
  };

  // 获取表列表
  const getTables = async (): Promise<DatabaseTable[]> => {
    if (!isConnected.value) {
      throw new Error('未连接到数据库');
    }

    const response = await fetch(`${API_BASE}/tables`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取表列表失败');
    }

    return await response.json();
  };

  // 获取表数据
  const getTableData = async (
    tableName: string,
    page = 1,
    pageSize = 100
  ): Promise<TableRecord[]> => {
    if (!isConnected.value) {
      throw new Error('未连接到数据库');
    }

    const response = await fetch(
      `${API_BASE}/tables/${encodeURIComponent(tableName)}/data?page=${page}&pageSize=${pageSize}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取表数据失败');
    }

    return await response.json();
  };

  // 获取表结构
  const getTableStructure = async (
    tableName: string
  ): Promise<DatabaseTable> => {
    if (!isConnected.value) {
      throw new Error('未连接到数据库');
    }

    const response = await fetch(
      `${API_BASE}/tables/${encodeURIComponent(tableName)}/structure`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取表结构失败');
    }

    return await response.json();
  };

  // 执行 SQL 查询
  const executeSql = async (sql: string): Promise<QueryResult> => {
    if (!isConnected.value) {
      throw new Error('未连接到数据库');
    }

    const response = await fetch(`${API_BASE}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'SQL 执行失败');
    }

    return await response.json();
  };

  // 插入记录
  const insertRecord = async (
    tableName: string,
    record: TableRecord
  ): Promise<void> => {
    if (!isConnected.value) {
      throw new Error('未连接到数据库');
    }

    const response = await fetch(
      `${API_BASE}/tables/${encodeURIComponent(tableName)}/records`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '插入记录失败');
    }
  };

  // 更新记录
  const updateRecord = async (
    tableName: string,
    record: TableRecord,
    where: Record<string, any>
  ): Promise<void> => {
    if (!isConnected.value) {
      throw new Error('未连接到数据库');
    }

    const response = await fetch(
      `${API_BASE}/tables/${encodeURIComponent(tableName)}/records`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ record, where }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '更新记录失败');
    }
  };

  // 删除记录
  const deleteRecord = async (
    tableName: string,
    where: Record<string, any>
  ): Promise<void> => {
    if (!isConnected.value) {
      throw new Error('未连接到数据库');
    }

    const response = await fetch(
      `${API_BASE}/tables/${encodeURIComponent(tableName)}/records`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ where }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '删除记录失败');
    }
  };

  // 获取数据库信息
  const getDatabaseInfo = async (): Promise<DatabaseInfo> => {
    if (!isConnected.value) {
      throw new Error('未连接到数据库');
    }

    const response = await fetch(`${API_BASE}/info`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取数据库信息失败');
    }

    return await response.json();
  };

  // 导出数据
  const exportData = async (
    format: 'sql' | 'csv' | 'json',
    tables: string[]
  ): Promise<Blob> => {
    if (!isConnected.value) {
      throw new Error('未连接到数据库');
    }

    const response = await fetch(`${API_BASE}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ format, tables }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '导出数据失败');
    }

    return await response.blob();
  };

  // 测试连接
  const testConnection = async (
    connection: DatabaseConnection
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  };

  return {
    // 状态
    currentConnection,
    isConnected,
    connectionError,

    // 方法
    connect,
    disconnect,
    getTables,
    getTableData,
    getTableStructure,
    executeSql,
    insertRecord,
    updateRecord,
    deleteRecord,
    getDatabaseInfo,
    exportData,
    testConnection,
  };
}
