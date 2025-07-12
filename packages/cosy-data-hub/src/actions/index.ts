export { testConnection } from './testConnection';
export { connectToDatabase } from './connectToDatabase';
export { getTables } from './getTables';
export { executeQuery } from './executeQuery';
export { getTableData } from './getTableData';

import { testConnection } from './testConnection';
import { connectToDatabase } from './connectToDatabase';
import { getTables } from './getTables';
import { executeQuery } from './executeQuery';
import { getTableData } from './getTableData';

export const server = {
  testConnection,
  connectToDatabase,
  getTables,
  executeQuery,
  getTableData,
};
