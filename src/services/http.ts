import { config } from '../config/env';

export class ApiError extends Error {
  public code?: string;
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined>;
}

export const http = {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { timeoutMs = 8000, params, headers, ...customConfig } = options;

    let url = `${config.apiBaseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      const response = await fetch(url, {
        ...customConfig,
        headers: {
          ...defaultHeaders,
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-2xx responses
      if (!response.ok) {
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch {
          // Response body was not JSON
        }

        // Normalize FastAPI error structures:
        // FastAPI returns { detail: "..." } or { detail: [{ loc: [...], msg: "..." }] }
        // Custom error format: { message: "...", code: "..." }
        let errorMessage = response.statusText || 'Network request failed';
        let errorCode: string | undefined = undefined;

        if (errorData) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
          if (errorData.code) {
            errorCode = errorData.code;
          }
        }

        throw new ApiError(errorMessage, response.status, errorCode, errorData);
      }

      // 204 No Content
      if (response.status === 204) {
        return null as unknown as T;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        throw err;
      }

      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError(`Request timeout after ${timeoutMs}ms`, 408, 'REQUEST_TIMEOUT');
      }

      const message = err instanceof Error ? err.message : 'Unknown communication error';
      throw new ApiError(message, 0, 'NETWORK_ERROR');
    }
  },

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
