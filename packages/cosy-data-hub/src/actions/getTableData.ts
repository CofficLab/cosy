import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { databaseManager } from '../lib/database/database-manager';

export const getTableData = defineAction({
  input: z.object({
    tableName: z.string(),
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(50),
  }),
  handler: async (input) => {
    try {
      const data = await databaseManager.getTableData(
        input.tableName,
        input.page,
        input.pageSize
      );
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
  },
});
