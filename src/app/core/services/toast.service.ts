import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ApiResponse } from '../models/api-response.model';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  /**
   * Do not inject TranslateService here: it pulls HttpClient → interceptors → ToastService (NG0200).
   * Pass translation keys from TS; ToastComponent resolves them via `{{ toast.message | translate }}`.
   */
  private toasts = signal<Toast[]>([]);
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }

  readonly toasts$ = this.toasts.asReadonly();

  success(message: string, duration = 3000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 3000): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration = 4000): void {
    this.show(message, 'warning', duration);
  }

  private show(message: string, type: ToastType, duration: number): void {
    const toast: Toast = {
      id: this.nextId++,
      message,
      type,
      duration,
    };

    this.toasts.update((toasts) => [...toasts, toast]);

    if (duration > 0) {
      this.timers.set(
        toast.id,
        setTimeout(() => this.remove(toast.id), duration),
      );
    }
  }

  remove(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  showToaster<T>(response: ApiResponse<T>, successMessage?: string, errorMessage?: string): void {
    if (response.IsSuccess) {
      this.success(response.Message ?? successMessage ?? 'SHARED.MESSAGES.SUCCESS');
    } else {
      const msg = errorMessage ?? response.Error?.Message ?? response.Error?.Description ?? response.Message ?? 'SHARED.ERRORS.GENERIC';
      this.error(msg);
    }
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.toasts.set([]);
  }
}
