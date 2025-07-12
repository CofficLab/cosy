import type { APIRoute } from 'astro';
import { databaseManager } from '../../lib/database/database-manager';

export const GET: APIRoute = async () => {
  try {
    if (!databaseManager.isConnected()) {
      return new Response(
        JSON.stringify({ success: false, error: 'No database connection' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const tables = await databaseManager.getTables();

    return new Response(
      JSON.stringify({
        success: true,
        data: tables,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get tables error:', error);
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
