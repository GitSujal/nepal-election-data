import { useState, useEffect } from 'react';
import { queryDuckDB } from '@/lib/duckdb';

export function useDuckDBQuery<T>(sql: string | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sql) return;

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await queryDuckDB(sql);
        if (isMounted) {
          setData(result as T[]);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [sql]);

  return { data, loading, error };
}
