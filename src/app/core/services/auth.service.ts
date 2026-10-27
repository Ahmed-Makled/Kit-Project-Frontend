import { Injectable, computed, inject, signal } from '@angular/core';
import { LoginResponse } from '@app/features/login/models/login.model';
import { User } from '@app/features/users/models/user.model';
import { AUTH_STORAGE_KEYS } from '../tokens/auth-storage.tokens';

interface SessionState {
  user: User | LoginResponse | null;
  token: string | null;
}

/**
 * Auth state service
 * Manages authentication state and localStorage persistence
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKeys = inject(AUTH_STORAGE_KEYS);

  private readonly session = signal<SessionState>({
    user: null,
    token: null,
  });

  readonly currentUser = computed(() => this.session().user);
  readonly isAuthenticated = computed(() => !!this.session().token);

  constructor() {
    this.hydrateFromStorage();
  }

  setAuth(user: User | LoginResponse, token: string): void {
    this.session.set({ user, token });

    localStorage.setItem(this.storageKeys.token, token);
    localStorage.setItem(this.storageKeys.user, JSON.stringify(user));
  }

  clearAuth(): void {
    this.session.set({ user: null, token: null });
    localStorage.removeItem(this.storageKeys.token);
    localStorage.removeItem(this.storageKeys.refreshToken);
    localStorage.removeItem(this.storageKeys.user);
  }

  updateToken(token: string, refreshToken?: string): void {
    this.session.update((s) => ({ ...s, token, ...(refreshToken && { refreshToken }) }));
    localStorage.setItem(this.storageKeys.token, token);
    if (refreshToken) {
      localStorage.setItem(this.storageKeys.refreshToken, refreshToken);
    }
  }

  updateUser(user: User | LoginResponse): void {
    this.session.update((s) => ({ ...s, user }));
    localStorage.setItem(this.storageKeys.user, JSON.stringify(user));
  }

  private hydrateFromStorage(): void {
    const token = localStorage.getItem(this.storageKeys.token);

    if (!token) return;

    const storedUser = localStorage.getItem(this.storageKeys.user);
    let user: User | LoginResponse | null = null;

    if (storedUser) {
      try {
        user = JSON.parse(storedUser) as User | LoginResponse;
      } catch {
        localStorage.removeItem(this.storageKeys.user);
      }
    }

    this.session.set({ user, token });
  }
}
