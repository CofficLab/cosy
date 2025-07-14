import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { databaseManager } from '../lib/database/database-manager';

export const disconnectDatabase = defineAction({
  input: z.object({
    connectionId: z.string().optional(),
  }),
  handler: async ({ connectionId }) => {
    try {
      await databaseManager.disconnect(connectionId);

      return {
        success: true,
        message: '数据库连接已断开',
      };
    } catch (error) {
      console.error('Disconnect database error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
