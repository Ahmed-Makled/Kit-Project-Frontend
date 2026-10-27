# Users Implementation Reference

This guide explains the concrete pattern in src/app/features/users. It is an implementation reference, not a business contract. Replace User-specific names, fields, endpoints, roles, translations, and actions with the requested feature's exact contract.

## 1. Reference map

| Concern       | Users reference                      | Required adaptation                             |
| ------------- | ------------------------------------ | ----------------------------------------------- |
| Routes        | users.routes.ts                      | Feature route name and page component names     |
| Layout        | layout/layout.component.ts and .html | Feature title, subtitle, icon, and action       |
| Entity types  | models/user.model.ts                 | Backend entity, filter, and request models      |
| API calls     | services/user.service.ts             | Exact API paths and response types              |
| List state    | pages/index/index.component.ts       | Feature columns, filters, lookups, and actions  |
| List template | pages/index/index.component.html     | Feature fields and translated actions           |
| Form state    | pages/create/create.component.ts     | Feature form, validators, loading, and payloads |
| Form template | pages/create/create.component.html   | Feature sections and controls                   |

The reference is read from the checkout at implementation time. Do not rely on a copied summary if the source has changed.

## 2. Route shape

Users exposes a layout route with a home list page and sibling create/edit pages:

```typescript
export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then((m) => m.UsersLayoutComponent),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/index/index.component').then((m) => m.UsersIndexComponent),
      },
    ],
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/create/create.component').then((m) => m.UserCreateComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/create/create.component').then((m) => m.UserCreateComponent),
  },
];
```

Use the same shape when create and edit share a workflow. The list page route is /<feature>/home, while the feature root is used for back/cancel navigation. Register the feature under the authenticated shell; do not create an independent layout or guard unless the repository requires it.

## 3. Layout pattern

UsersLayoutComponent is a small standalone shell. It imports RouterOutlet and TranslateModule, injects Router, and has one action method that navigates to /users/create. The template contains:

1. A flex header with a feature icon.
2. A translated h1.
3. A translated subtitle hidden at the smallest breakpoint.
4. A translated primary Add button.
5. A router-outlet.

Keep the header short. Do not put list state, API calls, filters, or entity actions in the layout. The layout owns only feature-level navigation.

## 4. Model pattern

Use backend models directly, following the current Users implementation without separate frontend DTOs or field-renaming layers. The following model is illustrative only; use the verified backend names, fields, types, and nullability:

```typescript
export interface FeatureSearchViewModel {
  Search?: string;
  Status?: boolean | string;
}

interface FeatureCoreFields {
  Name: string;
}

export interface Feature extends BaseEntity, FeatureCoreFields {
  IsActive: boolean;
}
```

Do not create frontend DTOs or mapping layers. Bind form fields using the backend request model's exact names and submit them directly. Include only fields accepted by the endpoint; exclude server-managed and display-only fields. Preserve optional and nullable fields exactly.

## 5. Service pattern

UserService injects the BASE_API token and keeps every Users endpoint in one service. Follow the same organization:

Import `BASE_API` from `@app/core/tokens/api.tokens` and `BaseEntity`, `ApiResponse`, and `Pagination` from `@app/core/models/api-response.model`. Use direct imports throughout; barrel files have been removed.

```typescript
@Injectable({ providedIn: 'root' })
export class FeatureService {
  private readonly api = inject(BASE_API);

  get(
    searchViewModel: Partial<Feature> | null,
    orderBy: string,
    isAscending: boolean,
    pageIndex: number,
    pageSize = 50,
  ): Observable<ApiResponse<Pagination<Feature>>> {
    let params = new HttpParams()
      .set('OrderBy', orderBy)
      .set('IsAscending', isAscending.toString())
      .set('PageIndex', pageIndex.toString())
      .set('PageSize', pageSize.toString());

    if (searchViewModel) {
      Object.keys(searchViewModel).forEach((key) => {
        const value = searchViewModel[key as keyof typeof searchViewModel];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.api.get<Pagination<Feature>>('Feature/get', { params });
  }

  getById(id: string | number): Observable<ApiResponse<Feature>> {
    return this.api.get<Feature>(`Feature/${id}`);
  }

  post(model: Feature): Observable<ApiResponse<unknown>> {
    return this.api.post<unknown>('Feature/Post', model);
  }

  put(id: string | number, model: Feature): Observable<ApiResponse<boolean>> {
    return this.api.put<boolean>(`Feature/${id}`, model);
  }
}
```

The endpoint names above are placeholders only. Replace them with the verified contract. Preserve false and numeric-zero filters; omit only empty strings, null, undefined, or values the backend explicitly treats as absent.

## 6. List component lifecycle

UsersIndexComponent follows this order:

```typescript
override page = signal<IndexPageState>(new IndexPageState());
override pageRoute = signal('/users/home');
override searchViewModel = signal<UserSearchViewModel>({});
override items = signal<User[]>([]);

ngOnInit(): void {
  this.defineColumns();
  this.createSearchForm();
  this.retrieveData();
  this.subscribeToQueryParams();
}
```

This order is important. Columns must exist before the table renders. The search form must exist before UrlFilterSyncService restores query parameters. Query-param subscription is what triggers the initial search.

The feature list should contain these methods, with only the names and data adapted:

- defineColumns: creates translated Column entries and marks sortable columns.
- createSearchForm: creates the FormGroup used by the shared filter sync.
- retrieveData: loads feature-specific dropdown/lookup options.
- subscribeToQueryParams: subscribes with takeUntilDestroyed and delegates to subscribeFilteration.
- search: sets isSearching and isLoading, clears stale items, prepares criteria, calls the service, and handles success/error.
- response handler: clears flags, calls configurePagination(response.Data), and sets items from response.Data.Items.
- navigation helpers: route to create and edit pages.
- modal/action handlers: confirm, call the service, show the toast, refresh or update local state, then close the modal.

The standard search flow is:

```typescript
override search(): void {
  this.page().isSearching.set(true);
  this.clearItems();
  const criteria = this.prepareSearchData();
  const options = this.page().options();
  this.page().isLoading.set(true);

  this.featureService.get(
    criteria,
    this.page().orderBy(),
    this.page().isAscending(),
    options.PageIndex,
    options.PageSize,
  ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next: response => this.handleSearchResponse(response),
    error: () => this.handleErrorResponse(),
  });
}
```

Use the repository's actual private-field naming and handler style. Do not create a second pagination or filter-sync implementation. Use IndexPageBaseUtils for sorting, page changes, page-size changes, URL persistence, and pagination configuration.

## 7. List template state branches

Match the Users template's top-level state order:

1. Render the filter form when the page search form exists.
2. Show SpinnerComponent while loading or searching.
3. Show EmptyStateComponent when the loaded item list is empty.
4. Otherwise render a native table using shared table classes and the shared pagination component.
5. Keep modal templates after the main list markup.

Use app-input for text filters, app-dropdown for lookup filters, app-toggle for status where requested, app-badge for statuses/roles, app-pagination for pagination, app-spinner for loading, and app-empty-state for empty/error states. Import every standalone component used by the template.

For every table:

- Use ds-table-card and ds-table.
- Keep table markup in the feature template; do not create a shared table component.
- Generate headers from the page column signal.
- Use ds-th and ds-td.
- Put the table in overflow-x-auto.
- Make sortable headers call onSortClicked.
- Give icon-only row actions translated aria-label and title values.
- Use modal confirmation before destructive or consequential operations.

When deleting, preserve the Users behavior: if the deleted item was the only row on a page greater than one, decrement PageIndex before refreshing. When changing a status, update the local item only after IsSuccess is true.

## 8. Create/edit lifecycle

UserCreateComponent uses this sequence:

```typescript
ngOnInit(): void {
  this.loadLookups();
  this.loadRouteParameters();
  this.setupForm();
}

private setupForm(): void {
  if (this.page.isEdit()) {
    this.loadEditableItem();
  } else {
    this.createForm();
  }
}
```

loadRouteParameters reads ActivatedRoute.paramMap, detects id, stores it in the model, and sets isEdit. Edit loading must finish before createForm runs. A missing response sets fetchFailed and marks the page loaded so the template can show recovery UI.

createForm builds a FormGroup from the model. Create-only fields are conditionally added. Use validators.required, noWhitespaceValidator, maxLength, minLength, email, and feature-specific validators only when the contract requires them. Do not make an optional API field required for visual convenience.

save follows this sequence:

1. Return after markAllAsTouched when the form is invalid.
2. Set isSaving.
3. Read getRawValue.
4. Use the backend update model when model.Id exists, without frontend mapping or separate DTOs.
5. Use the backend create model otherwise, keeping exact field names and accepted fields.
6. Call the matching service method with takeUntilDestroyed.
7. Clear isSaving and show ToastService response.
8. Navigate only when response.IsSuccess is true.
9. Clear isSaving in the error handler and preserve recoverable form state.

The template uses a translated eyebrow, title, subtitle, back button, loaded/error/form branches, section cards, shared controls, and a footer with Cancel and Create/Update buttons. The submit button must be disabled while saving or when the form is invalid.

## 9. Translation and asset pattern

Add equivalent keys to both translation files. Users uses top-level shared keys plus a USERS namespace containing page copy, empty copy, confirmations, errors, roles, and FORM sections. A new feature should follow the same grouping:

```json
"FEATURE": {
  "PAGE_SUBTITLE": "...",
  "EMPTY": "...",
  "FIELDS": {},
  "FILTERS": {},
  "FORM": {},
  "ERRORS": {}
}
```

Keep key sets equivalent between English and Arabic. Do not put feature text in TypeScript or templates. Use existing shared actions and field labels where they fit.

Reuse existing SVGs before creating new files. Decorative icons use alt="" and aria-hidden="true". Sidebar features need both inactive and active variants and must follow `AGENTS.md`.

## 10. Common mistakes to reject

- Creating a list page at /feature instead of following the /feature/home route shape without a deliberate contract reason.
- Subscribing to query params before creating the search form.
- Calling the API directly from the template or layout.
- Sending the entire form value as an update payload.
- Dropping false filters because the query builder checks truthiness.
- Forgetting takeUntilDestroyed on feature subscriptions.
- Clearing isSaving only on success and leaving the page stuck after an error.
- Navigating after a failed API response.
- Adding a button for an endpoint that does not exist.
- Hiding a navigation item and treating that as authorization.
- Hard-coding English or Arabic copy.
- Copying USERS keys or User role logic into another feature.
- Adding a custom stylesheet when existing shared classes already match Users.

## 11. Verification checklist

Run only checks available in the environment, and report their actual result:

```bash
node -e "JSON.parse(require('fs').readFileSync('public/assets/i18n/en.json','utf8')); JSON.parse(require('fs').readFileSync('public/assets/i18n/ar.json','utf8')); console.log('translations valid')"
rg -n "User|USERS\\.|Users/|/users" src/app/features/<feature> || true
rg -n "images/icons/" src/app/features/<feature>
npm run build
```

The residual-reference search is expected to find no copied Users implementation details in the new feature. Do not report npm build success when dependencies, API access, or the Angular builder are unavailable.
