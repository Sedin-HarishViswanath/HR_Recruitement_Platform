export function unwrapArray<T = unknown>(payload: unknown, keys: string[] = []): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    for (const key of keys) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }

    if (Array.isArray(record.data)) return record.data as T[];

    if (record.data && typeof record.data === 'object') {
      return unwrapArray<T>(record.data, keys);
    }
  }

  return [];
}
