import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DropdownService {
  private readonly _openDropdownId = signal<string | null>(null);

  /**
   * Public readonly signal for open dropdown ID
   */
  readonly openDropdownId = computed(() => this._openDropdownId());

  /**
   * Register dropdown open/close
   */
  setOpenDropdown(id: string | null): void {
    this._openDropdownId.set(id);
  }

  /**
   * Get currently open dropdown ID
   */
  getOpenDropdownId(): string | null {
    return this._openDropdownId();
  }

  /**
   * Check if a dropdown is open
   */
  isDropdownOpen(id: string): boolean {
    return this._openDropdownId() === id;
  }

  /**
   * Close all dropdowns
   */
  closeAll(): void {
    this._openDropdownId.set(null);
  }
}
