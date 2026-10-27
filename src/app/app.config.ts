import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient, withXhr } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideHighcharts } from 'highcharts-angular';

import { routes } from './app.routes';
import { AuthInterceptor } from '@app/core/interceptors/auth.interceptor';
import { LanguageInterceptor } from '@app/core/interceptors/language.interceptor';
import { ErrorInterceptor } from '@app/core/interceptors/error.interceptor';
import { AUTH_STORAGE_KEYS, createAuthStorageKeys } from '@app/core/tokens/auth-storage.tokens';
import { BaseApiService } from '@app/core/services/base-api.service';
import { BASE_API } from '@app/core/tokens/api.tokens';
import { HttpLoaderFactory } from '@app/core/models/translate-config.model';
import { environment } from 'src/environments/environment';

/**
 * Application configuration
 * Configures Angular providers including routing, HTTP client, and translation service
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Override with createAuthStorageKeys('yourapp') if you need a custom namespace
    { provide: AUTH_STORAGE_KEYS, useValue: createAuthStorageKeys('app') },

    // Global error listeners
    provideBrowserGlobalErrorListeners(),

    // Zoneless change detection (Angular 20)
    provideZonelessChangeDetection(),

    // Highcharts
    provideHighcharts(),

    // Router configuration
    provideRouter(routes),

    // HTTP client for API calls with interceptors
    provideHttpClient(withXhr(), withInterceptors([LanguageInterceptor, AuthInterceptor, ErrorInterceptor])),
    BaseApiService.forApi(BASE_API, environment.apiUrl),

    // Translation service with HTTP loader
    // Loads translation files from /assets/i18n/*.json
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      defaultLanguage: 'en',
    }).providers!,
  ],
};
