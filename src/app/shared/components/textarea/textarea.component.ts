import { Component, forwardRef, input, computed, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

type TextareaSize = 'sm' | 'md' | 'lg';
type TextareaVariant = 'default' | 'filled' | 'ghost';

/**
 * Textarea component
 * Reusable multi-line text input for forms
 */
@Component({
  selector: 'app-textarea',
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './textarea.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
})
export class TextareaComponent implements ControlValueAccessor {
  private static idCounter = 0;
  // Inputs
  readonly label = input('');
  readonly labelKey = input('');
  readonly placeholder = input('');
  readonly placeholderKey = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelKey = input('');
  readonly id = input('');
  readonly effectiveId = computed(() => this.id() || this.generatedId);
  private readonly generatedId = `ds-textarea-${++TextareaComponent.idCounter}`;
  readonly rows = input(4);
  readonly cols = input<number | undefined>(undefined);
  readonly maxlength = input<number | undefined>(undefined);
  readonly minlength = input<number | undefined>(undefined);
  readonly control = input<AbstractControl | null>(null);
  readonly errorMessages = input<Record<string, string> | undefined>(undefined);
  readonly disabled = input(false);
  readonly resize = input<'none' | 'vertical' | 'horizontal' | 'both'>('vertical');
  readonly size = input<TextareaSize>('md');
  readonly variant = input<TextareaVariant>('default');
  readonly showCharacterCount = input(false);

  // State
  private readonly valueSignal = signal('');
  private readonly formControlDisabled = signal(false);

  private onChange = (value: string) => {};
  private onTouched = () => {};

  readonly isDisabled = computed(() => this.disabled() || this.formControlDisabled());

  readonly textareaClass = computed(() => {
    const resizeClass = `ds-textarea--resize-${this.resize()}`;
    const countClass = this.showCharacterCount() && this.maxlength() ? 'ds-textarea--has-count' : '';

    return `ds-textarea ${this.sizeClass()} ${this.variantClass()} ${resizeClass} ${countClass}`.trimEnd();
  });

  readonly characterCount = computed(() => this.valueSignal()?.length ?? 0);

  get value(): string {
    return this.valueSignal();
  }

  private sizeClass(): string {
    switch (this.size()) {
      case 'sm':
        return 'ds-textarea--sm';
      case 'lg':
        return 'ds-textarea--lg';
      default:
        return 'ds-textarea--md';
    }
  }

  private variantClass(): string {
    switch (this.variant()) {
      case 'filled':
        return 'ds-textarea--filled';
      case 'ghost':
        return 'ds-textarea--ghost';
      default:
        return 'ds-textarea--default';
    }
  }

  /**
   * Write value from form control
   */
  writeValue(value: string): void {
    this.valueSignal.set(value || '');
  }

  /**
   * Register change callback
   */
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /**
   * Register touched callback
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Set disabled state (from form control)
   */
  setDisabledState(isDisabled: boolean): void {
    this.formControlDisabled.set(isDisabled);
  }

  /**
   * Handle input change
   */
  onInputChange(event: Event): void {
    if (this.isDisabled()) return;
    const target = event.target as HTMLTextAreaElement;
    this.valueSignal.set(target.value);
    this.onChange(this.valueSignal());
  }

  /**
   * Handle blur
   */
  onBlur(): void {
    this.onTouched();
  }

  /**
   * Check if control has error
   */
  hasError(): boolean {
    const ctrl = this.control();
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  /**
   * Get error message key
   */
  getErrorMessageKey(): string | null {
    if (!this.hasError()) {
      return null;
    }

    const ctrl = this.control();
    if (!ctrl?.errors) {
      return null;
    }

    const errorKey = Object.keys(ctrl.errors)[0];

    // Handle server errors (validation errors from backend)
    if (errorKey === 'serverError') {
      const serverError = ctrl.errors[errorKey];
      if (serverError && typeof serverError === 'object' && 'message' in serverError) {
        return serverError.message as string;
      }
      return null;
    }

    // Use custom error message if provided
    const customMessages = this.errorMessages();
    if (customMessages && customMessages[errorKey]) {
      return customMessages[errorKey];
    }

    // Fall back to default error messages
    const defaultMessages: Record<string, string> = {
      required: 'VALIDATION.REQUIRED',
      minlength: 'VALIDATION.MIN_LENGTH',
      maxlength: 'VALIDATION.MAX_LENGTH',
    };

    return defaultMessages[errorKey] || 'VALIDATION.FIELD_CANNOT_BE_EMPTY';
  }

  /**
   * Check if error is a server error (should not be translated)
   */
  isServerError(): boolean {
    if (!this.hasError()) {
      return false;
    }

    const ctrl = this.control();
    if (!ctrl?.errors) {
      return false;
    }

    return 'serverError' in ctrl.errors;
  }

  /**
   * Get error message parameters for dynamic values
   */
  getErrorMessageParams(): Record<string, any> | null {
    if (!this.hasError()) {
      return null;
    }

    const ctrl = this.control();
    if (!ctrl?.errors) {
      return null;
    }

    const errorKey = Object.keys(ctrl.errors)[0];
    const errorValue = ctrl.errors[errorKey];

    if (errorKey === 'minlength' && errorValue && typeof errorValue === 'object' && 'requiredLength' in errorValue) {
      return { minLength: errorValue.requiredLength };
    }

    if (errorKey === 'maxlength' && errorValue && typeof errorValue === 'object' && 'requiredLength' in errorValue) {
      return { maxLength: errorValue.requiredLength };
    }

    return null;
  }

  /**
   * Check if field is required
   */
  isRequired(): boolean {
    const ctrl = this.control();
    if (!ctrl) {
      return false;
    }

    if (ctrl.validator) {
      const validator = ctrl.validator({} as AbstractControl);
      if (validator && validator['required']) {
        return true;
      }
    }

    if (ctrl.parent) {
      const parentValidators = ctrl.parent.validator;
      if (parentValidators) {
        const parentValidatorResult = parentValidators(ctrl.parent);
        if (parentValidatorResult && parentValidatorResult['required']) {
          return true;
        }
      }
    }

    if (ctrl.errors && ctrl.errors['required']) {
      return true;
    }

    return false;
  }
}
