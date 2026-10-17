function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    // If deployed on Vercel or cloud domain, do not attempt to contact localhost
    if (!isLocalhost && envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return '/api/v1';
    }
  }
  return process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
    : '/api/v1';
}

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

let authToken: string | null = null;
if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('techassess_token');
}

export function setApiToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('techassess_token', token);
    } else {
      localStorage.removeItem('techassess_token');
    }
  }
}

export function getApiToken(): string | null {
  if (typeof window !== 'undefined' && !authToken) {
    authToken = localStorage.getItem('techassess_token');
  }
  return authToken;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getApiToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const base = getApiBase();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;

  // 15 second client timeout to prevent indefinite hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers,
      credentials: 'include',
    });
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);
    if (fetchErr.name === 'AbortError') {
      throw new ApiError('Request timed out (15s). The database or server took too long to respond.', 504);
    }
    throw new ApiError(`Network error: ${fetchErr.message || 'Unable to connect to server'}`, 0);
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return (await response.text()) as any;
  }

  let data: any;
  try {
    data = await response.json();
  } catch (err) {
    throw new ApiError('Failed to parse server response', response.status);
  }

  if (!response.ok || data.success === false) {
    throw new ApiError(
      data.error || 'An unexpected error occurred',
      response.status,
      data.details || data.errors
    );
  }

  return data.data !== undefined ? data.data : data;
}
