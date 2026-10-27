# Repository Guidelines

## Mandatory Priority Rules

- These rules apply to every AI agent and developer. Read this file first; they have highest priority.
- Before implementation, inspect these directories in this order:
  1. `src/styles/` for tokens, foundations, utilities, and component styles.
  2. `src/app/shared/` for reusable components, layout, utilities, models, and validators.
  3. `src/app/core/` for auth, API, services, guards, interceptors, and tokens.
- For every new CRUD feature, first read and follow `skills/create-angular-crud-feature/SKILL.md`; this skill is mandatory for AI agents and developers. Use `src/app/features/users/` as the implementation reference.
- Read `README.md` for architecture, routes, API, and setup context before implementation.
- Never create `*.spec.ts` files, test files, or test scaffolding.
- Do not reintroduce appointments or unrelated features unless explicitly requested.
- Prefer Tailwind utilities and existing `src/styles/tokens/`, `src/styles/components/`, and `src/styles/utilities/` rules. Add component CSS/SCSS only when existing styles cannot express a real requirement.
- Do not create a shared table component. Use native `<table>` markup with `.ds-table`, `.ds-th`, `.ds-td`, `.ds-tr`, and `.overflow-x-auto` classes; follow the Users index page.
- Keep HTML and TypeScript small, typed, accessible, and consistent. Avoid duplication, `any`, magic strings, dead code, and debug logging.

## Project Structure

- Source: `src/app/core/` infrastructure, `src/app/features/` features, `src/app/shared/` reusable code, and `src/styles/` global styling.
- Assets/translations: `public/images/` and `public/assets/i18n/`.
- Import directly from owning files; do not recreate barrel `index.ts` files or use removed paths such as `@app/core` or `@app/shared`.

## Folder Responsibilities and Reuse

| Folder                       | Existing capabilities and required usage                                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/tokens/`         | Tailwind v4 `@theme` colors, fonts, radii, shadows, and semantic palettes. Reuse tokens before introducing values.                                                                           |
| `src/styles/foundations/`    | Global page, typography, direction, and reduced-motion rules. Keep feature styling out.                                                                                                      |
| `src/styles/components/`     | Shared button, card, badge, input, dropdown, checkbox, radio, toggle, textarea, shell, sidebar, and CDK styles. Extend the matching file when needed.                                        |
| `src/styles/utilities/`      | Native table classes, overflow, and animation helpers. Use ticket/status utilities only for matching business meanings.                                                                      |
| `src/app/shared/components/` | Input, textarea, dropdown, checkbox, radio, toggle, badge, pagination, spinner, empty state, toast, language switcher, and modal implementations. Inspect their inputs/outputs before reuse. |
| `src/app/shared/layout/`     | Main shell, responsive navigation, sidebar, and session presentation. Reuse this shell for authenticated features.                                                                           |
| `src/app/shared/directives/` | Reusable DOM interaction, including click-outside handling. Avoid duplicate document listeners.                                                                                              |
| `src/app/shared/enums/`      | Shared enums such as `Roles`; reuse existing values rather than hard-coding role numbers.                                                                                                    |
| `src/app/shared/models/`     | `CreatePageState` and `IndexPageState` for consistent form/list state. Keep backend-aligned feature models in their feature.                                                                 |
| `src/app/shared/pipes/`      | Currency, price, percentage, and user-initial presentation. Reuse matching formatting instead of duplicating it in templates.                                                                |
| `src/app/shared/services/`   | Reusable lookups. Keep feature-specific lookups and API operations in feature services.                                                                                                      |
| `src/app/shared/types/`      | `Column` and `LookupItem` contracts for tables and dropdowns. Preserve compatible types.                                                                                                     |
| `src/app/shared/utils/`      | List sorting/pagination/filter helpers, form helpers, date helpers, and number formatting. Inspect these before writing equivalent logic.                                                    |
| `src/app/shared/validators/` | Shared validation, including `noWhitespaceValidator`; reuse only where the field contract requires it.                                                                                       |
| `src/app/core/guards/`       | Session-aware route protection. Keep authorization rules consistent with backend enforcement.                                                                                                |
| `src/app/core/interceptors/` | Central auth, language, and HTTP error handling. Avoid reproducing interceptor behavior in features.                                                                                         |
| `src/app/core/models/`       | `BaseEntity`, `ApiResponse`, `Pagination`, and translation-loader configuration. Import contracts directly from owning files.                                                                |
| `src/app/core/services/`     | Auth/session, base HTTP API, cookies, language/direction, date, toast, and URL-filter synchronization. Reuse existing infrastructure.                                                        |
| `src/app/core/tokens/`       | `BASE_API` injection and namespaced auth-storage configuration. Use these instead of hard-coded API hosts or storage keys.                                                                   |

- Global styles enter through `src/styles.css` and `src/styles/index.css`; retain the existing CSS import chain and layer order.
- Keep reusable presentation in `shared`, application infrastructure in `core`, and business-specific behavior in `features`. Review existing consumers before changing shared/core contracts.
- Some starter primitives are intentionally unreferenced by current routes. Inspect them before creating replacements; lack of a current consumer alone does not justify deletion. CSS inclusion does not prove every selector is used.

## Package Manager and Commands

- Use the declared npm version and `npm ci` for reproducible installs; update `package-lock.json` when dependencies change. Development commands: `npm start`, `npm run build`, and `npm run watch`.
- Run `npm run format:check` before handoff; `npm run format` applies the shared baseline. For scoped changes use `npm exec -- prettier --check path/to/file` or `--write`. Use the pinned local formatter and shared VS Code settings.
- Angular generators default to standalone components, `OnPush`, no stylesheet, and no spec files; preserve these project defaults.

## Key Conventions

- Follow `.editorconfig`/`.prettierrc`: two spaces, final newlines, trimmed trailing whitespace, single-quoted TypeScript, 160-character TypeScript/Angular HTML lines, and 120-character CSS/SCSS lines (100 for other formats). Angular HTML keeps attributes compact and does not force one attribute per line. Prefer simple `if` blocks over nested conditional spreads when constructing forms.
- Use standalone components, strict types, existing signal patterns, and `OnPush` for new components when practical.
- Bind component subscriptions to their lifecycle with `takeUntilDestroyed`; clean up manually registered listeners and timers.
- Use kebab-case files/folders, PascalCase classes/components, and Angular suffixes such as `.component.ts`.
- Translate user-facing text in both locales; preserve LTR/RTL, accessibility, responsiveness, API contracts, and environment configuration.
- Inspect API services, models, routes, and environment files before changing endpoints or payloads; never guess contracts.
- Use backend models directly, preserving names, field casing, types, and nullability. Do not introduce frontend mapping layers or separate DTOs; submit only fields accepted by the backend endpoint.
- Reuse shared UI, tokens, icons, and forms; keep business logic in TypeScript and templates presentational.
- Preserve shared component inputs, outputs, and form contracts. Keep disabled state reactive, block disabled/read-only mutations in handlers, and preserve parent-controlled confirmation flows.
- Use native buttons for actions with explicit `type`, translated accessible names, and visible keyboard focus. Never nest interactive controls; associate field labels and validation messages with unique IDs.
- Keep feature templates free of inline SVG icons. Add reusable SVG assets under `public/images/icons/`, reference them with `/images/icons/...`, and use `alt="" aria-hidden="true"` for decorative images.
- Dialogs must trap and restore focus, handle Escape for the topmost dialog, dispose overlays/timers, and restore the previous scroll state.
- Scope shared CSS to its component or design-system classes; do not globally redefine Tailwind utilities. Use logical positioning for RTL and respect reduced-motion preferences.
- Design loading, empty, validation-error, API-error, disabled, submitting, success, and destructive-confirmation states together.
- Preserve form values after recoverable failures, prevent duplicate submissions, and clear pending state on success and failure.
- Use `/images/app-logo.svg` for the application logo and translation keys for brand copy. Reuse existing SVGs; sidebar additions need matching inactive and active icon files. Search references before changing or deleting assets.

## Safe Changes and Verification

- Before deleting or moving code/assets, search literal references, dynamic path construction, icon maps, CSS URLs, and naming conventions with `rg`; remove only confirmed-unused files.
- Keep changes scoped and preserve unrelated work and existing behavior.
- Before adding a dependency, check existing Angular, Tailwind, and shared capabilities; document why it is needed and its maintenance impact.
- Run Prettier and `npm run build` when dependencies are installed; report environment blockers separately.
- For shared-component changes, review existing consumers, form enable/disable behavior, read-only guards, empty pagination, overlay teardown, and parent-controlled actions. Keep English/Arabic translation key sets equivalent.
- For UI changes, verify desktop/mobile in both English/LTR and Arabic/RTL, including keyboard focus and horizontal overflow; report checks that could not run.
- Report only checks actually performed. Build success proves build verification; browser behavior and API integration require their own evidence.

## Commits and Pull Requests

- Follow Git history conventions when available; otherwise use short imperative subjects such as `Add users filter state`. Keep commits focused.
- Pull requests must describe behavior changes, verification commands, relevant screenshots, and API, translation, RTL, mobile, or configuration impacts.
- AI-generated commits must include a `Co-Authored-By:` trailer with the agent identity.

## Security and Configuration

- Do not commit secrets. Configure API URLs through environment files; hidden navigation is not authorization. Do not log credentials or sensitive payloads.
