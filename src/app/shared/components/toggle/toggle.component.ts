import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

type ToggleSize = 'sm' | 'md' | 'lg';
type ToggleVariant = 'success' | 'primary' | 'danger';

/**
 * Toggle switch component
 * Reusable toggle with sizes and color variants
 */
@Component({
  selector: 'app-toggle',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <label class="inline-flex items-center gap-3 cursor-pointer" [attr.for]="effectiveId">
      <input
        type="checkbox"
        class="sr-only peer"
        [id]="effectiveId"
        [checked]="checked"
        [disabled]="isDisabled"
        [attr.aria-label]="label || labelKey ? null : ariaLabelKey ? (ariaLabelKey | translate) : ariaLabel || null"
        (change)="onToggleChange($event)"
        (blur)="onBlur()"
      />
      <div
        class="toggle"
        [class.toggle-sm]="size === 'sm'"
        [class.toggle-md]="size === 'md'"
        [class.toggle-lg]="size === 'lg'"
        [class.toggle-success]="variant === 'success'"
        [class.toggle-primary]="variant === 'primary'"
        [class.toggle-danger]="variant === 'danger'"
      ></div>
      @if (label || labelKey) {
        <span
          class="toggle-label"
          [class.font-semibold]="checked"
          [class.text-green-600]="checked && variant === 'success'"
          [class.text-primary-600]="checked && variant === 'primary'"
          [class.text-red-600]="checked && variant === 'danger'"
        >
          {{ labelKey ? (labelKey | translate) : label }}
        </span>
      }
    </label>
  `,

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleComponent),
      multi: true,
    },
  ],
})
export class ToggleComponent implements ControlValueAccessor {
  private static idCounter = 0;
  @Input() label = '';
  @Input() labelKey = '';
  @Input() id = '';
  @Input() ariaLabel = '';
  @Input() ariaLabelKey = '';
  @Input() disabled = false;
  @Input() size: ToggleSize = 'md';
  @Input() variant: ToggleVariant = 'success';
  @Input() set checked(value: boolean) {
    this.hasCheckedInput = true;
    this._checked = value ?? false;
  }
  get checked(): boolean {
    return this._checked;
  }
  @Output() change = new EventEmitter<boolean>();

  private _checked = false;
  private hasCheckedInput = false;
  private formControlDisabled = false;

  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  readonly generatedId = `ds-toggle-${++ToggleComponent.idCounter}`;

  get effectiveId(): string {
    return this.id || this.generatedId;
  }

  get isDisabled(): boolean {
    return this.disabled || this.formControlDisabled;
  }

  onToggleChange(event: Event): void {
    if (this.isDisabled) return;
    const target = event.target as HTMLInputElement;
    const newValue = target.checked;
    // Explicit [checked] bindings let the parent confirm status changes first.
    if (!this.hasCheckedInput) this._checked = newValue;
    target.checked = this._checked;
    this.onChange(newValue);
    this.onTouched();
    this.change.emit(newValue);
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: boolean): void {
    this._checked = value ?? false;
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
