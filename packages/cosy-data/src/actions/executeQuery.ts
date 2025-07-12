import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { databaseManager } from '../lib/database/database-manager';

export const executeQuery = defineAction({
  input: z.object({
    sql: z.string(),
  }),
  handler: async (input) => {
    try {
      const result = await databaseManager.executeQuery(input.sql);
      return {
        success: true,
        data: result,
        message: 'Query executed successfully',
      };
    } catch (error) {
      console.error('Query execution error:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Query execution failed',
      };
    }
  },
});
