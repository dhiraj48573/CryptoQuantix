import { apiService, LoginRequest, RegisterRequest } from './apiService';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

class AuthService {
  private currentUser: User | null = null;
  private readonly TOKEN_KEY = 'auth_token';

  constructor() {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      // Validate token by fetching current user
      this.validateToken(token);
    }
  }

  private async validateToken(token: string): Promise<void> {
    try {
      const response = await apiService.getCurrentUser();
      if (response.user) {
        this.currentUser = response.user;
      } else {
        this.logout();
      }
    } catch (error) {
      this.logout();
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await apiService.login({ email, password });
      
      if (response.token && response.user) {
        this.currentUser = response.user;
        localStorage.setItem(this.TOKEN_KEY, response.token);
        return { success: true, user: response.user };
      }
      
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async register(name: string, email: string, password: string): Promise<AuthResult> {
    try {
      const response = await apiService.register({ name, email, password });
      
      if (response.token && response.user) {
        this.currentUser = response.user;
        localStorage.setItem(this.TOKEN_KEY, response.token);
        return { success: true, user: response.user };
      }
      
      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY) && !!this.currentUser;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // Method to update current user data
  updateUser(user: User): void {
    this.currentUser = user;
  }
}

export const authService = new AuthService();
