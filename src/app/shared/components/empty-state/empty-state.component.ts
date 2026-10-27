import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-empty-state',
  imports: [TranslateModule],

  template: `
    <div class="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div class="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary-50 text-primary-600" aria-hidden="true">
        @if (iconSrc) {
          <img [src]="iconSrc" class="h-6 w-6" alt="" />
        } @else if (iconPath) {
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="iconPath" />
          </svg>
        }
      </div>
      @if (titleKey) {
        <h3 class=" text-base font-bold text-app-ink">
          {{ titleKey | translate }}
        </h3>
      }
      @if (messageKey) {
        <p class="text-sm text-app-body">
          {{ messageKey | translate }}
        </p>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() titleKey = '';
  @Input() messageKey = '';
  @Input() iconSrc = '';
  @Input() iconPath = 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9';
}
