import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { databaseManager } from '../lib/database/database-manager';
import type { IDatabaseConfig } from '../types/database';

export const connectToDatabase = defineAction({
  input: z.object({
    type: z.literal('sqlite'),
    filename: z.string(),
  }),
  handler: async (input) => {
    try {
      const connectionId = await databaseManager.connect(
        input as IDatabaseConfig
      );
      return {
        success: true,
        connectionId,
        message: 'Connected successfully',
      };
    } catch (error) {
      console.error('Connection error:', error);
      return {
        success: false,
        connectionId: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Connection failed',
      };
    }
  },
});
