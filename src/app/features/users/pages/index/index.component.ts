import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '@app/core/services/toast.service';
import { ApiResponse, Pagination } from '@app/core/models/api-response.model';
import { IndexPageState } from '@app/shared/models/index-page-state.model';
import { LookupItem } from '@app/shared/types/lookup';
import { IndexPageBaseUtils } from '@app/shared/utils/index-page.utils';
import { Column } from '@app/shared/types/columns';
import { noWhitespaceValidator } from '@app/shared/validators/no-whitespace.validator';
import { BadgeComponent, type BadgeVariant } from '@app/shared/components/badge/badge.component';
import { DropdownComponent } from '@app/shared/components/dropdown/dropdown.component';
import { EmptyStateComponent } from '@app/shared/components/empty-state/empty-state.component';
import { InputComponent } from '@app/shared/components/input/input.component';
import { ModalRef } from '@app/shared/components/modal/modal-ref';
import { ModalService } from '@app/shared/components/modal/modal.service';
import { PaginationComponent } from '@app/shared/components/pagination/pagination.component';
import { SpinnerComponent } from '@app/shared/components/spinner/spinner.component';
import { ToggleComponent } from '@app/shared/components/toggle/toggle.component';
import { User, UserSearchViewModel } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { Roles } from '@app/shared/enums/roles';
import { LookupsService } from '@app/shared/services/lookups';

@Component({
  selector: 'app-users-index',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    DropdownComponent,
    PaginationComponent,
    InputComponent,
    ToggleComponent,
    BadgeComponent,
    EmptyStateComponent,
    SpinnerComponent,
  ],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersIndexComponent extends IndexPageBaseUtils implements OnInit {
  private readonly _toastService = inject(ToastService);
  private readonly _userService = inject(UserService);
  private readonly _lookupsService = inject(LookupsService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);
  private readonly _modalService = inject(ModalService);

  // Region: Page state
  // ==========================================================================================================
  override page = signal<IndexPageState>(new IndexPageState());
  override pageRoute = signal('/users/home');
  override searchViewModel = signal<UserSearchViewModel>({} as UserSearchViewModel);
  override items = signal<User[]>([]);

  readonly statusList = signal<LookupItem[]>([]);
  readonly roleList = signal<LookupItem[]>([]);

  // Region: Dialog state
  // ==========================================================================================================
  private _modalRef?: ModalRef;

  readonly itemToDelete = signal<User | null>(null);
  readonly itemToReset = signal<User | null>(null);

  protected readonly deleteModalTemplate = viewChild<TemplateRef<any>>('deleteModalTemplate');
  protected readonly resetModalTemplate = viewChild<TemplateRef<any>>('resetModalTemplate');
  protected readonly statusModalTemplate = viewChild<TemplateRef<any>>('statusModalTemplate');

  // Region: Forms
  // ==========================================================================================================
  resetPasswordForm: FormGroup = this.formBuilder.group({
    NewPassword: ['', [Validators.required, noWhitespaceValidator(), Validators.minLength(6)]],
    ConfirmPassword: ['', [Validators.required, noWhitespaceValidator()]],
  });

  // Region: Lifecycle
  // ==========================================================================================================
  ngOnInit(): void {
    this.defineColumns();
    this.createSearchForm();
    this.retrieveData();
    this.subscribeToQueryParams();
  }

  override subscribeToQueryParams(): void {
    this.activatedRoute.queryParams.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((params) => this.subscribeFilteration(params));
  }

  // Region: Columns definitions
  // ==========================================================================================================
  defineColumns(): void {
    const columns: Column[] = [
      { Name: '#', Title: '#', Selectable: false, Sortable: false },
      { Name: 'Name', Title: 'SHARED.FIELDS.NAME', Selectable: true, Sortable: true },
      { Name: 'Username', Title: 'SHARED.FIELDS.USERNAME', Selectable: true, Sortable: true },
      { Name: 'Email', Title: 'SHARED.FIELDS.EMAIL', Selectable: true, Sortable: true },
      { Name: 'Role', Title: 'SHARED.FIELDS.ROLE', Selectable: true, Sortable: false },
      { Name: 'IsActive', Title: 'SHARED.FIELDS.STATUS', Selectable: true, Sortable: false },
      { Name: 'Action', Title: 'SHARED.FIELDS.ACTIONS', Selectable: false, Sortable: false },
    ];
    this.page().columns.set(columns);
  }

  // Region: Search form creation
  // ==========================================================================================================
  override createSearchForm(): void {
    this.page().searchForm.set(
      this.formBuilder.group({
        Search: [this.searchViewModel().Search ?? ''],
        Username: [this.searchViewModel().Username ?? ''],
        IsActive: [this.searchViewModel().IsActive],
        Role: [this.searchViewModel().Role],
      }),
    );
  }

  // Region: Retrieve data
  // ==========================================================================================================
  retrieveData(): void {
    this._lookupsService
      .getStatuses()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((statuses) => this.statusList.set(statuses));

    this._lookupsService
      .getRoles()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((roles) => this.roleList.set(roles));
  }

  // Region: Search & Navigation
  // ==========================================================================================================
  override search(): void {
    this.page().isSearching.set(true);
    this.clearItems();

    const criteria = this._prepareSearchData();
    const options = this.page().options();
    this.page().isLoading.set(true);

    this._userService
      .get(criteria, this.page().orderBy(), this.page().isAscending(), options.PageIndex, options.PageSize)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (res) => this._handleSearchResponse(res),
        error: () => this.handleErrorResponse(),
      });
  }

  private _prepareSearchData(): UserSearchViewModel {
    const formValue = this.page().searchForm()?.value;
    return formValue ?? this.searchViewModel();
  }

  private _handleSearchResponse(response: ApiResponse<Pagination<User>>): void {
    this.page().isSearching.set(false);
    this.configurePagination(response?.Data);
    this.items.set(response?.Data?.Items ?? []);
    this.page().isLoading.set(false);
  }

  goToCreateUser(): void {
    this._router.navigate(['/users/create']);
  }

  goToEditUser(user: User): void {
    this._router.navigate(['/users/edit', user.Id]);
  }

  // Region: Reset Password Dialog
  // ==========================================================================================================
  onResetRequest(item: User): void {
    if (this.page().isSaving()) return;
    this.itemToReset.set(item);
    this.resetPasswordForm.reset();
    this._modalRef = this._modalService.open(this.resetModalTemplate()!, {
      width: '400px',
      position: 'center',
      backdropClose: false,
    });
  }

  cancelReset(): void {
    this._closeResetDialog();
  }

  submitReset(): void {
    if (this.page().isSaving()) return;
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const { NewPassword, ConfirmPassword } = this.resetPasswordForm.getRawValue();
    if (NewPassword !== ConfirmPassword) {
      this._toastService.error('USERS.ERRORS.PASSWORDS_DO_NOT_MATCH');
      return;
    }

    const item = this.itemToReset();
    if (!item) return;

    this.page().isSaving.set(true);

    this._userService
      .resetPassword(item.Id, { NewPassword })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (res) => this._handleResetResponse(res),
        error: () => this.handleErrorResponse(),
      });
  }

  private _handleResetResponse(response: ApiResponse<unknown>): void {
    this.page().isSaving.set(false);
    if (response.IsSuccess) this._closeResetDialog();
    this._toastService.showToaster(response);
  }

  private _closeResetDialog(): void {
    this._modalRef?.close();
    this.itemToReset.set(null);
  }

  // Region: Delete Dialog
  // ==========================================================================================================
  onDeleteRequest(item: User): void {
    if (this.page().isSaving()) return;
    this.itemToDelete.set(item);
    this.openDropdownId.set(null);
    this._modalRef = this._modalService.open(this.deleteModalTemplate()!, {
      width: '400px',
      position: 'center',
    });
  }

  override cancelDelete(): void {
    this._modalRef?.close();
    this.itemToDelete.set(null);
  }

  submitDelete(): void {
    if (this.page().isSaving()) return;
    const item = this.itemToDelete();
    if (!item) return;
    this.page().isSaving.set(true);
    this._userService
      .delete(item.Id.toString())
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (res) => this._handleDeleteResponse(res),
        error: () => this.handleErrorResponse(),
      });
  }

  private _handleDeleteResponse(response: ApiResponse<unknown>): void {
    this.page().isSaving.set(false);
    this._modalRef?.close();
    this.itemToDelete.set(null);
    this._toastService.showToaster(response);

    if (response?.IsSuccess) {
      const isLastItemOnPage = this.items().length === 1;
      const currentPage = this.page().options().PageIndex;

      if (isLastItemOnPage && currentPage > 1) {
        this.page().options.update((options) => ({ ...options, PageIndex: currentPage - 1 }));
      }

      this.search();
    }
  }

  // Region: Status Toggle Dialog
  // ==========================================================================================================
  showChangeStatusModal(item: User): void {
    if (this.page().isSaving()) return;
    this._modalRef?.close();
    this.selectedItem.set(item);
    this._modalRef = this._modalService.open(this.statusModalTemplate()!, {
      width: '400px',
      position: 'center',
    });
  }

  confirmStatusChange(): void {
    if (this.page().isSaving() || !this.selectedItem()) return;
    const item: User = this.selectedItem();
    const isActive = !item.IsActive;
    this.page().isSaving.set(true);
    this._userService
      .changeStatus(item.Id, { IsActive: isActive })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (res) => this._handleChangeStatusResponse(res, item.Id, isActive),
        error: () => this._handleChangeStatusFailure(),
      });
  }
  private _handleChangeStatusResponse(response: ApiResponse<User>, id: string, isActive: boolean): void {
    this.page().isSaving.set(false);
    this._toastService.showToaster(response);
    if (response.IsSuccess) {
      this.items.update((users) => users.map((u) => (u.Id === id ? { ...u, IsActive: isActive } : u)));
    }
    this._closeStatusChangeDialog();
  }
  private _handleChangeStatusFailure(): void {
    this._closeStatusChangeDialog();
    this.handleErrorResponse();
  }

  cancelStatusChange(): void {
    this._closeStatusChangeDialog();
  }

  private _closeStatusChangeDialog(): void {
    this._modalRef?.close();
    this.selectedItem.set(null);
  }

  // Region: UI Helpers & View Logic
  // ==========================================================================================================
  roleBadgeVariant(role: number): BadgeVariant {
    return role === Roles.Admin ? 'admin' : 'user';
  }

  roleTranslationKey(role: number): string {
    return role === Roles.Admin ? 'USERS.ROLES.ADMIN' : 'USERS.ROLES.USER';
  }
}
