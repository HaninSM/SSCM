/**
 * API Fetch Client with JWT Handling
 */
const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('sscm_token');
  },

  setToken(token) {
    localStorage.setItem('sscm_token', token);
  },

  getUser() {
    const u = localStorage.getItem('sscm_user');
    return u ? JSON.parse(u) : null;
  },

  setUser(user) {
    localStorage.setItem('sscm_user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('sscm_token');
    localStorage.removeItem('sscm_user');
    window.location.href = '/';
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (response.status === 401) {
        this.logout();
        throw new Error('Sesi telah berakhir, silakan login kembali');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
