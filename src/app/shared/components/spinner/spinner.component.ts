import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-spinner',
  imports: [TranslateModule],

  template: `
    <div [class]="wrapperClass" role="status" aria-live="polite">
      <div class="relative inline-flex" aria-hidden="true">
        <div class="absolute inset-0 rounded-full bg-primary-500/15 blur-xl animate-pulse"></div>
        <div class="relative inline-block animate-spin rounded-full border-4 border-app-border border-t-primary-600" [class]="spinnerClass"></div>
      </div>
      @if (messageKey) {
        <p class="mt-5 text-sm font-medium text-app-body">
          {{ messageKey | translate }}
        </p>
      }
    </div>
  `,
})
export class SpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() messageKey = 'SHARED.STATUS.LOADING';
  @Input() centered = true;

  get wrapperClass(): string {
    return this.centered ? 'py-16 text-center' : 'flex flex-col items-center';
  }

  get spinnerClass(): string {
    switch (this.size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-20 w-20';
      default:
        return 'h-14 w-14';
    }
  }
}
