import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AUTH_STORAGE_KEYS } from '../tokens/auth-storage.tokens';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { SKIP_ERROR_TOAST } from '../tokens/api.tokens';

/**
 * Auth interceptor
 * Adds authorization token to requests and handles 401 errors
 */
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const toastService = inject(ToastService);
  const storageKeys = inject(AUTH_STORAGE_KEYS);
  const token = localStorage.getItem(storageKeys.token);
  // Add authorization header if token exists
  const authRequest = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401 && !/\/Auth\/Login(?:[?#]|$)/i.test(req.url)) {
        const isLogoutEndpoint = req.url.includes('/Logout');

        if (!isLogoutEndpoint) {
          // Clear auth data
          injector.get(AuthService).clearAuth();

          // Show error toast
          if (!req.context.get(SKIP_ERROR_TOAST)) toastService.error('ERRORS.UNAUTHORIZED');

          // Navigate to login
          injector.get(Router).navigate(['/login']);
        }
      }

      return throwError(() => error);
    }),
  );
};
