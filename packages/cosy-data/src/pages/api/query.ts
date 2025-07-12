import type { APIRoute } from 'astro';
import { databaseManager } from '../../lib/database/database-manager';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { sql } = await request.json();

    if (!sql) {
      return new Response(
        JSON.stringify({ success: false, error: 'SQL query is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!databaseManager.isConnected()) {
      return new Response(
        JSON.stringify({ success: false, error: 'No database connection' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await databaseManager.executeQuery(sql);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Query execution error:', error);
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
