// src/services/ApiClient.js
// Client HTTP unique vers l'API NestJS. Gère le jeton de session et les erreurs.

const TOKEN_KEY = 'cm_auth_token';
const USER_KEY = 'cm_auth_user';

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

class ApiClient {
  constructor() {
    // En production le front est servi par le même hôte que l'API (préfixe /api).
    // En développement, CRA proxyfie /api vers le serveur Nest (voir "proxy" dans package.json).
    this.baseUrl = (process.env.REACT_APP_API_URL || '/api').replace(/\/$/, '');
    this.listeners = new Set();
  }

  // ---------------------------------------------------------------- Session

  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  setSession(token, user) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user || null));
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.error('Impossible de mémoriser la session :', e);
    }
  }

  getStoredUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /** Abonnement aux déconnexions forcées (jeton expiré ou invalide). */
  onUnauthorized(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ---------------------------------------------------------------- Requêtes

  async request(method, path, body, options = {}) {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const init = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, init);
    } catch (networkError) {
      throw new ApiError("Impossible de joindre le serveur. Vérifiez votre connexion.", 0, null);
    }

    if (response.status === 401 && !options.skipAuthHandling) {
      this.setSession(null, null);
      this.listeners.forEach((listener) => {
        try {
          listener();
        } catch (e) {
          /* ignore */
        }
      });
    }

    if (options.raw) {
      if (!response.ok) {
        const payload = await this.parseBody(response);
        throw new ApiError(this.extractMessage(payload, response), response.status, payload);
      }
      return response;
    }

    const payload = await this.parseBody(response);
    if (!response.ok) {
      throw new ApiError(this.extractMessage(payload, response), response.status, payload);
    }
    return payload;
  }

  async parseBody(response) {
    const type = response.headers.get('content-type') || '';
    if (response.status === 204) return null;
    if (type.includes('application/json')) {
      try {
        return await response.json();
      } catch (e) {
        return null;
      }
    }
    try {
      return await response.text();
    } catch (e) {
      return null;
    }
  }

  extractMessage(payload, response) {
    if (payload && typeof payload === 'object') {
      const message = payload.message;
      if (Array.isArray(message)) return message.join(', ');
      if (typeof message === 'string') return message;
      if (typeof payload.error === 'string') return payload.error;
    }
    if (typeof payload === 'string' && payload.trim()) return payload.slice(0, 200);
    return `Erreur ${response.status}`;
  }

  /** Construit une query string en ignorant les valeurs vides. */
  query(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      search.append(key, value instanceof Date ? value.toISOString() : String(value));
    });
    const qs = search.toString();
    return qs ? `?${qs}` : '';
  }

  get(path, params) {
    return this.request('GET', `${path}${this.query(params)}`);
  }

  post(path, body) {
    return this.request('POST', path, body === undefined ? {} : body);
  }

  put(path, body) {
    return this.request('PUT', path, body);
  }

  patch(path, body) {
    return this.request('PATCH', path, body);
  }

  delete(path) {
    return this.request('DELETE', path);
  }

  /** Requête renvoyant un fichier binaire (PDF). */
  async postBlob(path, body) {
    const response = await this.request('POST', path, body, { raw: true });
    return response.blob();
  }
}

export default new ApiClient();
