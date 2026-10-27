import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

type CheckboxSize = 'sm' | 'md' | 'lg';
type CheckboxVariant = 'default' | 'primary' | 'success' | 'danger';

/**
 * Checkbox component
 * Reusable checkbox with label support for forms
 */
@Component({
  selector: 'app-checkbox',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <label
      class="ds-checkbox"
      [attr.for]="effectiveId"
      [class.ds-checkbox--disabled]="isDisabled"
      [class.ds-checkbox--sm]="size === 'sm'"
      [class.ds-checkbox--md]="size === 'md'"
      [class.ds-checkbox--lg]="size === 'lg'"
    >
      <input
        type="checkbox"
        class="ds-checkbox__input"
        [id]="effectiveId"
        [checked]="checked"
        [disabled]="isDisabled"
        [attr.aria-label]="label || labelKey ? null : ariaLabelKey ? (ariaLabelKey | translate) : ariaLabel || null"
        [class.ds-checkbox__input--primary]="variant === 'primary'"
        [class.ds-checkbox__input--success]="variant === 'success'"
        [class.ds-checkbox__input--danger]="variant === 'danger'"
        (change)="onCheckboxChange($event)"
        (blur)="onBlur()"
      />
      <span class="ds-checkbox__checkmark" aria-hidden="true">
        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      @if (label || labelKey) {
        <span class="ds-checkbox__label" [class.ds-checkbox__label--checked]="checked">
          {{ labelKey ? (labelKey | translate) : label }}
        </span>
      }
    </label>
  `,

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
})
export class CheckboxComponent implements ControlValueAccessor {
  private static idCounter = 0;

  @Input() label = '';
  @Input() labelKey = '';
  @Input() id = '';
  @Input() ariaLabel = '';
  @Input() ariaLabelKey = '';
  @Input() disabled = false;
  @Input() size: CheckboxSize = 'md';
  @Input() variant: CheckboxVariant = 'default';

  checked = false;
  private formControlDisabled = false;

  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  readonly generatedId = `ds-checkbox-${++CheckboxComponent.idCounter}`;

  get effectiveId(): string {
    return this.id || this.generatedId;
  }

  get isDisabled(): boolean {
    return this.disabled || this.formControlDisabled;
  }

  onCheckboxChange(event: Event): void {
    if (this.isDisabled) return;
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.onChange(this.checked);
    this.onTouched();
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: boolean): void {
    this.checked = value ?? false;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formControlDisabled = isDisabled;
  }
}
