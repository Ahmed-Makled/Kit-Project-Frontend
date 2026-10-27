import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ToastService, type Toast } from '@app/core/services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="fixed top-4 end-4 z-[1000000] w-[calc(100%-2rem)] max-w-sm space-y-2 pointer-events-none" aria-live="polite" aria-relevant="additions">
      @for (toast of toastService.toasts$(); track toast.id) {
        <div
          class="pointer-events-auto bg-white rounded-lg shadow-lg border-s-4 p-4 w-full break-words animate-slide-in-right"
          [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
          [class.border-green-500]="toast.type === 'success'"
          [class.border-red-500]="toast.type === 'error'"
          [class.border-primary-500]="toast.type === 'info'"
          [class.border-yellow-500]="toast.type === 'warning'"
        >
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div class="flex-shrink-0">
              @if (toast.type === 'success') {
                <svg class="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              }
              @if (toast.type === 'error') {
                <svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              }
              @if (toast.type === 'info') {
                <svg class="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              }
              @if (toast.type === 'warning') {
                <svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              }
            </div>

            <!-- Message -->
            <div class="flex-1 ">
              <p class="text-sm font-medium text-gray-900">{{ toast.message | translate }}</p>
            </div>

            <!-- Close Button -->
            <button
              type="button"
              (click)="toastService.remove(toast.id)"
              [attr.aria-label]="'SHARED.ACTIONS.CLOSE' | translate"
              class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,

  styles: [
    `
      @keyframes slide-in-right {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .animate-slide-in-right {
        animation: slide-in-right 0.3s ease-out;
      }
    `,
  ],
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.toastService.clear());
  }
}
