import type { APIRoute } from 'astro';
import { databaseManager } from '../../lib/database/database-manager';
import type { IDatabaseConfig } from '../../types/database';

export const POST: APIRoute = async ({ request }) => {
  try {
    const config: IDatabaseConfig = await request.json();

    console.log('config', config);

    if (!config.type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database type is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const testResult = await databaseManager.testConnection(config);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          connected: testResult.success,
          error: testResult.error,
        },
        message: testResult.success
          ? 'Connection test successful'
          : testResult.error || 'Connection test failed',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Connection test error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
