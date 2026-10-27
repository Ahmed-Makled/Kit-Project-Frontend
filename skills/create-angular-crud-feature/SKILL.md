---
name: create-angular-crud-feature
description: Create Angular CRUD features that follow the repository's Users feature structure, API, state, routing, shared UI, and translation conventions.
---

# Create Angular CRUD Feature

Use this skill for any Angular feature that lists entities, searches or filters them, opens create/edit forms, or performs entity actions.

The canonical reference is:

/Users/ahmedmakled/Development/Kit-Project-Frontend/src/app/features/users

The Users feature is the implementation authority for this repository. A developer or AI MUST reproduce its structure and code flow, adapting only the entity, API contract, translations, permissions, and requested actions.

The concrete implementation walkthrough is in references/users-implementation-guide.md. Read it together with the source files before generating code; this file defines the rules, while the reference guide shows the expected sequence and shapes.

## Mandatory rules

- Read the Users reference before editing.
- Inspect the actual API/OpenAPI contract before writing models, query parameters, payloads, or endpoints.
- Reuse the repository's standalone components, signal state, shared utilities, design tokens, services, and translation system.
- Do not invent endpoints, fields, DTOs, permissions, response shapes, mock data, or fallback local behavior.
- Do not add actions just because Users has them; implement only contract-supported and requested operations.
- Do not copy User fields, USERS translation keys, user roles, user endpoints, or user-specific behavior.
- Preserve unrelated changes.
- Read `AGENTS.md` first and follow its restrictions throughout implementation, including no spec/test scaffolding, direct imports, and native tables with shared classes.
- Use the pinned local Prettier and project Angular generator defaults. Before handoff, run `npm run format:check`; do not introduce competing per-feature formatter settings.
- Do not claim a build, test, browser, or API check passed unless it actually ran.

## Required preflight

Read these files before implementation:

- src/app/features/users/users.routes.ts
- src/app/features/users/layout/layout.component.ts
- src/app/features/users/layout/layout.component.html
- src/app/features/users/models/user.model.ts
- src/app/features/users/services/user.service.ts
- src/app/features/users/pages/index/index.component.ts
- src/app/features/users/pages/index/index.component.html
- src/app/features/users/pages/create/create.component.ts
- src/app/features/users/pages/create/create.component.html
- src/app/shared/utils/index-page.utils.ts
- src/app/shared/models/index-page-state.model.ts
- src/app/shared/models/create-page-state.model.ts
- src/app/core/models/api-response.model.ts
- src/app/core/tokens/api.tokens.ts
- src/app/app.routes.ts
- src/app/shared/layout/main-layout.component.ts
- src/app/shared/services/lookups.ts
- AGENTS.md
- skills/create-angular-crud-feature/references/users-implementation-guide.md

Then identify and record:

- List, detail, create, update, delete, and custom-action routes.
- Query parameter names and casing.
- Backend request/response model fields, casing, types, and nullability.
- Response envelope and pagination shape.
- Status/action semantics and authorization rules.
- Existing shared lookup and UI components.

Use local API contracts first. Use live API calls only when authenticated access is available and live verification is requested.

## Required folder and route pattern

Create only the files the feature needs, using this structure:

```text
src/app/features/<feature>/
├── <feature>.routes.ts
├── layout/
│   ├── layout.component.ts
│   └── layout.component.html
├── models/
│   └── <feature>.model.ts
├── pages/
│   ├── index/
│   │   ├── index.component.ts
│   │   └── index.component.html
│   └── create/
│       ├── create.component.ts
│       └── create.component.html
└── services/
    └── <feature>.service.ts
```

Match Users routing when applicable:

- Export a lazy-loadable Routes array.
- Use an empty-path layout route.
- Redirect the empty path to home.
- Put the list page at the home child route.
- Put create and edit/:id as sibling routes when one page handles both.
- Lazy-load standalone components with loadComponent.
- Register the feature under the authenticated shell in src/app/app.routes.ts.
- Use the feature root for cancel/back navigation.

Do not introduce a parallel store, facade, repository, or feature state library unless the repository already uses it for Users.

## Layout component

Match UsersLayoutComponent:

- Standalone component.
- Import RouterOutlet and TranslateModule directly.
- Use the same header layout: icon, translated title, translated subtitle, and primary action.
- Navigate with Router using the feature route.
- Add a main-shell navigation item only when requested.
- Use existing role rules; a hidden navigation item is not authorization.

## Models and API service

Use the backend's entity, search/filter, request, and response models directly, preserving their names, field casing, types, and nullability. Do not introduce frontend mapping layers or separate DTOs. Users forms contain only fields accepted by the relevant endpoint and submit those values directly.

Import BaseEntity, ApiResponse, and Pagination directly from `@app/core/models/api-response.model` when their shapes fit the contract. Import other symbols from their owning files; do not use barrel imports.

Match UserService:

- Use Injectable with root scope.
- Inject BASE_API from `@app/core/tokens/api.tokens`.
- Keep endpoint paths in the feature service.
- Return Observable<ApiResponse<T>> with the actual response type.
- Use HttpParams for list requests.
- Preserve valid false and 0 values; omit only values the contract treats as absent.
- Use the exact API endpoint and parameter casing.
- Keep form fields aligned with the backend request model and submit accepted fields directly, without renaming or mapping them.
- Add status/reset/archive/restore methods only when supported.
- Avoid any when the response type is known; isolate unavoidable untyped API behavior in the service.

A feature may have get, getById, post, put, delete, and custom action methods, but never assume every operation exists.

## Index/list implementation

Match UsersIndexComponent and IndexPageBaseUtils:

- Use a standalone component with direct imports.
- Use OnPush when consistent with Users.
- Extend IndexPageBaseUtils.
- Inject dependencies as private fields using the repository's naming style.
- Inject DestroyRef and use takeUntilDestroyed for subscriptions.
- Override typed page, pageRoute, searchViewModel, and items signals.
- Set pageRoute to the actual list URL, including /home when applicable.
- Define columns, then create the search form, then subscribe to query parameters.
- Restore URL filters through the base helper before the initial search.
- Load feature-specific lookup data in the feature, not in shared lookups unless genuinely reusable.
- In search(), set searching/loading state, clear stale items, build criteria, call the service, configure pagination, update items, and clear state in both success and error paths.
- Use the base sorting, pagination, page-size, and URL-sync helpers.
- Keep only applicable state: loading, searching, saving, deleting, pagination, sorting, selected item, and modal state.
- Use ModalService and ModalRef for destructive confirmations and short secondary workflows.
- Move to the previous page before refreshing when deleting the last item on a non-first page.
- Update local state only after the API confirms success.
- Implement applicable loading, empty, error/retry, saving, and disabled states.

## Create/edit implementation

Match UserCreateComponent and CreatePageState:

- Use one component for create and edit when the workflow is shared.
- Use CreatePageState for form, isEdit, isPageLoaded, and isSaving.
- Keep a typed model signal and fetchFailed signal where edit loading can fail.
- Read the id route parameter before setting up the form.
- In edit mode, load the entity, merge it into the model, then build the form.
- In create mode, build the form directly.
- Use reactive forms and noWhitespaceValidator where blank-only values are invalid.
- Match API optionality and nullability exactly.
- Keep create-only and edit-only fields explicit.
- Mark invalid controls touched before returning from save.
- Prevent duplicate submissions with isSaving.
- Submit the backend model directly; include only fields accepted by that operation and do not create separate frontend DTOs or mapping layers.
- Show API results through ToastService.
- Navigate only after successful save.
- Preserve values and show a recoverable error after failed requests.
- Keep translated create/edit headings and cancel/back behavior consistent with Users.
- Prefer InputComponent, DropdownComponent, SpinnerComponent, EmptyStateComponent, BadgeComponent, ToggleComponent, PaginationComponent, and existing shared controls.

## Templates, translations, and styling

Follow `AGENTS.md` and the Users visual and accessibility patterns:

- Use ds-table-card, ds-table, ds-th, ds-td, btn classes, shared tokens, and existing utility styles.
- Use native table markup with shared classes from `src/styles/utilities/tables.css`; do not create a shared table component.
- Do not create a feature stylesheet when shared styles are sufficient.
- Put genuinely reusable styles in src/styles/components/.
- Put wide tables inside overflow-x-auto.
- Give icon-only buttons translated aria-label and title values.
- Use alt="" aria-hidden="true" for decorative icons.
- Keep actions keyboard-operable and focus-visible.
- Review desktop/mobile, LTR/RTL, mixed-direction IDs/emails/phones, loading, disabled, empty, error, and success states.
- Add matching keys to public/assets/i18n/en.json and public/assets/i18n/ar.json.
- Use a feature namespace such as FEATURE.FIELDS, FEATURE.FORM, FEATURE.ERRORS, FEATURE.EMPTY, and FEATURE.FILTERS.
- Never hard-code user-facing feature copy in templates.
- Reuse existing icons. For a new sidebar item, add matching `sidebar-<name>.svg` and `sidebar-<name>-active.svg` files and follow `AGENTS.md`.

## Required implementation order

1. Read Users and inspect the API contract.
2. Define models and service methods.
3. Add routes and layout.
4. Implement list state, columns, filters, URL restoration, and search.
5. Implement create/edit loading, validation, backend-aligned form models, and save.
6. Add translations, lookups, icons, and navigation only when needed.
7. Review responsive and RTL behavior.
8. Run available formatting/static checks, translation JSON parsing, build, and residual-reference searches. Do not generate spec files or test scaffolding.

Do not build the template first and invent the service afterward. Do not add a UI control until its backing operation is confirmed.

## Required reference comparison

Before reporting completion, compare the new feature against the reference guide section by section:

1. Folder and route shape.
2. Layout header and navigation action.
3. Model and service contract.
4. List signals, lifecycle order, URL filters, and pagination.
5. Create/edit route loading, form setup, validation, backend model compatibility, and save.
6. Template state branches, shared controls, translations, and icon accessibility.
7. Error, loading, disabled, responsive, and RTL behavior.

If a difference is intentional, record the reason in the final report. Do not silently introduce a different pattern.

## Completion gate

Before reporting completion, verify:

- Routes match the requested URL shape.
- Every field, filter, payload, mutation, and status action matches the API contract.
- No User, USERS.*, role, endpoint, or permission details were copied accidentally.
- Folder names, standalone imports, signals, service flow, and shared components match Users.
- English and Arabic translation keys are equivalent.
- Every referenced asset exists.
- Errors reset relevant loading/saving state and provide recovery.
- Both create and edit paths are handled.
- Navigation is registered only when requested.
- The final report lists changed files, actual checks run, and unresolved blockers.
