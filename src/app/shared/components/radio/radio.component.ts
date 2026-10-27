import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

type RadioSize = 'sm' | 'md' | 'lg';
type RadioVariant = 'default' | 'primary' | 'success' | 'danger';

export interface RadioOption {
  value: string | number;
  label?: string;
  labelKey?: string;
  disabled?: boolean;
}

/**
 * Radio group component
 * Reusable radio button group for forms
 */
@Component({
  selector: 'app-radio',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    @if (label || labelKey) {
      <div class="ds-field__label ds-radio__group-label">
        @if (labelKey) {
          {{ labelKey | translate }}
        } @else {
          {{ label }}
        }
        @if (required) {
          <span class="ds-field__required">*</span>
        }
      </div>
    }
    <div
      class="ds-radio__group"
      [class.ds-radio__group--inline]="inline"
      [class.ds-radio__group--sm]="size === 'sm'"
      [class.ds-radio__group--md]="size === 'md'"
      [class.ds-radio__group--lg]="size === 'lg'"
      role="radiogroup"
      [attr.aria-required]="required ? 'true' : null"
      [attr.aria-label]="label || labelKey ? (labelKey ? (labelKey | translate) : label) : ariaLabelKey ? (ariaLabelKey | translate) : ariaLabel || null"
    >
      @for (option of options; track option.value) {
        <label class="ds-radio" [class.ds-radio--disabled]="isDisabled || option.disabled">
          <input
            type="radio"
            class="ds-radio__input"
            [name]="name || generatedName"
            [value]="option.value"
            [checked]="isSelected(option.value)"
            [disabled]="isDisabled || option.disabled"
            [class.ds-radio__input--primary]="variant === 'primary'"
            [class.ds-radio__input--success]="variant === 'success'"
            [class.ds-radio__input--danger]="variant === 'danger'"
            (change)="onRadioChange(option.value)"
            (blur)="onBlur()"
            role="radio"
            [attr.aria-checked]="isSelected(option.value)"
          />
          <span class="ds-radio__circle" aria-hidden="true"></span>
          @if (option.label || option.labelKey) {
            <span class="ds-radio__label">
              {{ option.labelKey ? (option.labelKey | translate) : option.label }}
            </span>
          }
        </label>
      }
    </div>
  `,

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioComponent),
      multi: true,
    },
  ],
})
export class RadioComponent implements ControlValueAccessor {
  private static idCounter = 0;
  readonly generatedName = `ds-radio-${++RadioComponent.idCounter}`;
  @Input() name = '';
  @Input() label = '';
  @Input() labelKey = '';
  @Input() ariaLabel = '';
  @Input() ariaLabelKey = '';
  @Input() options: RadioOption[] = [];
  @Input() disabled = false;
  @Input() required = false;
  @Input() inline = false;
  @Input() size: RadioSize = 'md';
  @Input() variant: RadioVariant = 'default';
  @Output() change = new EventEmitter<string | number>();

  selectedValue: string | number | null = null;
  private formControlDisabled = false;

  private onChange = (value: string | number | null) => {};
  private onTouched = () => {};

  get isDisabled(): boolean {
    return this.disabled || this.formControlDisabled;
  }

  isSelected(value: string | number): boolean {
    return this.selectedValue === value;
  }

  onRadioChange(value: string | number): void {
    if (this.isDisabled || this.options.find((option) => option.value === value)?.disabled) return;

    this.selectedValue = value;
    this.onChange(value);
    this.onTouched();
    this.change.emit(value);
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string | number | null): void {
    this.selectedValue = value ?? null;
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formControlDisabled = isDisabled;
  }
}
