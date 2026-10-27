# Kit Project

An Angular starter kit for clinic and business applications. The current app provides login, user management, a responsive application shell, shared UI components, and English and Arabic localization.

## Included features

- Login and authenticated routes.
- User directory with search, role and status filters, pagination, create and edit forms, account activation, password reset, and deletion.
- Two roles: **Admin** (`1`) and **User** (`2`). The Users navigation item is shown to Admins.
- English (LTR) and Arabic (RTL) translations.
- Shared layout, form controls, dropdowns, badges, dialogs, pagination, loading states, and notifications.
- Central design tokens and reusable UI guidance for future features.

Read [AGENTS.md](AGENTS.md) before building a feature. Reuse the existing SVG icons under `public/images/icons/` when adding or changing UI.

## Getting started

Install dependencies and start the Angular development server:

```bash
npm ci
npm start
```

Open [http://localhost:4200](http://localhost:4200).

The app expects an API for login and user management. Set `apiUrl` in both `src/environments/environment.development.ts` and `src/environments/environment.ts` to the backend base URL. For example:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://api.example.com/api',
};
```

An empty `apiUrl` sends requests to the current origin.

## Routes

| Route             | Access        | Page           |
| ----------------- | ------------- | -------------- |
| `/login`          | Public        | Sign in        |
| `/users`          | Authenticated | User directory |
| `/users/create`   | Authenticated | Create a user  |
| `/users/edit/:id` | Authenticated | Edit a user    |

Unauthenticated visits to the app are redirected to `/login`. The current sidebar shows the Users link to Admin accounts.

## Authentication and API

- Login posts credentials to `Auth/Login`.
- User management calls the `Users` API endpoints through `BaseApiService`.
- `AuthService` stores the token and current user in namespaced `localStorage` entries.
- `AuthInterceptor` attaches the bearer token to requests and clears the session after an unauthorized response. `authGuard` protects the authenticated app shell.
- The API must enforce permissions on its own endpoints; hiding a navigation item in the frontend is only a presentation rule.

The API response and backend-aligned user models are defined in `src/app/core/models/` and `src/app/features/users/models/`. Forms and services use the backend field names directly without separate frontend DTOs or mapping layers.

## Localization

Translations are stored in `public/assets/i18n/en.json` and `public/assets/i18n/ar.json`. Arabic is the initial language. Add user-facing text to both files and use translation keys in templates. The language service updates the page direction for RTL and LTR layouts.

## Design system and assets

- Global tokens: `src/styles/tokens/index.css`.
- Shared styles: `src/styles/foundations/`, `src/styles/components/`, and `src/styles/utilities/`.
- Shared Angular components: `src/app/shared/components/`.
- Contributor and AI implementation guidance: `AGENTS.md`.
- SVG icons: `public/images/icons/`.
- App logo: `public/images/app-logo.svg`; browser and touch icon: `public/fav.png`.

The current interface uses a light slate canvas, white working surfaces, blue primary actions, Inter for English, Alexandria for Arabic, and Bricolage Grotesque for display headings. Retheme shared tokens and replace clinic-specific copy and assets when adapting this starter kit to another business.

## Project structure

```text
src/
├── app/
│   ├── core/                 # Authentication, API, interceptors, and app services
│   ├── features/
│   │   ├── login/            # Sign-in page and API service
│   │   └── users/            # User list, create/edit pages, models, and API service
│   └── shared/               # Layout, components, utilities, and common types
├── environments/             # Development and production API configuration
└── styles/                   # Tokens, foundations, components, and utilities
public/
├── assets/i18n/              # English and Arabic translations
└── images/                   # Logos, illustrations, and icons
```

## Adding a feature

1. Create `src/app/features/<feature>/` and organize its routes, pages, models, and API service there.
2. Add a `<feature>.routes.ts` file and lazy-load it from `src/app/app.routes.ts`.
3. Reuse the shared shell, components, and design tokens. Add any user-facing text to both translation files.
4. Follow `AGENTS.md` for responsive, RTL, accessibility, styling, and interaction-state rules.

## Commands

| Command                | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `npm start`            | Run the development server                          |
| `npm run build`        | Create the production build in `dist/`              |
| `npm run watch`        | Rebuild on changes with development configuration   |
| `npm run format`       | Apply shared Prettier formatting                    |
| `npm run format:check` | Check repository formatting without modifying files |
| `npm test`             | Run the Angular unit-test target                    |

## Team formatting

Use the npm version declared in `package.json` and run `npm ci` to install the locked dependencies. Prettier is pinned so every contributor uses the same formatter. `.prettierrc`, `.editorconfig`, and `.gitattributes` define two-space indentation, LF line endings, a 160-character print width for TypeScript and Angular templates, a 120-character print width for CSS/SCSS, and a 100-character default for other formats. Angular HTML keeps multiple attributes compact and closes opening tags on the final attribute line. `.prettierignore` excludes generated output, assets, local configuration, and the lockfile.

Install the recommended VS Code extensions to enable workspace formatting on save. Other editors must use the repository's local Prettier and EditorConfig settings. Run `npm run format:check` before submitting changes; format individual files with `npm exec -- prettier --write path/to/file`.

Angular generators are configured to skip spec files and component stylesheets, use standalone components with `OnPush`, and preserve `.component.ts`/`.service.ts` naming. Follow `AGENTS.md` and the mandatory CRUD skill when creating features.

## Technology

- Angular 22 with standalone components and signal-based state.
- TypeScript 6 and RxJS.
- Tailwind CSS 4 through PostCSS, with shared CSS tokens and component styles.
- Angular CDK and `@ngx-translate`.
