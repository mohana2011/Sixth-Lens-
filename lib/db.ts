import { Pool, type QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __slPgPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  return new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=disable')
      ? false
      : { rejectUnauthorized: false },
    max: 10,
  });
}

// Lazily created on first query, not at module load, so simply importing
// this file (e.g. during `next build`'s route analysis) never requires
// DATABASE_URL to be set. Reused across hot reloads / warm invocations.
function getPool(): Pool {
  if (!global.__slPgPool) {
    global.__slPgPool = createPool();
  }
  return global.__slPgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  return getPool().query<T>(text, params);
}

export async function withClient<T>(fn: (client: import('pg').PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
