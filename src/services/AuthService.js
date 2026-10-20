// src/services/AuthService.js
// Authentification multi-utilisateurs (remplace l'ancien code de licence).
import ApiClient from './ApiClient';

class AuthService {
  /** L'application doit-elle créer son premier administrateur ? */
  async getStatus() {
    return ApiClient.get('/auth/status');
  }

  async setup(email, password, name) {
    const result = await ApiClient.post('/auth/setup', { email, password, name });
    ApiClient.setSession(result.token, result.user);
    return result.user;
  }

  async login(email, password) {
    const result = await ApiClient.post('/auth/login', { email, password });
    ApiClient.setSession(result.token, result.user);
    return result.user;
  }

  /** Vérifie le jeton mémorisé et renvoie l'utilisateur courant, ou null. */
  async restoreSession() {
    if (!ApiClient.getToken()) return null;
    try {
      const user = await ApiClient.request('GET', '/auth/me', undefined, { skipAuthHandling: true });
      ApiClient.setSession(ApiClient.getToken(), user);
      return user;
    } catch (error) {
      if (error.status === 401) {
        ApiClient.setSession(null, null);
        return null;
      }
      // Serveur injoignable : on garde la session mémorisée pour réessayer.
      throw error;
    }
  }

  logout() {
    ApiClient.setSession(null, null);
  }

  getCurrentUser() {
    return ApiClient.getStoredUser();
  }

  isAdmin() {
    const user = this.getCurrentUser();
    return !!user && user.role === 'admin';
  }

  changePassword(currentPassword, newPassword) {
    return ApiClient.post('/auth/change-password', { currentPassword, newPassword });
  }

  onUnauthorized(listener) {
    return ApiClient.onUnauthorized(listener);
  }

  // Gestion des comptes (administrateurs)
  listUsers() {
    return ApiClient.get('/users');
  }

  createUser(data) {
    return ApiClient.post('/users', data);
  }

  updateUser(id, data) {
    return ApiClient.patch(`/users/${id}`, data);
  }

  deleteUser(id) {
    return ApiClient.delete(`/users/${id}`);
  }
}

export default new AuthService();
