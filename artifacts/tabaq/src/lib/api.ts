const TOKEN_KEY = "tabaq_token";

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function getAuthHeaders(extraHeaders?: Record<string, string>): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders ?? {}),
  };
}

/**
 * Centralized API fetch utility.
 * Automatically includes JWT Bearer token and throws on non-OK responses.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      ...getAuthHeaders(),
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
