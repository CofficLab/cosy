import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { databaseManager } from '../lib/database/database-manager';

async function getTableDataHandler({
  tableName,
  page = 1,
  pageSize = 50,
}: {
  tableName: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const data = await databaseManager.getTableData(tableName, page, pageSize);
    return {
      success: true,
      data,
      message: 'Table data retrieved successfully',
    };
  } catch (error) {
    console.error('Get table data error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve table data',
    };
  }
}

export const getTableData = defineAction({
  input: z.object({
    tableName: z.string(),
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(50),
  }),
  handler: getTableDataHandler,
});

export { getTableDataHandler };
