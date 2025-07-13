import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

interface DirEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const dir = url.searchParams.get('path') || '.';
  const rootPath = process.cwd();
  const requestedPath = path.resolve(rootPath, dir);

  // Security: Prevent directory traversal outside of project root
  if (!requestedPath.startsWith(rootPath)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Access Denied' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const entries = await fs.readdir(requestedPath, { withFileTypes: true });
    const tree: DirEntry[] = entries
      .map((entry) => ({
        name: entry.name,
        path: path.relative(rootPath, path.join(requestedPath, entry.name)),
        isDirectory: entry.isDirectory(),
      }))
      .sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

    return new Response(JSON.stringify({ success: true, tree }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return new Response(
        JSON.stringify({ success: false, error: 'Directory not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
