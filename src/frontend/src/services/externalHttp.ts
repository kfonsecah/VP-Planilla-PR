/**
 * Simple HTTP client for external API calls that MUST NOT include our backend tokens.
 * This prevents leaking internal JWTs to third-party services like OpenWeatherMap.
 */
export const externalHttp = {
  /**
   * Perform a GET request to an external URL.
   * Does NOT attach any internal Authorization headers.
   */
  async get<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    // Security: ensure no internal tokens are passed to external APIs
    headers.delete('Authorization');

    try {
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`External API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error(`Error fetching from external API [${url}]:`, error);
      throw error;
    }
  },

  /**
   * Perform a POST request to an external URL.
   */
  async post<T = any>(url: string, body?: any, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    // Security: ensure no internal tokens are passed to external APIs
    headers.delete('Authorization');
    
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`External API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error(`Error posting to external API [${url}]:`, error);
      throw error;
    }
  },
};
