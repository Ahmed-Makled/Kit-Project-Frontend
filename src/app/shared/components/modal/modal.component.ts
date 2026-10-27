import { Component, output, input, inject, effect, contentChild, TemplateRef, Directive, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TranslateModule } from '@ngx-translate/core';
import { A11yModule } from '@angular/cdk/a11y';

/**
 * Directive to mark content for modal projection
 */
@Directive({
  selector: '[appModalContent]',
  standalone: true,
})
export class ModalContentDirective {}

/**
 * Modal content component that renders in the overlay
 */
@Component({
  selector: 'app-modal-content',
  imports: [CommonModule, TranslateModule, A11yModule],
  template: `
    <div
      class="fixed inset-0 bg-app-ink/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      (click)="onBackdropClick()"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="ariaLabel()"
    >
      <div
        class="bg-white rounded-2xl shadow-dropdown w-full animate-scale-in border border-app-border"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        cdkFocusInitial
        tabindex="-1"
        [class.max-w-sm]="size() === 'sm'"
        [class.max-w-md]="size() === 'md'"
        [class.max-w-lg]="size() === 'lg'"
        [class.max-w-xl]="size() === 'xl'"
        [class.max-w-2xl]="size() === '2xl'"
        (click)="$event.stopPropagation()"
      >
        @if (contentTemplate(); as template) {
          <ng-container *ngTemplateOutlet="template"></ng-container>
        }
      </div>
    </div>
  `,

  styles: [
    `
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes scale-in {
        from {
          transform: scale(0.95);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      .animate-fade-in {
        animation: fade-in 0.2s ease-out;
      }

      .animate-scale-in {
        animation: scale-in 0.2s ease-out;
      }

      :host {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 10000;
      }
    `,
  ],
})
class ModalContentComponent {
  readonly size = input<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');
  readonly ariaLabel = input<string>('');
  readonly closeOnBackdropClick = input<boolean>(true);
  readonly contentTemplate = input<TemplateRef<unknown> | null>(null);

  closeCallback!: () => void;
  backdropClickCallback!: () => void;

  onBackdropClick(): void {
    if (this.closeOnBackdropClick()) {
      this.closeCallback();
    } else {
      this.backdropClickCallback();
    }
  }
}

/**
 * Reusable modal component with content projection
 * Renders content in a CDK overlay for true full-screen coverage
 *
 * Usage:
 * <app-modal [isOpen]="showModal()" (closed)="closeModal()">
 *   <ng-template appModalContent>
 *     <!-- Your modal content here -->
 *   </ng-template>
 * </app-modal>
 */
@Component({
  selector: 'app-modal',
  imports: [CommonModule, OverlayModule],
  template: ``,

  styles: [
    `
      :host {
        display: none;
      }
    `,
  ],
})
export class ModalComponent {
  private readonly overlay = inject(Overlay);
  private overlayRef: OverlayRef | null = null;

  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly size = input<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');
  readonly ariaLabel = input<string>('');
  readonly closeOnBackdropClick = input<boolean>(true);

  // Content projection
  readonly contentTemplate = contentChild.required(ModalContentDirective, { read: TemplateRef });

  // Outputs
  readonly closed = output<void>();
  readonly backdropClicked = output<void>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.closeOverlay());
    effect(() => {
      if (this.isOpen()) {
        this.openOverlay();
      } else {
        this.closeOverlay();
      }
    });
  }

  private openOverlay(): void {
    if (this.overlayRef) {
      this.closeOverlay();
    }

    // Create overlay with global position strategy
    this.overlayRef = this.overlay.create({
      hasBackdrop: false,
      positionStrategy: this.overlay.position().global(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    // Create portal with content component
    const portal = new ComponentPortal(ModalContentComponent);
    const componentRef = this.overlayRef.attach(portal);

    // Pass inputs
    componentRef.setInput('size', this.size());
    componentRef.setInput('ariaLabel', this.ariaLabel());
    componentRef.setInput('closeOnBackdropClick', this.closeOnBackdropClick());
    componentRef.setInput('contentTemplate', this.contentTemplate());

    // Set callbacks
    componentRef.instance.closeCallback = () => {
      this.closed.emit();
    };
    componentRef.instance.backdropClickCallback = () => {
      this.backdropClicked.emit();
    };
  }

  private closeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
