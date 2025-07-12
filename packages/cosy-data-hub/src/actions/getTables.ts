import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { databaseManager } from '../lib/database/database-manager';

export const getTables = defineAction({
  input: z.object({}),
  handler: async () => {
    try {
      const tables = await databaseManager.getTables();
      return {
        success: true,
        data: tables,
        message: 'Tables retrieved successfully',
      };
    } catch (error) {
      console.error('Get tables error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve tables',
      };
    }
  },
});
