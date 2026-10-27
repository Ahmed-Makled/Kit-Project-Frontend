import { ChangeDetectorRef, DestroyRef, inject, signal } from '@angular/core';
import { IndexPageState } from '../models/index-page-state.model';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Pagination } from '@app/core/models/api-response.model';
import { UrlFilterSyncService } from '@app/core/services/url-filter-sync.service';
import { DateService } from '@app/core/services/date.service';
import { Column } from '../types/columns';

// Helper function to format date as YYYY-MM-DD
function formatDate(date: string): string {
  return new Date(date).toISOString().split('T')[0];
}

export class IndexPageBaseUtils {
  private cd = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  _filterSync = inject(UrlFilterSyncService);
  formBuilder = inject(FormBuilder);
  dateService = inject(DateService);
  activatedRoute = inject(ActivatedRoute);

  page = signal<IndexPageState>(new IndexPageState());
  pageRoute = signal<string>('');
  canSendToParent = signal<boolean>(true);
  advancedSearch = signal<boolean>(false);
  subscriptions = signal<Array<{ unsubscribe: () => void }>>([]);
  searchViewModel = signal<any>({});
  items = signal<any[]>([]);

  selectedItem = signal<any>(null);
  showDeleteModal = signal<boolean>(false);

  // Track which dropdown is currently open
  openDropdownId = signal<number | null>(null);

  unsubscribe(): void {
    this.subscriptions().forEach((subscription) => {
      subscription?.unsubscribe();
    });
  }
  //#region abstract method
  search() {
    // Method search not implemented.
  }

  //#endregion method
  subscribeFilteration(params: Params) {
    const searchForm = this.page()?.searchForm();
    if (searchForm) {
      this._filterSync.loadFromUrl(params, searchForm);
      this.search();
    }
  }

  //#region search
  createSearchForm() {
    this.page().searchForm.set(this.formBuilder.group({}));
  }

  onSearchClicked() {
    const searchForm = this.page().searchForm();
    if (!searchForm) return;

    this.page().options.update((options) => ({ ...options, PageIndex: 1 }));
    this.page().orderBy.set(this.page().orderBy());
    this.page().isAscending.set(false);
    this._filterSync.saveToUrl({ pageRoute: this.pageRoute(), searchForm });
  }
  onSortClicked(column: Column) {
    if (column.Sortable) {
      if (column.Name === this.page().orderBy()) {
        this.page().isAscending.update((v) => !v);
      } else {
        this.page().isAscending.set(false);
      }
      this.page().orderBy.set(column.Name);
      this.page().options.update((options) => ({ ...options, PageIndex: 1 }));
      const searchForm = this.page().searchForm();
      if (searchForm) {
        this._filterSync.saveToUrl({ pageRoute: this.pageRoute(), searchForm });
      }
    }
  }
  resetForm() {
    const searchForm = this.page().searchForm();
    if (!searchForm) return;

    searchForm.reset();
    const fromDateControl = searchForm.get('FromDate');
    const toDateControl = searchForm.get('ToDate');

    if (fromDateControl) {
      fromDateControl.setValue(this.dateService.getFirstDayCurrentMonth());
    }
    if (toDateControl) {
      toDateControl.setValue(new Date());
    }
    this.onSearchClicked();
  }

  get selectedAreaID(): number | undefined {
    const searchForm = this.page().searchForm();
    return searchForm?.get('AreaID')?.value;
  }

  //#endregion search
  //#region Table
  isColumnAscending(column: string): boolean {
    return column === this.page().orderBy() ? this.page().isAscending() : false;
  }

  sortDirection(column: Column): 'ascending' | 'descending' | 'none' | null {
    if (!column.Sortable) {
      return null;
    }

    if (column.Name !== this.page().orderBy()) {
      return 'none';
    }

    return this.page().isAscending() ? 'ascending' : 'descending';
  }

  onChangePageSize() {
    this.onSearchClicked();
  }

  // Region: Pagination methods
  // ==========================================================================================================

  protected goToPage(page: number): void {
    if (page === this.page().options().PageIndex) return;
    if (page >= 1 && page <= this.page().options().TotalPages) {
      this.page().options.update((o) => ({ ...o, PageIndex: page }));
      this.search();
    }
  }

  protected onPageChange(page: number): void {
    this.goToPage(page);
  }

  protected onPageSizeChange(size: number): void {
    this.page().options.update((o) => ({ ...o, PageSize: size, PageIndex: 1 }));
    this.search();
  }

  configurePagination(response?: Pagination<unknown> | null) {
    this.page().options.update((options) => ({
      ...options,
      TotalCount: response?.TotalCount ?? 0,
      TotalPages: response?.TotalPages ?? 0,
      PageSize: response?.PageSize ?? options.PageSize,
      PageIndex: response?.PageIndex ?? options.PageIndex,
    }));
  }
  //#endregion table

  setDefaultDateValues() {
    const current = this.searchViewModel();
    if (current) {
      this.searchViewModel.update((v) => ({
        ...v,
        FromDate: this.dateService.getFirstDayCurrentMonth(),
        ToDate: new Date(),
      }));
    }
  }

  formatDate(date: string) {
    return formatDate(date);
  }

  clearItems() {
    this.items.set([]);
  }

  handleErrorResponse() {
    this.page().isSaving.set(false);
    this.page().isLoading.set(false);
    this.page().isSearching.set(false);
    this.page().isDeleting.set(false);
  }

  subscribeToQueryParams() {
    this.activatedRoute.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => this.subscribeFilteration(params));
  }

  openDeleteModal(item: any): void {
    this.selectedItem.set(item);
    this.showDeleteModal.set(true);
    this.openDropdownId.set(null);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.selectedItem.set(null);
    this.cd.detectChanges();
  }
}
