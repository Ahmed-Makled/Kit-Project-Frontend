import { User } from '../../models/user.model';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InputComponent } from '@app/shared/components/input/input.component';
import { DropdownComponent } from '@app/shared/components/dropdown/dropdown.component';
import { SpinnerComponent } from '@app/shared/components/spinner/spinner.component';
import { EmptyStateComponent } from '@app/shared/components/empty-state/empty-state.component';
import { TranslateModule } from '@ngx-translate/core';
import { CreatePageState } from '@app/shared/models/create-page-state.model';
import { LookupItem } from '@app/shared/types/lookup';
import { noWhitespaceValidator } from '@app/shared/validators/no-whitespace.validator';
import { ApiResponse } from '@app/core/models/api-response.model';
import { ToastService } from '@app/core/services/toast.service';
import { LookupsService } from '@app/shared/services/lookups';
import { Roles } from '@app/shared/enums/roles';

@Component({
  selector: 'app-user-create',
  templateUrl: './create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [ReactiveFormsModule, TranslateModule, InputComponent, DropdownComponent, SpinnerComponent, EmptyStateComponent],
})
export class UserCreateComponent implements OnInit {
  private _toastService = inject(ToastService);
  private _routeService = inject(Router);
  private _formBuilder = inject(FormBuilder);
  private _activatedRoute = inject(ActivatedRoute);
  private _pageService = inject(UserService);
  private _lookupsService = inject(LookupsService);
  private _destroyRef = inject(DestroyRef);
  roleOptions: LookupItem[] = [];
  page: CreatePageState = new CreatePageState();
  model = signal<Partial<User>>({});
  fetchFailed = signal(false);

  get form() {
    return this.page.form;
  }

  ngOnInit(): void {
    this.getRoles();
    this._loadRouteParameters();
    this._setupForm();
  }

  private getRoles() {
    this._lookupsService
      .getRoles()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((res) => {
        this.roleOptions = res.filter((role) => role.Id !== '');
      });
  }
  // Region: Load Route Parameters
  // ==========================================================================================================
  private _loadRouteParameters(): void {
    this._activatedRoute.paramMap.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((params) => {
      if (params.has('id')) {
        this.model.update((model) => ({ ...model, Id: params.get('id') as string }));
        this.page.isEdit.set(true);
      }
    });
  }

  // Region: Setup Form
  // ==========================================================================================================
  private _setupForm(): void {
    if (this.page.isEdit()) {
      this.getEditableItem();
    } else {
      this.createForm();
    }
  }

  // Region: Retrieve Data
  // ==========================================================================================================
  getEditableItem(): void {
    this.fetchFailed.set(false);
    this.page.isPageLoaded.set(false);
    this._pageService
      .getById(this.model().Id!)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (res) => {
          if (res.IsSuccess && res.Data) {
            this.model.set(res.Data);
            this.createForm();
          } else {
            this.fetchFailed.set(true);
            this.page.isPageLoaded.set(true);
          }
        },
        error: () => {
          this.fetchFailed.set(true);
          this.page.isPageLoaded.set(true);
        },
      });
  }

  // Region: Create Form
  // ==========================================================================================================
  createForm(): void {
    const isEdit = this.page.isEdit();
    this.page.form = this._formBuilder.group({
      FirstName: [this.model().FirstName, [Validators.required, noWhitespaceValidator(), Validators.maxLength(200)]],
      LastName: [this.model().LastName, [Validators.required, noWhitespaceValidator(), Validators.maxLength(200)]],
      ...(!isEdit ? { Email: [this.model().Email, [Validators.maxLength(200), Validators.email]] } : {}),
      ...(!isEdit
        ? {
            Username: [this.model().Username, [Validators.required, noWhitespaceValidator(), Validators.maxLength(200)]],
            Password: ['', [Validators.required, noWhitespaceValidator(), Validators.minLength(6), Validators.maxLength(200)]],
          }
        : {}),
      Role: [this.model().Role ?? Roles.Admin, [Validators.required]],
    });
    this.page.isPageLoaded.set(true);
  }

  // Region: Persist
  // ==========================================================================================================
  save(): void {
    if (this.page.isSaving()) return;
    if (this.page.form.invalid) {
      this.page.form.markAllAsTouched();
      return;
    }

    this.page.isSaving.set(true);
    const email = this.page.form.get('Email');
    email?.setValue(email.value?.trim() || null, { emitEvent: false });
    const model: Partial<User> = this.page.form.getRawValue();
    const request = this.model().Id ? this._pageService.put(this.model().Id!, model) : this._pageService.post(model);
    request.pipe(takeUntilDestroyed(this._destroyRef)).subscribe({
      next: (response) => this._handleSaveResponse(response),
      error: () => this._handleErrorResponse(),
    });
  }

  private _handleSaveResponse(response: ApiResponse<unknown>): void {
    this.page.isSaving.set(false);
    this._toastService.showToaster(response);
    if (response?.IsSuccess) {
      this._handleSuccessResponse();
    }
  }

  private _handleSuccessResponse(): void {
    if (!this.model().Id) {
      this.createForm();
    }
    this._routeService.navigate(['/users']);
  }

  private _handleErrorResponse(): void {
    this.page.isSaving.set(false);
  }

  // Region: Helpers
  // ==========================================================================================================
  cancel(): void {
    this._routeService.navigate(['/users']);
  }

  disabledSubmit(): boolean {
    return this.page.isSaving() || this.page.form.invalid;
  }
}
