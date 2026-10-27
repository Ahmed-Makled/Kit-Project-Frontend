import {
  Component,
  Input,
  forwardRef,
  signal,
  computed,
  ElementRef,
  inject,
  effect,
  OnChanges,
  SimpleChanges,
  booleanAttribute,
  DestroyRef,
  afterEveryRender,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { LookupItem } from '@app/shared/types/lookup';
import { DropdownService } from './dropdown.service';

type FormFieldSize = 'sm' | 'md' | 'lg';
type FormFieldVariant = 'default' | 'filled' | 'ghost' | 'inline' | 'button';

export interface DropdownMenuRow {
  option: LookupItem;
  depth: number;
  pathKey: string;
  hasChildren: boolean;
}

/**
 * Searchable dropdown component
 * Reusable dropdown component with search functionality for forms
 */
@Component({
  selector: 'app-dropdown',
  imports: [ReactiveFormsModule, TranslateModule, CommonModule],
  templateUrl: './dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true,
    },
  ],
})
export class DropdownComponent implements ControlValueAccessor, OnChanges {
  private static idCounter = 0;
  readonly generatedId = `ds-dropdown-${++DropdownComponent.idCounter}`;
  get effectiveId(): string {
    return this.id || this.generatedId;
  }
  private readonly formControlDisabled = signal(false);
  get isDisabled(): boolean {
    return this.disabled || this.formControlDisabled();
  }
  private readonly elementRef = inject(ElementRef);
  private readonly dropdownService = inject(DropdownService);
  private readonly translateService = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private dropdownId: string = '';

  // Inputs
  @Input() label = '';
  @Input() labelKey = '';
  @Input() ariaLabel = '';
  @Input() ariaLabelKey = '';
  @Input() placeholder = '';
  @Input() placeholderKey = '';
  @Input() id = '';
  @Input() options: LookupItem[] = [];
  @Input() control?: AbstractControl | null;
  @Input() errorMessages?: Record<string, string>;
  @Input() searchPlaceholder = '';
  @Input() searchPlaceholderKey = '';
  @Input() noResultsText = '';
  @Input() noResultsTextKey = '';
  @Input() disabled = false;
  @Input() clearable = true;
  @Input() isSearchable = true;
  @Input() size: FormFieldSize = 'sm';
  @Input() variant: FormFieldVariant = 'default';
  /** Minimum width (px) of the open menu, useful for narrow triggers (e.g. inline property dropdowns). */
  @Input() menuWidth = 0;
  /** Extra classes appended to the trigger button (e.g. `ds-chip ds-chip--warning` for colored status pills). */
  @Input() triggerClass = '';
  /** When true, bound value is `Array<string | number>` of selected IDs. Dropdown stays open after each toggle. */
  @Input({ transform: booleanAttribute }) multiple = false;
  /** When true, use `Children` on options for expandable hierarchy (see `LookupItem.Children`). Search mode flattens all visible matches until search is cleared. */
  @Input({ transform: booleanAttribute }) tree = false;
  /**
   * Search fields to search in (default: ['Name'])
   * Can include: 'Name', 'Id', 'EnrollmentId', 'Mobile''
   * Example: ['Name', 'EnrollmentId', 'Mobile'] for partners
   */
  @Input() searchFields: string[] = ['Name'];
  // State
  readonly isOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly selectedValue = signal<any>(null);
  readonly optionsSignal = signal<LookupItem[]>([]);
  /** Menu placement relative to the trigger: below or above. Flips to `top` when there is not enough space below. */
  readonly menuPlacement = signal<'bottom' | 'top'>('bottom');
  /** Expanded tree branch path keys (`parent/child/id`) — only used when `tree === true` and search is empty. */
  readonly expandedPaths = signal<Set<string>>(new Set());

  constructor() {
    // Generate unique ID for this dropdown
    this.dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize options signal
    this.optionsSignal.set(this.options);

    // Listen to service changes to close this dropdown if another opens
    effect(() => {
      const openId = this.dropdownService.openDropdownId();
      if (openId !== null && openId !== this.dropdownId && this.isOpen()) {
        this.isOpen.set(false);
        this.searchQuery.set('');
      }
    });

    // Capture-phase document listener so clicks inside a modal (which
    // stopPropagation in the bubble phase) still close the dropdown.
    fromEvent<Event>(document, 'click', { capture: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onClickOutside(event));

    // Re-evaluate space when the viewport or any scroll container changes
    // so the menu stays on screen.
    fromEvent(window, 'resize')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.repositionMenu());
    fromEvent<Event>(document, 'scroll', { capture: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.repositionMenu());

    // After every render (open, search filtering, etc.) re-measure the menu
    // and flip placement when it would overflow the viewport.
    afterEveryRender(() => this.repositionMenu());
  }

  /**
   * Decide where the menu should open based on available viewport space.
   * Defaults to below the trigger; flips above when the menu would overflow.
   */
  private repositionMenu(): void {
    if (!this.isOpen()) return;
    const trigger = this.elementRef.nativeElement.querySelector('.ds-select__trigger') as HTMLElement | null;
    const menu = this.elementRef.nativeElement.querySelector('.ds-select__menu') as HTMLElement | null;
    if (!trigger || !menu) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuHeight = menu.offsetHeight || 320;
    const gap = 8;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const fitsBelow = spaceBelow >= menuHeight + gap;
    this.menuPlacement.set(fitsBelow ? 'bottom' : 'top');
  }

  // Computed
  readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const options = this.optionsSignal();
    const searchFields = this.searchFields || ['Name'];

    if (!query) {
      return options;
    }

    return options.filter((option) => {
      // Search in specified fields
      for (const field of searchFields) {
        const fieldValue = this.getFieldValue(option, field);
        if (fieldValue && fieldValue.toLowerCase().includes(query)) {
          return true;
        }
      }
      return false;
    });
  });

  readonly menuRows = computed((): DropdownMenuRow[] => {
    if (!this.tree) {
      return this.filteredOptions().map((option) => ({
        option,
        depth: 0,
        pathKey: String(option.Id),
        hasChildren: false,
      }));
    }

    const q = this.searchQuery().toLowerCase().trim();
    const rootsSource = q ? this.pruneTreeByQuery(this.optionsSignal(), q) : this.optionsSignal();
    const expanded = this.expandedPaths();

    return q.trim() ? this.flattenTreeAllExpanded(rootsSource, '', 0) : this.flattenTreeRespectingExpand(rootsSource, '', 0, expanded);
  });

  /**
   * Get field value from option object
   * @param option The option object
   * @param field The field name to get
   * @returns The field value as string or null
   */
  private getFieldValue(option: LookupItem, field: string): string | null {
    const value = (option as unknown as Record<string, unknown>)[field];
    return value === null || value === undefined ? null : String(value);
  }

  readonly selectedOption = computed(() => {
    const value = this.selectedValue();
    if (value === null || value === undefined || this.multiple) {
      return null;
    }
    return this.findOptionByIdDeep(value, this.optionsSignal());
  });

  readonly displayText = computed(() => {
    if (this.multiple) return '';
    const value = this.selectedValue();
    if (value === null || value === undefined) {
      return '';
    }
    const option = this.findOptionByIdDeep(value, this.optionsSignal());
    if (!option) {
      return '';
    }

    // For partners: display "Name (EnrollmentId)"
    if (option.EnrollmentId) {
      return `${option.Name} (${option.EnrollmentId})`;
    }

    // Default: just display Name
    return option.Name;
  });

  /**
   * Compare dropdown values while tolerating number/string ID mismatches.
   */
  isOptionSelected(optionId: string | number): boolean {
    const sel = this.selectedValue();
    if (this.multiple) {
      if (!Array.isArray(sel)) return false;
      return sel.some((id) => this.isSameValue(id, optionId));
    }
    return this.isSameValue(sel, optionId);
  }

  isBranchExpanded(pathKey: string): boolean {
    return this.expandedPaths().has(pathKey);
  }

  /** Joined Names for multi-select summary (plain text — do not pipe through translate as a whole). */
  multiSelectionSummary(): string {
    const ids = this.selectedMultiIds();
    if (!ids.length) return '';
    return ids
      .map((id) => {
        const option = this.findOptionByIdDeep(id, this.optionsSignal());
        if (!option) return String(id);
        return this._displayName(option);
      })
      .join(', ');
  }

  /**
   * Trigger text for multi-select: shows the joined names up to two selections,
   * and falls back to a compact "<first name> + <count>" beyond that.
   */
  multiSelectionTriggerText(): string {
    const summary = this.multiSelectionSummary();
    if (!summary) return '';
    const ids = this.selectedMultiIds();
    if (ids.length > 2) {
      const first = this.findOptionByIdDeep(ids[0], this.optionsSignal());
      const firstName = first ? this._displayName(first) : '';
      return firstName ? `${firstName} + ${ids.length}` : `${ids.length}`;
    }
    return summary;
  }

  private _displayName(option: LookupItem): string {
    if (!option.Name) return '';
    // Option names that look like i18n keys are resolved through the active language.
    return option.Name.includes('.') ? this.translateService.instant(option.Name) : option.Name;
  }

  /** Leading icon path `d` for single-select trigger when selected row has icon. */
  triggerSelectedIconPath(): string | undefined {
    if (this.multiple) return undefined;
    return this.selectedOption()?.icon;
  }

  hasClearableSelection(): boolean {
    const v = this.selectedValue();
    if (this.multiple) {
      return Array.isArray(v) && v.length > 0;
    }
    return v !== null && v !== undefined && v !== '';
  }

  toggleExpandBranch(pathKey: string, event: Event): void {
    event.stopPropagation();
    this.expandedPaths.update((prev) => {
      const next = new Set(prev);
      if (next.has(pathKey)) {
        next.delete(pathKey);
      } else {
        next.add(pathKey);
      }
      return next;
    });
  }

  private selectedMultiIds(): Array<string | number> {
    const v = this.selectedValue();
    if (!Array.isArray(v)) return [];
    return [...v];
  }

  private findOptionByIdDeep(target: unknown, nodes: LookupItem[]): LookupItem | null {
    for (const n of nodes) {
      if (this.isSameValue(n.Id, target)) {
        return n;
      }
      if (n.Children?.length) {
        const found = this.findOptionByIdDeep(target, n.Children);
        if (found) return found;
      }
    }
    return null;
  }

  private nodeMatchesQuery(option: LookupItem, query: string): boolean {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const fields = this.searchFields || ['Name'];
    for (const field of fields) {
      const fv = this.getFieldValue(option, field);
      if (fv && fv.toLowerCase().includes(q)) {
        return true;
      }
    }
    return false;
  }

  private pruneTreeByQuery(nodes: LookupItem[], query: string): LookupItem[] {
    const out: LookupItem[] = [];
    for (const n of nodes) {
      const selfMatch = this.nodeMatchesQuery(n, query);
      const filteredKids = n.Children?.length ? this.pruneTreeByQuery(n.Children, query) : [];
      if (selfMatch) {
        out.push({ ...n });
        continue;
      }
      if (filteredKids.length) {
        out.push({ ...n, Children: filteredKids });
      }
    }
    return out;
  }

  private flattenTreeAllExpanded(nodes: LookupItem[], parentPath: string, depth: number): DropdownMenuRow[] {
    const rows: DropdownMenuRow[] = [];
    for (const n of nodes) {
      const pathKey = parentPath ? `${parentPath}/${String(n.Id)}` : String(n.Id);
      const kids = n.Children ?? [];
      const hasChildren = kids.length > 0;
      rows.push({ option: n, depth, pathKey, hasChildren });
      if (hasChildren) {
        rows.push(...this.flattenTreeAllExpanded(kids, pathKey, depth + 1));
      }
    }
    return rows;
  }

  private flattenTreeRespectingExpand(nodes: LookupItem[], parentPath: string, depth: number, expanded: Set<string>): DropdownMenuRow[] {
    const rows: DropdownMenuRow[] = [];
    for (const n of nodes) {
      const pathKey = parentPath ? `${parentPath}/${String(n.Id)}` : String(n.Id);
      const kids = n.Children ?? [];
      const hasChildren = kids.length > 0;
      rows.push({ option: n, depth, pathKey, hasChildren });
      if (hasChildren && expanded.has(pathKey)) {
        rows.push(...this.flattenTreeRespectingExpand(kids, pathKey, depth + 1, expanded));
      }
    }
    return rows;
  }

  private isSameValue(left: unknown, right: unknown): boolean {
    if (left === null || left === undefined || right === null || right === undefined) {
      return left === right;
    }

    return String(left) === String(right);
  }

  private onChange = (value: any) => {};
  private onTouched = () => {};

  sizeClass(): string {
    return `ds-select__trigger--${this.size}`;
  }

  variantClass(): string {
    return `ds-select__trigger--${this.variant}`;
  }

  triggerStateClass(): string {
    return this.hasError() ? 'ds-select__trigger--error' : '';
  }

  /**
   * Handle input changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && changes['options'].currentValue) {
      this.optionsSignal.set(changes['options'].currentValue);
    }
    if (this.isDisabled && this.isOpen()) this.closeDropdown();
  }

  /**
   * Write value from form control
   */
  writeValue(value: any): void {
    if (this.multiple) {
      this.selectedValue.set(Array.isArray(value) ? [...value] : []);
    } else {
      this.selectedValue.set(value ?? null);
    }
  }

  /**
   * Register change callback
   */
  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  /**
   * Register touched callback
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Set disabled state
   */
  setDisabledState(isDisabled: boolean): void {
    this.formControlDisabled.set(isDisabled);
    if (this.isDisabled && this.isOpen()) this.closeDropdown();
  }

  /**
   * Toggle dropdown
   */
  toggleDropdown(): void {
    if (this.isDisabled) return;
    const willBeOpen = !this.isOpen();
    this.isOpen.set(willBeOpen);

    if (willBeOpen) {
      // Close all other dropdowns and register this one as open
      this.dropdownService.setOpenDropdown(this.dropdownId);
      this.menuPlacement.set('bottom');
    } else {
      // Close this dropdown
      this.dropdownService.setOpenDropdown(null);
      this.searchQuery.set('');
    }
  }

  /**
   * Select option
   */
  selectOption(option: LookupItem): void {
    if (this.isDisabled || option.IsActive === false) return;

    if (this.multiple) {
      const sid = option.Id;
      let current = this.selectedValue();
      if (!Array.isArray(current)) current = [];
      const exists = current.some((id: unknown) => this.isSameValue(id, sid));
      const next = exists ? current.filter((id: unknown) => !this.isSameValue(id, sid)) : [...current, sid];
      this.selectedValue.set(next);
      this.onChange(next);
      this.onTouched();
      return;
    }

    this.selectedValue.set(option.Id);
    this.onChange(option.Id);
    this.onTouched();
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.dropdownService.setOpenDropdown(null);
  }

  /**
   * Handle search input
   */
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  /**
   * Clear selection
   */
  clearSelection(event: Event): void {
    event.stopPropagation();
    if (this.isDisabled) return;
    const empty = this.multiple ? [] : null;
    this.selectedValue.set(empty);
    this.onChange(empty);
    this.onTouched();
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.onTouched();
    if (this.dropdownService.openDropdownId() === this.dropdownId) {
      this.dropdownService.setOpenDropdown(null);
    }
  }

  onEscape(event: Event): void {
    if (!this.isOpen()) return;
    event.stopPropagation();
    this.closeDropdown();
    this.elementRef.nativeElement.querySelector('.ds-select__trigger')?.focus();
  }

  /**
   * Check if control has error
   */
  hasError(): boolean {
    return !!(this.control?.invalid && this.control?.touched);
  }

  /**
   * Get error message key
   */
  getErrorMessageKey(): string | null {
    if (!this.hasError() || !this.control?.errors) {
      return null;
    }

    const errorKey = Object.keys(this.control.errors)[0];

    if (this.errorMessages && this.errorMessages[errorKey]) {
      return this.errorMessages[errorKey];
    }

    const defaultMessages: Record<string, string> = {
      required: 'VALIDATION.REQUIRED',
      minlength: 'VALIDATION.MIN_LENGTH',
      maxlength: 'VALIDATION.MAX_LENGTH',
    };

    return defaultMessages[errorKey] || 'VALIDATION.FIELD_CANNOT_BE_EMPTY';
  }

  /**
   * Get error message parameters
   */
  getErrorMessageParams(): Record<string, any> | null {
    if (!this.hasError() || !this.control?.errors) {
      return null;
    }

    const errorKey = Object.keys(this.control.errors)[0];
    const errorValue = this.control.errors[errorKey];

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
    if (!this.control) {
      return false;
    }

    // Check if control has required validator by checking validators
    if (this.control.validator) {
      const validator = this.control.validator({} as AbstractControl);
      if (validator && validator['required']) {
        return true;
      }
    }

    // Check parent form group validators if control doesn't have its own validator
    if (this.control.parent) {
      const parentValidators = this.control.parent.validator;
      if (parentValidators) {
        const parentValidatorResult = parentValidators(this.control.parent);
        if (parentValidatorResult && parentValidatorResult['required']) {
          return true;
        }
      }
    }

    // Also check if control has required error (for async validators or custom validators)
    // This handles cases where the field is required but hasn't been validated yet
    if (this.control.errors && this.control.errors['required']) {
      return true;
    }

    return false;
  }

  onClickOutside(event: Event): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside && this.isOpen()) {
      this.closeDropdown();
    }
  }
}
