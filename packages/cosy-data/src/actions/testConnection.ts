import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { databaseManager } from '../lib/database/database-manager';
import type { IDatabaseConfig } from '../types/database';

export const testConnection = defineAction({
  input: z.object({
    type: z.literal('sqlite'),
    filename: z.string(),
  }),
  handler: async (input) => {
    try {
      const testResult = await databaseManager.testConnection(
        input as IDatabaseConfig
      );
      return {
        success: true,
        connected: testResult.success,
        error: testResult.error,
        message: testResult.success
          ? 'Connection test successful'
          : testResult.error || 'Connection test failed',
      };
    } catch (error) {
      console.error('Connection test error:', error);
      return {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Connection test failed',
      };
    }
  },
});
