import { InjectionToken } from '@angular/core';

/**
 * localStorage key names for auth. Override via provider to avoid collisions when
 * multiple apps share an origin, or to namespace by product.
 *
 * @example
 * ```ts
 * { provide: AUTH_STORAGE_KEYS, useValue: createAuthStorageKeys('myapp') }
 * ```
 */
export interface AuthStorageKeys {
  readonly token: string;
  readonly refreshToken: string;
  readonly user: string;
}

export function createAuthStorageKeys(prefix: string): AuthStorageKeys {
  const safe = prefix.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || 'app';
  return {
    token: `${safe}_auth_token`,
    refreshToken: `${safe}_refresh_token`,
    user: `${safe}_auth_user`,
  };
}

export const AUTH_STORAGE_KEYS = new InjectionToken<AuthStorageKeys>('AUTH_STORAGE_KEYS');
