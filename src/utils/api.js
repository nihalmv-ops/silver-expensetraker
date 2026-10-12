/**
 * API client for Silver Catering backend with offline fallback and zero data loss.
 * Preserves localStorage at all times as the resilient primary or sync cache.
 */

const STORAGE_KEY_BACKEND_URL = 'silver_catering_backend_url_v1';
const DEFAULT_LOCAL_URL = 'http://localhost:5050';

export function getApiBaseUrl() {
  const custom = localStorage.getItem(STORAGE_KEY_BACKEND_URL);
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  // In production (e.g. https://silverexpensetraker.vercel.app), use relative path so API calls hit same-origin /api
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '';
  }
  return DEFAULT_LOCAL_URL;
}

export function setApiBaseUrl(url) {
  if (!url || !url.trim()) {
    localStorage.removeItem(STORAGE_KEY_BACKEND_URL);
  } else {
    localStorage.setItem(STORAGE_KEY_BACKEND_URL, url.trim().replace(/\/+$/, ''));
  }
}

/**
 * Robust fetch wrapper with timeout
 */
async function fetchWithTimeout(endpoint, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(id);

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: (data && data.error) || `HTTP error ${res.status}`,
      };
    }

    return { success: true, ...data };
  } catch (err) {
    clearTimeout(id);
    return {
      success: false,
      offline: true,
      error: err.name === 'AbortError' ? 'Backend connection timed out' : (err.message || 'Network error'),
    };
  }
}

export const api = {
  /**
   * Check connection to backend & MongoDB
   */
  async checkHealth() {
    const res = await fetchWithTimeout('/api/health', { method: 'GET' }, 4000);
    if (res.success && res.status === 'ok') {
      return {
        connected: true,
        database: res.database,
        version: res.version,
      };
    }
    return {
      connected: false,
      error: res.error || 'Cannot reach server',
    };
  },

  /**
   * Fetch all events from MongoDB
   */
  async getEvents() {
    return fetchWithTimeout('/api/events', { method: 'GET' });
  },

  /**
   * Create or update a single event in MongoDB
   */
  async saveEvent(event) {
    return fetchWithTimeout('/api/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  /**
   * Delete an event from MongoDB
   */
  async deleteEvent(id) {
    return fetchWithTimeout(`/api/events/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Safe sync & migration:
   * Uploads local events to MongoDB and returns merged collection.
   * GUARANTEED: Does not delete local events.
   */
  async syncEvents(localEvents) {
    return fetchWithTimeout('/api/events/sync', {
      method: 'POST',
      body: JSON.stringify({ events: localEvents }),
    }, 15000);
  },

  /**
   * Fetch categories from backend
   */
  async getCategories() {
    return fetchWithTimeout('/api/categories', { method: 'GET' });
  },

  /**
   * Sync categories with backend
   */
  async syncCategories(categories) {
    return fetchWithTimeout('/api/categories/sync', {
      method: 'POST',
      body: JSON.stringify(categories),
    });
  },
};
