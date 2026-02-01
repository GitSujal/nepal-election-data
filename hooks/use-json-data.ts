import { useState, useEffect } from 'react';

export function useJsonData<T>(
  filename: string,
  filterFn?: (items: T[]) => T[]
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await fetch(`/data/${filename}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load ${filename}: ${response.status}`);
        }

        let items = await response.json();

        // Apply filter if provided
        if (filterFn) {
          items = filterFn(items);
        }

        if (isMounted) {
          setData(items);
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

    loadData();

    return () => {
      isMounted = false;
    };
  }, [filename, filterFn]);

  return { data, loading, error };
}
