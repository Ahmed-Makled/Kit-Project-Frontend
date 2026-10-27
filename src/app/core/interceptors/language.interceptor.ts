import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DEFAULT_LANGUAGE } from '@ngx-translate/core';
import { isAppLang, LANG_STORAGE_KEY } from '../services/language.service';

export const LanguageInterceptor: HttpInterceptorFn = (req, next) => {
  const configured = inject(DEFAULT_LANGUAGE);
  let lang = isAppLang(configured) ? configured : 'en';
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (isAppLang(stored)) {
      lang = stored;
    }
  }

  const reqWithLang = req.clone({
    setHeaders: {
      lang: lang,
    },
  });

  return next(reqWithLang);
};
