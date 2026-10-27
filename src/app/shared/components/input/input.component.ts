import {
  Component,
  forwardRef,
  input,
  computed,
  signal,
  ChangeDetectorRef,
  ElementRef,
  HostListener,
  inject,
  DestroyRef,
  afterEveryRender,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'filled' | 'ghost';
type CalendarViewMode = 'days' | 'years';

interface CalendarDay {
  date: Date;
  iso: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

/**
 * Input component
 * Reusable input component for forms
 */
@Component({
  selector: 'app-input',
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  private static idCounter = 0;
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  readonly datePickerViewportPosition = signal<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  // Inputs
  readonly label = input('');
  readonly labelKey = input('');
  readonly placeholder = input('');
  readonly placeholderKey = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelKey = input('');
  readonly type = input<'text' | 'email' | 'number' | 'tel' | 'url' | 'password' | 'date' | 'month'>('text');
  /** Direction for mixed-direction values such as phone numbers; date values default to LTR. */
  readonly inputDir = input<'ltr' | 'rtl' | 'auto' | null>(null);
  /** When `type` is `password`, shows a visibility toggle (does not use `icon` trailing slot). */
  readonly showPasswordToggle = input(false);
  /** i18n key for the password toggle `aria-label`. */
  readonly passwordToggleAriaLabelKey = input('');
  /** i18n key for the date picker toggle `aria-label`. */
  readonly datePickerAriaLabelKey = input('SHARED.ACTIONS.OPEN_DATE_PICKER');
  /** When set, forwarded to the native `autocomplete` attribute (e.g. `username`, `current-password`). */
  readonly autocomplete = input<string | null>(null);
  readonly id = input('');
  readonly generatedId = `ds-input-${++InputComponent.idCounter}`;
  /** Leading (start) icon: SVG `<path>` `d` (stroke). Uses logical `start` so it flips correctly in RTL. */
  readonly iconStart = input<string>('');
  /** Trailing (end) icon: SVG `<path>` `d`. Uses logical `end`. */
  readonly icon = input<string>('');
  readonly control = input<AbstractControl | null>(null);
  readonly errorMessages = input<Record<string, string> | undefined>(undefined);
  readonly disabled = input(false);
  readonly readOnly = input(false);
  readonly size = input<InputSize>('sm');
  readonly variant = input<InputVariant>('default');

  // State
  private readonly valueSignal = signal('');
  private readonly committedValue = signal('');
  private readonly passwordVisibleSignal = signal(false);
  private readonly formControlDisabled = signal(false);

  private onChange = (value: string) => {};
  private onTouched = () => {};

  constructor() {
    afterEveryRender(() => this.repositionDatePicker());
    if (typeof document !== 'undefined') {
      fromEvent(document, 'scroll', { capture: true })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.repositionDatePicker());
    }
  }

  @HostListener('window:resize')
  repositionDatePicker(): void {
    if (!this.isDatePickerOpen()) return;
    const input = this.hostElement.nativeElement.querySelector('input');
    if (input) this.computeDatePickerPlacement(input);
  }

  get value(): string {
    return this.valueSignal();
  }

  readonly isDisabled = computed(() => this.disabled() || this.formControlDisabled());

  readonly effectiveId = computed(() => this.id() || this.generatedId);

  readonly effectiveInputType = computed(() => {
    if (this.type() === 'password' && this.showPasswordToggle() && this.passwordVisibleSignal()) {
      return 'text';
    }
    if (this.isDateInput()) {
      return 'text';
    }
    return this.type();
  });

  readonly isDateInput = computed(() => this.type() === 'date' || this.type() === 'month');

  readonly inputClass = computed(() => {
    const withIconPadding = `${this.paddingStartClass()} ${this.paddingEndClass()}`;
    const dateClass = this.isDateInput() ? ' ds-input--date' : '';

    return `ds-input ${this.sizeClass()} ${this.variantClass()}${dateClass} ${withIconPadding}`.trimEnd();
  });

  readonly passwordVisible = computed(() => this.passwordVisibleSignal());

  togglePasswordVisibility(): void {
    if (this.type() !== 'password' || !this.showPasswordToggle() || this.isDisabled()) {
      return;
    }
    this.passwordVisibleSignal.update((v) => !v);
  }

  openDatePicker(input: HTMLInputElement): void {
    if (!this.isDateInput() || this.isDisabled() || this.readOnly()) {
      return;
    }

    const selectedDate = this.parseDate(this.valueSignal()) ?? new Date();
    this.calendarViewDate.set(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    this.yearGridStart.set(Math.floor(selectedDate.getFullYear() / 12) * 12);
    this.calendarViewMode.set('days');
    this.isDatePickerOpen.set(true);
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => this.computeDatePickerPlacement(input));
    }
    input.focus();
  }

  toggleDatePicker(input: HTMLInputElement): void {
    if (this.isDatePickerOpen()) {
      this.closeDatePicker();
      return;
    }

    this.openDatePicker(input);
  }

  closeDatePicker(): void {
    this.isDatePickerOpen.set(false);
    this.calendarViewMode.set('days');
  }

  /** Keep calendars in the browser top layer so scroll panels cannot clip them. */
  private computeDatePickerPlacement(input: HTMLInputElement): void {
    const picker = this.hostElement.nativeElement.querySelector('.ds-date-picker') as HTMLElement | null;
    if (!picker) return;
    if (!picker.matches(':popover-open')) picker.showPopover();
    const inputRect = input.getBoundingClientRect();
    const margin = 12;
    const gap = 8;
    const maxHeight = Math.max(120, window.innerHeight - margin * 2);
    const height = Math.min(picker.scrollHeight || 360, maxHeight);
    const width = Math.min(Math.max(inputRect.width, 312), window.innerWidth - margin * 2);
    const below = window.innerHeight - inputRect.bottom - margin;
    const above = inputRect.top - margin;
    const openAbove = below < height + gap && above > below;
    const proposedTop = openAbove ? inputRect.top - height - gap : inputRect.bottom + gap;
    const alignRight = document.documentElement.dir === 'rtl';
    const proposedLeft = alignRight ? inputRect.right - width : inputRect.left;
    const position = {
      top: Math.max(margin, Math.min(proposedTop, window.innerHeight - height - margin)),
      left: Math.max(margin, Math.min(proposedLeft, window.innerWidth - width - margin)),
      width,
      maxHeight,
    };
    const previous = this.datePickerViewportPosition();
    if (
      !previous ||
      previous.top !== position.top ||
      previous.left !== position.left ||
      previous.width !== position.width ||
      previous.maxHeight !== position.maxHeight
    ) {
      this.datePickerViewportPosition.set(position);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.isDateInput() || !this.isDatePickerOpen()) {
      return;
    }

    const target = event.target;
    if (target instanceof Node && !this.hostElement.nativeElement.contains(target)) {
      this.closeDatePicker();
    }
  }

  onInputClick(input: HTMLInputElement): void {
    if (!this.isDateInput()) {
      return;
    }

    this.openDatePicker(input);
  }

  onInputKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (!this.isDateInput()) {
      return;
    }

    if (event.key === 'Escape') {
      this.closeDatePicker();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.openDatePicker(input);
    }
  }

  navigateCalendar(monthOffset: number): void {
    if (this.calendarViewMode() === 'years') {
      this.yearGridStart.update((year) => year + monthOffset * 12);
      return;
    }

    const current = this.calendarViewDate();
    this.calendarViewDate.set(new Date(current.getFullYear(), current.getMonth() + monthOffset, 1));
  }

  toggleYearPicker(): void {
    if (this.calendarViewMode() === 'years') {
      this.calendarViewMode.set('days');
      return;
    }

    this.yearGridStart.set(Math.floor(this.calendarViewDate().getFullYear() / 12) * 12);
    this.calendarViewMode.set('years');
  }

  selectYear(year: number): void {
    const current = this.calendarViewDate();
    this.calendarViewDate.set(new Date(year, current.getMonth(), 1));
    this.calendarViewMode.set('days');
  }

  selectDate(date: Date): void {
    if (this.isDisabled() || this.readOnly()) return;
    this.setValue(this.toIsoDate(date));
    this.closeDatePicker();
    this.onTouched();
  }

  selectMonth(month: number): void {
    if (this.isDisabled() || this.readOnly()) return;
    const year = this.calendarViewDate().getFullYear();
    this.setValue(`${year}-${String(month + 1).padStart(2, '0')}`);
    this.closeDatePicker();
    this.onTouched();
  }

  selectToday(): void {
    const today = new Date();

    if (this.type() === 'month') {
      this.calendarViewDate.set(new Date(today.getFullYear(), today.getMonth(), 1));
      this.selectMonth(today.getMonth());
      return;
    }

    this.selectDate(today);
  }

  formatDateLabel(iso: string): string {
    return this.formatDateValue(iso);
  }

  readonly hasLeadingIcon = computed(() => !!this.iconStart()?.trim());

  readonly hasTrailingIcon = computed(() => !!this.icon()?.trim());

  readonly hasDateToggle = computed(() => this.isDateInput() && !this.hasTrailingIcon());

  readonly isDatePickerOpen = signal(false);
  /** Placement of the date picker relative to the input, chosen by available space. */
  readonly datePickerPosition = signal<'bottom' | 'top'>('bottom');
  readonly calendarViewMode = signal<CalendarViewMode>('days');
  private readonly calendarViewDate = signal(new Date());
  private readonly yearGridStart = signal(Math.floor(new Date().getFullYear() / 12) * 12);

  readonly datePlaceholder = computed(() => (this.type() === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'));

  readonly calendarMonthLabel = computed(() => new Intl.DateTimeFormat(this.getLocale(), { month: 'long', year: 'numeric' }).format(this.calendarViewDate()));

  readonly yearRangeLabel = computed(() => {
    const start = this.yearGridStart();
    return `${start}–${start + 11}`;
  });

  readonly yearOptions = computed(() => {
    const start = this.yearGridStart();
    const selectedYear = this.calendarViewDate().getFullYear();

    return Array.from({ length: 12 }, (_, index) => ({
      year: start + index,
      isSelected: start + index === selectedYear,
    }));
  });

  readonly previousCalendarLabelKey = computed(() => (this.calendarViewMode() === 'years' ? 'SHARED.ACTIONS.PREVIOUS_YEARS' : 'SHARED.ACTIONS.PREVIOUS_MONTH'));

  readonly nextCalendarLabelKey = computed(() => (this.calendarViewMode() === 'years' ? 'SHARED.ACTIONS.NEXT_YEARS' : 'SHARED.ACTIONS.NEXT_MONTH'));

  readonly weekdayLabels = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.getLocale(), { weekday: 'short' });
    return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(2024, 0, index + 1)));
  });

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const view = this.calendarViewDate();
    const firstDay = new Date(view.getFullYear(), view.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const selectedIso = this.dateKey(this.valueSignal());
    const todayIso = this.toIsoDate(new Date());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(view.getFullYear(), view.getMonth(), 1 - mondayOffset + index);
      const iso = this.toIsoDate(date);

      return {
        date,
        iso,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === view.getMonth(),
        isToday: iso === todayIso,
        isSelected: iso === selectedIso,
      };
    });
  });

  readonly monthOptions = computed(() => {
    const view = this.calendarViewDate();
    const formatter = new Intl.DateTimeFormat(this.getLocale(), { month: 'long' });
    const selectedValue = this.valueSignal().slice(0, 7);

    return Array.from({ length: 12 }, (_, month) => ({
      month,
      label: formatter.format(new Date(view.getFullYear(), month, 1)),
      isSelected: `${view.getFullYear()}-${String(month + 1).padStart(2, '0')}` === selectedValue,
    }));
  });

  svgIconClasses(): string {
    return 'ds-input__icon-svg';
  }

  leadingIconWrapClasses(): string {
    return `ds-input__icon ds-input__icon--start ds-input__icon--${this.size()}`;
  }

  trailingIconWrapClasses(): string {
    return `ds-input__icon ds-input__icon--end ds-input__icon--${this.size()}`;
  }

  private paddingStartClass(): string {
    return this.hasLeadingIcon() ? ` ds-input--has-start-icon` : '';
  }

  private paddingEndClass(): string {
    const parts: string[] = [];
    if (this.hasTrailingIcon()) {
      parts.push('ds-input--has-end-icon');
    }
    if (this.type() === 'password' && this.showPasswordToggle()) {
      parts.push('ds-input--has-password-toggle');
    }
    if (this.hasDateToggle()) {
      parts.push('ds-input--has-date-toggle');
    }
    return parts.length ? ` ${parts.join(' ')}` : '';
  }

  private sizeClass(): string {
    switch (this.size()) {
      case 'sm':
        return 'ds-input--sm';
      case 'lg':
        return 'ds-input--lg';
      default:
        return 'ds-input--md';
    }
  }

  private variantClass(): string {
    switch (this.variant()) {
      case 'filled':
        return 'ds-input--filled';
      case 'ghost':
        return 'ds-input--ghost';
      default:
        return 'ds-input--default';
    }
  }

  /**
   * Write value from form control
   */
  writeValue(value: unknown): void {
    const normalizedValue = this.normalizeValue(value);
    this.valueSignal.set(normalizedValue);
    this.committedValue.set(normalizedValue);
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
    if (isDisabled) this.closeDatePicker();
  }

  /**
   * Handle input change
   */
  onInputChange(event: Event): void {
    if (this.isDisabled() || this.readOnly()) return;
    const target = event.target as HTMLInputElement;

    if (this.isDateInput()) {
      this.valueSignal.set(target.value);
      const normalizedValue = this.normalizeDateInput(target.value);

      if (normalizedValue !== null) {
        this.valueSignal.set(normalizedValue);
        this.committedValue.set(normalizedValue);
        this.onChange(normalizedValue);
      }
      return;
    }

    this.valueSignal.set(target.value);
    this.onChange(this.valueSignal());
  }

  private setValue(value: string): void {
    this.valueSignal.set(value);
    this.committedValue.set(value);
    this.onChange(value);
  }

  private normalizeValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    if (value instanceof Date) {
      const normalizedDate = this.toIsoDate(value);
      return this.type() === 'month' ? normalizedDate.slice(0, 7) : normalizedDate;
    }

    return String(value);
  }

  private normalizeDateInput(value: string): string | null {
    if (!value.trim()) {
      return '';
    }

    if (this.type() === 'month') {
      const match = value.match(/^(\d{4})-(\d{1,2})$/);
      if (!match) {
        return null;
      }

      const year = Number(match[1]);
      const month = Number(match[2]);
      return month >= 1 && month <= 12 ? `${year}-${String(month).padStart(2, '0')}` : null;
    }

    const match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return this.toIsoDate(date);
  }

  private formatDateValue(value: string): string {
    const date = this.parseDate(value);
    if (!date) {
      return value;
    }

    if (this.type() === 'month') {
      return new Intl.DateTimeFormat(this.getLocale(), {
        month: 'long',
        year: 'numeric',
      }).format(date);
    }

    return new Intl.DateTimeFormat(this.getLocale(), {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private parseDate(value: string): Date | null {
    const match = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3] || 1);
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return date;
  }

  private dateKey(value: string): string {
    const date = this.parseDate(value);
    return date ? this.toIsoDate(date) : '';
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getLocale(): string {
    if (typeof document === 'undefined') {
      return 'en-GB';
    }

    return document.documentElement.lang?.toLowerCase().startsWith('ar') ? 'ar-EG' : 'en-GB';
  }

  /**
   * Handle blur
   */
  onBlur(): void {
    if (this.isDateInput()) {
      const normalizedValue = this.normalizeDateInput(this.valueSignal());

      if (normalizedValue !== null) {
        this.valueSignal.set(normalizedValue);
        this.committedValue.set(normalizedValue);
        this.onChange(normalizedValue);
      } else {
        this.valueSignal.set(this.committedValue());
      }
    }

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
   * Uses custom error messages if provided, otherwise falls back to default messages
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
      email: 'VALIDATION.FIELD_CANNOT_BE_EMPTY',
      pattern: 'VALIDATION.FIELD_CANNOT_BE_EMPTY',
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
   * Returns parameters object for translate pipe (e.g., { minLength: 6 })
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

    // Extract dynamic values from validation errors
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
   * Checks if the control has a required validator
   */
  isRequired(): boolean {
    const ctrl = this.control();
    if (!ctrl) {
      return false;
    }

    // Check if control has required validator by checking validators
    if (ctrl.validator) {
      const validator = ctrl.validator({} as AbstractControl);
      if (validator && validator['required']) {
        return true;
      }
    }

    // Check parent form group validators if control doesn't have its own validator
    if (ctrl.parent) {
      const parentValidators = ctrl.parent.validator;
      if (parentValidators) {
        const parentValidatorResult = parentValidators(ctrl.parent);
        if (parentValidatorResult && parentValidatorResult['required']) {
          return true;
        }
      }
    }

    // Also check if control has required error (for async validators or custom validators)
    // This handles cases where the field is required but hasn't been validated yet
    if (ctrl.errors && ctrl.errors['required']) {
      return true;
    }

    return false;
  }
}
