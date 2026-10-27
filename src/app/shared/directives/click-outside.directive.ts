import { DestroyRef, Directive, ElementRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent } from 'rxjs';

@Directive({
  selector: '[appClickOutside]',
})
export class ClickOutsideDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly disabled = input<boolean>(false);
  readonly clickOutside = output<Event>();

  constructor() {
    fromEvent<Event>(document, 'click', { capture: true })
      .pipe(
        filter(() => !this.disabled()),
        filter((event) => this.isClickOutside(event)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.clickOutside.emit(event);
      });
  }

  private isClickOutside(event: Event): boolean {
    const target = event.target as Node;
    const element = this.elementRef.nativeElement;

    return !element.contains(target);
  }
}
