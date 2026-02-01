import * as duckdb from '@duckdb/duckdb-wasm';

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

export async function getDuckDB() {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    try {
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();
      const db = new duckdb.AsyncDuckDB(logger, worker);

      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      // Fetch the database file as blob
      const dbUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/election_lean.duckdb`
        : '/election_lean.duckdb';

      console.log('[DuckDB] Fetching database from:', dbUrl);

      const response = await fetch(dbUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      console.log('[DuckDB] Downloaded', Math.round(buffer.byteLength / 1024 / 1024), 'MB');

      // Register the fetched data as a file
      await db.registerFileBuffer('election_lean.duckdb', new Uint8Array(buffer));
      console.log('[DuckDB] File registered');

      // Open the database
      await db.open({ path: 'election_lean.duckdb' });
      console.log('[DuckDB] Database opened');

      // Test the connection
      const conn = await db.connect();
      const tablesResult = await conn.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' LIMIT 10`
      );
      const tables = tablesResult.toArray().map((row) => row.toJSON());
      console.log('[DuckDB] Available tables:', tables.length, 'tables found');

      await conn.close();
      return db;
    } catch (error) {
      console.error('[DuckDB] Initialization error:', error);
      throw error;
    }
  })();

  return dbPromise;
}

export async function queryDuckDB(sql: string) {
  try {
    const db = await getDuckDB();
    const conn = await db.connect();
    try {
      console.log('[DuckDB] Executing query:', sql.substring(0, 80));
      const result = await conn.query(sql);
      const data = result.toArray().map((row) => row.toJSON());
      console.log('[DuckDB] Query returned', data.length, 'rows');
      return data;
    } finally {
      await conn.close();
    }
  } catch (error) {
    console.error('[DuckDB] Query error:', error);
    throw error;
  }
}
