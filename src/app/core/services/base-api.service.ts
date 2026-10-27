import { HttpClient, HttpContext, HttpErrorResponse, HttpEvent, HttpParams } from '@angular/common/http';
import { inject, Injectable, Provider } from '@angular/core';
import { Observable, TimeoutError, timeout, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface ApiRequestOptions {
  params?: HttpParams;
  context?: HttpContext;
}

/**
 * Base API service
 * Provides common HTTP methods for API calls
 */
@Injectable({
  providedIn: 'root',
})
export class BaseApiService {
  protected baseUrl = environment.apiUrl.replace(/\/+$/, '') + '/';
  private http = inject(HttpClient);

  setApiUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '') + '/';
  }

  private requestUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint.replace(/^\/+/, '')}`;
  }

  private handleUploadError(error: unknown): Observable<never> {
    if (error instanceof TimeoutError) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 408,
            statusText: 'Request Timeout',
            error: {
              Error: {
                Description: 'SHARED.ERRORS.UPLOAD_TIMEOUT',
                Message: 'SHARED.ERRORS.UPLOAD_TIMEOUT',
                Code: 'TIMEOUT',
              },
            },
          }),
      );
    }
    return throwError(() => error);
  }

  /**
   * Generic GET request
   * @param endpoint API endpoint
   * @param options Request options
   * @returns Observable of type T
   */
  get<T>(endpoint: string, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(this.requestUrl(endpoint), options);
  }

  /**
   * Generic POST request
   * @param endpoint API endpoint
   * @param body Request body
   * @returns Observable of type T
   */
  post<T>(endpoint: string, body: unknown, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.requestUrl(endpoint), body, options);
  }

  /**
   * Generic PUT request
   * @param endpoint API endpoint
   * @param body Request body
   * @returns Observable of type T
   */
  put<T>(endpoint: string, body: unknown, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(this.requestUrl(endpoint), body, options);
  }

  /**
   * Generic DELETE request
   * @param endpoint API endpoint
   * @param body Optional request body
   * @returns Observable of type T
   */
  delete<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    if (body !== undefined) {
      return this.http.request<ApiResponse<T>>('DELETE', this.requestUrl(endpoint), {
        ...options,
        body: body,
      });
    }
    return this.http.delete<ApiResponse<T>>(this.requestUrl(endpoint), options);
  }

  /**
   * Generic PATCH request
   * @param endpoint API endpoint
   * @param body Request body
   * @returns Observable of type T
   */
  patch<T>(endpoint: string, body: unknown, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(this.requestUrl(endpoint), body, options);
  }

  /**
   * Download file as blob
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns Observable of Blob
   */
  downloadFile(endpoint: string, params?: HttpParams): Observable<Blob> {
    return this.http.get(this.requestUrl(endpoint), {
      params,
      responseType: 'blob',
    });
  }

  /**
   * Upload file with FormData
   * @param endpoint API endpoint
   * @param formData FormData containing file and other fields
   * @param timeoutMs Timeout in milliseconds (default: 10 minutes for file uploads and processing)
   * @returns Observable of type T
   */
  uploadFile<T>(endpoint: string, formData: FormData, timeoutMs: number = 600000): Observable<ApiResponse<T>> {
    // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
    return this.http
      .post<ApiResponse<T>>(this.requestUrl(endpoint), formData, {
        // Angular HttpClient automatically handles FormData and sets Content-Type with boundary
        // No need to set headers manually
        // Report progress for large file uploads
        reportProgress: false,
      })
      .pipe(
        timeout(timeoutMs),
        catchError((error: unknown) => this.handleUploadError(error)),
      );
  }

  /**
   * Upload file with progress events
   * @param endpoint API endpoint
   * @param formData FormData containing file and other fields
   * @param timeoutMs Timeout in milliseconds (default: 10 minutes for file uploads and processing)
   * @returns Observable of HttpEvent<T> emitting UploadProgress and Response events
   */
  uploadFileWithProgress<T>(endpoint: string, formData: FormData, timeoutMs: number = 600000): Observable<HttpEvent<ApiResponse<T>>> {
    return this.http
      .post<ApiResponse<T>>(this.requestUrl(endpoint), formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        timeout(timeoutMs),
        catchError((error: unknown) => this.handleUploadError(error)),
      );
  }

  /**
   * Creates a provider for injecting BaseApiService with a specific API URL
   * @param token The injection token to use
   * @param apiUrl The API URL to set for this service
   */
  static forApi(token: unknown, apiUrl: string): Provider {
    return {
      provide: token,
      useFactory: () => {
        const service = new BaseApiService();
        service.setApiUrl(apiUrl);
        return service;
      },
    };
  }
}
