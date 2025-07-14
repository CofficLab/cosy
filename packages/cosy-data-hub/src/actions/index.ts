import { testConnection } from './testConnection';
import { connectToDatabase } from './connectToDatabase';
import { getTables } from './getTables';
import { getTableData } from './getTableData';
import { executeQuery } from './executeQuery';
import { createTestDatabase } from './createTestDatabase';

export const actions = {
  testConnection,
  connectToDatabase,
  getTables,
  getTableData,
  executeQuery,
  createTestDatabase,
};
