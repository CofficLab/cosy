import { testConnection } from './testConnection';
import { connectToDatabase } from './connectToDatabase';
import { disconnectDatabase } from './disconnectDatabase';
import { getTables } from './getTables';
import { getTableData } from './getTableData';
import { executeQuery } from './executeQuery';
import { createTestDatabase } from './createTestDatabase';

export const server = {
  testConnection,
  connectToDatabase,
  disconnectDatabase,
  getTables,
  getTableData,
  executeQuery,
  createTestDatabase,
};
