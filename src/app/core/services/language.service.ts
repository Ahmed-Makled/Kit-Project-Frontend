import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export const LANG_STORAGE_KEY = 'app_lang';
export const SUPPORTED_LANGS = ['ar', 'en'] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];

export function isAppLang(lang: string | null | undefined): lang is AppLang {
  return lang === 'ar' || lang === 'en';
}

/**
 * Centralizes language state, persistence, and document direction.
 * The default language is TranslateModule.forRoot({ defaultLanguage }) in app config.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private initialized = false;

  readonly currentLang = signal<AppLang>(this.defaultLang());
  readonly isRtl = computed(() => this.currentLang() === 'ar');
  readonly dirAttr = computed(() => (this.isRtl() ? 'rtl' : 'ltr'));

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.translate.addLangs([...SUPPORTED_LANGS]);

    const initial = this.storedLang();
    this.currentLang.set(initial);
    this.translate.use(initial);
    this.applyDirection(initial);

    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      const lang = this.normalize(event.lang);
      this.currentLang.set(lang);
      this.persist(lang);
      this.applyDirection(lang);
    });
  }

  switchLanguage(lang: AppLang): void {
    if (!SUPPORTED_LANGS.includes(lang) || lang === this.currentLang()) return;
    this.translate.use(lang);
  }

  private defaultLang(): AppLang {
    return this.normalize(this.translate.getDefaultLang());
  }

  private storedLang(): AppLang {
    if (typeof window === 'undefined') return this.defaultLang();
    return this.normalize(window.localStorage.getItem(LANG_STORAGE_KEY));
  }

  private normalize(lang: string | null | undefined): AppLang {
    if (isAppLang(lang)) return lang;
    const configured = this.translate.getDefaultLang();
    return isAppLang(configured) ? configured : 'en';
  }

  private persist(lang: AppLang): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  }

  private applyDirection(lang: AppLang): void {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
