/**
 * Centralized API fetch utility.
 * Automatically includes credentials and throws on non-OK responses.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Soft fetch — returns null on error instead of throwing.
 * Use in useQuery queryFns where an error should produce an empty state.
 */
export async function apiFetchSoft<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options);
  } catch {
    return null;
  }
}
