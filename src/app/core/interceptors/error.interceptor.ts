import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { SKIP_ERROR_TOAST } from '../tokens/api.tokens';

/**
 * Extracts error message from HTTP error response
 */
function getErrorMessage(error: HttpErrorResponse): string {
  const errorObj = error.error;

  // Backend error structure: { Error: { Description: "...", Message: "...", Code: "..." } }
  if (errorObj?.Error) {
    return errorObj.Error.Description || errorObj.Error.Message || errorObj.Error.Code || 'SHARED.ERRORS.GENERIC';
  }

  // Backend error structure: { Message: "...", ErrorCode: "..." } at top level
  if (errorObj?.Message) {
    return errorObj.Message;
  }

  // Direct error message or string
  return errorObj?.message || (typeof errorObj === 'string' ? errorObj : error.message) || 'SHARED.ERRORS.GENERIC';
}

/**
 * Error interceptor - displays HTTP errors (400, 500, etc.) as toast notifications
 * Note: 401 errors are handled by AuthInterceptor
 */
export const ErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip 401 errors - handled by AuthInterceptor
      if (error.status === 401 || req.context.get(SKIP_ERROR_TOAST)) {
        return throwError(() => error);
      }

      // Display error toast
      toastService.error(getErrorMessage(error));

      // Re-throw error for component handling
      return throwError(() => error);
    }),
  );
};
