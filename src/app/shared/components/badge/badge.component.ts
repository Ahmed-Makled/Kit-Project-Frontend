import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

type BadgeType = 'badge' | 'status';
export type BadgeVariant = 'admin' | 'user' | 'neutral';
export type StatusVariant = 'active' | 'inactive' | 'pending' | 'in-progress' | 'paused' | 'rejected';

@Component({
  selector: 'app-badge',
  imports: [TranslateModule],
  template: `
    <span [class]="badgeClass">
      @if (labelKey) {
        {{ labelKey | translate }}
      } @else {
        {{ label }}
      }
    </span>
  `,
})
export class BadgeComponent {
  @Input() type: BadgeType = 'badge';
  @Input() variant: BadgeVariant | StatusVariant = 'neutral';
  @Input() label = '';
  @Input() labelKey = '';

  get badgeClass(): string {
    if (this.type === 'status') {
      return `ds-status ds-status--${this.variant}`;
    }
    return `ds-badge ds-badge--${this.variant}`;
  }
}
