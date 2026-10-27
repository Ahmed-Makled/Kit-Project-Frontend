import { Component, input, output, signal, linkedSignal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ClickOutsideDirective } from '@app/shared/directives/click-outside.directive';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pagination',
  imports: [TranslateModule, ClickOutsideDirective],

  templateUrl: './pagination.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly pageIndex = input<number>(1);
  readonly totalPages = input<number>(1);
  readonly pageSize = input<number>(50);
  readonly totalItems = input<number>(0);
  readonly showPagesNumbers = input<boolean>(false);
  readonly showPageSizeOptions = input<boolean>(true);
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly pageSizeOptions = signal<number[]>([10, 25, 50]);
  protected readonly isPageSizeOptionsOpen = signal<boolean>(false);
  protected readonly pageSizeLinked = linkedSignal(() => this.pageSize());

  protected readonly Math = Math;
  protected readonly firstItem = computed(() => (this.totalItems() === 0 ? 0 : (this.pageIndex() - 1) * this.pageSizeLinked() + 1));

  protected goToPage(page: number): void {
    if (Number.isInteger(page) && page !== this.pageIndex() && page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }

  protected getVisiblePages(): number[] {
    const pages: number[] = [];
    if (this.totalPages() <= 20) {
      for (let i = 1; i <= this.totalPages(); i++) pages.push(i);
      return pages;
    }

    // Always show first, last, current, and 2 before/after current
    pages.push(1);
    if (this.pageIndex() > 4) pages.push(-1); // -1 means ellipsis

    for (let i = this.pageIndex() - 2; i <= this.pageIndex() + 2; i++) {
      if (i > 1 && i < this.totalPages()) pages.push(i);
    }

    if (this.pageIndex() < this.totalPages() - 3) pages.push(-1);
    pages.push(this.totalPages());

    return pages;
  }

  protected setPageSize(size: number): void {
    if (!this.pageSizeOptions().includes(size) || size === this.pageSizeLinked()) {
      this.isPageSizeOptionsOpen.set(false);
      return;
    }
    this.pageSizeLinked.set(size);
    this.isPageSizeOptionsOpen.set(false);
    this.pageSizeChange.emit(size);
  }
}
