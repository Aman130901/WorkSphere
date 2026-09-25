const API_BASE = "/api";

export const api = {
  getToken: (): string | null => localStorage.getItem("acme_token"),
  setToken: (token: string) => localStorage.setItem("acme_token", token),
  clearToken: () => {
    localStorage.removeItem("acme_token");
    localStorage.removeItem("acme_user");
  },

  getHeaders: () => {
    const token = api.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...api.getHeaders(), ...options.headers };
    
    const config = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    
    if (response.status === 401 || response.status === 403) {
      // Token expired or invalid, auto logout client
      api.clearToken();
      if (window.location.pathname !== "/") {
        window.location.href = "/?session_expired=true";
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "An unexpected error occurred.");
    }

    return response.json() as Promise<T>;
  },

  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return api.request<T>(endpoint, { method: "GET", headers });
  },

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return api.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      headers,
    });
  },

  put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return api.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      headers,
    });
  },

  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return api.request<T>(endpoint, { method: "DELETE", headers });
  }
};
