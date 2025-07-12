import type { APIRoute } from 'astro';
import { databaseManager } from '../../../../lib/database/database-manager';

export const GET: APIRoute = async ({ params }) => {
  try {
    const tableName = params.tableName;

    if (!tableName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Table name is required' }),
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

    const data = await databaseManager.getTableData(tableName);

    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get table data error:', error);
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
