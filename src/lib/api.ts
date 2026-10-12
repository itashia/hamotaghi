import { isTauri } from "@tauri-apps/api/core";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");
const TOKEN_KEY = "hamotaghi-api-token-v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (isTauri()) headers.set("X-Tauri-App", "1");

  if (!isTauri() && !["GET", "HEAD", "OPTIONS"].includes((options.method ?? "GET").toUpperCase())) {
    await fetch(`${API_URL.replace(/\/api\/v1$/, "")}/sanctum/csrf-cookie`, { credentials: "include" });
    const csrf = document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
      ?.slice("XSRF-TOKEN=".length);
    if (csrf) headers.set("X-XSRF-TOKEN", decodeURIComponent(csrf));
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
  } catch {
    throw new ApiError("ارتباط با سرور برقرار نشد. اتصال و نشانی API را بررسی کنید.", 0);
  }
  const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login" && path !== "/auth/register")
      window.dispatchEvent(new Event("hamotaghi:session-expired"));
    const errors = (result.errors && typeof result.errors === "object" ? result.errors : {}) as Record<
      string,
      string[]
    >;
    throw new ApiError(
      typeof result.message === "string" ? result.message : "درخواست انجام نشد.",
      response.status,
      errors,
    );
  }
  if (typeof result.token === "string") localStorage.setItem(TOKEN_KEY, result.token);
  return result as T;
}

export function apiJson(method: string, body?: unknown): RequestInit {
  return { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) };
}

export function clearApiToken() {
  localStorage.removeItem(TOKEN_KEY);
}
export const apiUrl = API_URL;
