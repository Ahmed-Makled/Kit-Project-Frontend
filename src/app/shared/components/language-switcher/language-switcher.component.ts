import { Component, ElementRef, DestroyRef, inject, input, signal, ChangeDetectionStrategy, booleanAttribute } from '@angular/core';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { AppLang, LanguageService, SUPPORTED_LANGS } from '@app/core/services/language.service';

/**
 * Language switcher for the sidebar footer.
 * In compact mode (collapsed sidebar) only the globe trigger renders and the
 * dropdown opens to the inline side of the trigger.
 */
@Component({
  selector: 'app-language-switcher',
  imports: [TranslateModule],
  templateUrl: './language-switcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  private readonly languageService = inject(LanguageService);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly compact = input(false, { transform: booleanAttribute });
  readonly langs = SUPPORTED_LANGS;
  readonly currentLang = this.languageService.currentLang;
  readonly isOpen = signal(false);

  constructor() {
    fromEvent<PointerEvent>(document, 'pointerdown', { capture: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (!this.elementRef.nativeElement.contains(event.target) && this.isOpen()) {
          this.isOpen.set(false);
        }
      });

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.key === 'Escape' && this.isOpen()) {
          this.isOpen.set(false);
        }
      });
  }

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  select(lang: AppLang): void {
    this.languageService.switchLanguage(lang);
    this.isOpen.set(false);
  }
}
