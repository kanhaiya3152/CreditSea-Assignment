import { getToken } from './session';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiClientError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  isFormData?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, isFormData = false } = options;

  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
      cache: 'no-store',
    });
  } catch {
    // fetch only rejects on a genuine network-level failure (offline, DNS, CORS block),
    // which would otherwise surface as an opaque "Failed to fetch".
    throw new ApiClientError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection and try again.');
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error?.message ?? 'Something went wrong. Please try again.';
    const code = data?.error?.code ?? 'UNKNOWN_ERROR';
    throw new ApiClientError(res.status, code, message);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  postForm: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST', body: formData, isFormData: true }),
};

export { API_URL };
