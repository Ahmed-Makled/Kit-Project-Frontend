import { Component, input, TemplateRef, Type, computed, signal, HostListener, ChangeDetectionStrategy, DestroyRef, ElementRef, inject } from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslateModule } from '@ngx-translate/core';
import { ModalConfig } from './modal-config.model';
import { ModalRef } from './modal-ref';

@Component({
  selector: 'app-modal-container',
  standalone: true,
  imports: [NgComponentOutlet, NgTemplateOutlet, A11yModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-backdrop" [class.closing]="isClosing()" (click)="onBackdropClick()">
      <div
        class="modal-content"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="config().ariaLabel || ('SHARED.DIALOG' | translate)"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        cdkFocusInitial
        tabindex="-1"
        [class.closing]="isClosing()"
        [class.modal-overflow-visible]="config().overflowVisible"
        [style.width]="config().width || '28rem'"
        [style.max-height]="config().height || '100svh'"
        [class.modal-center]="!config().position || config().position === 'center'"
        [class.modal-right]="config().position === 'right'"
        (click)="$event.stopPropagation()"
      >
        @if (contentType() === 'string') {
          <div class="p-6 text-gray-800">{{ content() }}</div>
        }

        @if (contentType() === 'template') {
          <ng-container [ngTemplateOutlet]="asTemplate()" [ngTemplateOutletContext]="{ $implicit: config().data }"> </ng-container>
        }

        @if (contentType() === 'component') {
          <ng-container [ngComponentOutlet]="asComponent()"></ng-container>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 999999;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      background-color: var(--color-overlay-modal);
      animation: backdropFadeIn 250ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal-backdrop.closing {
      animation: backdropFadeOut 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal-content {
      background-color: white;
      border-radius: 1rem;
      box-shadow:
        var(--shadow-modal),
        0px 0px 0px 8px #ffffff52;
      position: relative;
      overflow: hidden;
      max-width: calc(100vw - 2rem);
      overflow-y: auto;
      animation: contentFadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-content.modal-overflow-visible {
      overflow: visible;
    }

    .modal-content.closing {
      animation: contentFadeOut 200ms cubic-bezier(0.4, 0, 1, 1);
    }

    .modal-right {
      position: absolute;
      top: 1rem;
      right: 1rem;
      bottom: 1rem;
      box-shadow: var(--shadow-modal);
      animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @media (max-width: 768px) {
      .modal-right {
        position: relative;
        top: auto;
        right: auto;
        bottom: auto;
        inset: 0;
        width: calc(100vw - 2rem) !important;
        height: 90svh !important;
        margin: auto;
        border-radius: 1rem;
        animation: contentFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
      }

      .modal-right.closing {
        animation: contentFadeOut 200ms cubic-bezier(0.4, 0, 1, 1) !important;
      }
    }

    .modal-right.closing {
      animation: slideOutRight 200ms cubic-bezier(0.4, 0, 1, 1);
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    .modal-center {
      display: flex;
      flex-direction: column;
      margin: auto;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes backdropFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes backdropFadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    @keyframes contentFadeIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes contentFadeOut {
      from {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      to {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
      }
    }
  `,
})
export class ModalContainerComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private closeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.closeTimer));
  }
  // Signal inputs
  content = input.required<string | TemplateRef<any> | Type<any>>();
  config = input<ModalConfig>({});
  modalRef = input.required<ModalRef>();

  // Signal for closing animation
  protected isClosing = signal(false);

  // Computed signal to determine content type
  protected contentType = computed(() => {
    const c = this.content();
    if (typeof c === 'string') return 'string';
    if (c instanceof TemplateRef) return 'template';
    return 'component';
  });

  // Type-safe getters with computed signals
  protected asTemplate = computed(() => {
    const c = this.content();
    return c instanceof TemplateRef ? c : null;
  });

  protected asComponent = computed(() => {
    const c = this.content();
    return typeof c === 'function' && !(c instanceof TemplateRef) ? c : null;
  });

  onBackdropClick(): void {
    if (this.config().backdropClose !== false) {
      this.closeWithAnimation();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscKey(event: Event): void {
    const modals = document.querySelectorAll('app-modal-container');
    if (modals.item(modals.length - 1) !== this.host.nativeElement || event.defaultPrevented) return;
    event.preventDefault();
    this.closeWithAnimation();
  }

  private closeWithAnimation(): void {
    if (this.isClosing()) return;
    this.isClosing.set(true);
    // Wait for animation to complete before actually closing
    this.closeTimer = setTimeout(() => {
      this.modalRef().close();
    }, 200);
  }
}
