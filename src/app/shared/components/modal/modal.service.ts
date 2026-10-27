import { ApplicationRef, ComponentRef, inject, Injectable, Injector, TemplateRef, Type, createComponent, EnvironmentInjector, DestroyRef } from '@angular/core';
import { ModalContainerComponent } from './modal-container.component';
import { ModalConfig, MODAL_DATA } from './modal-config.model';
import { ModalRef } from './modal-ref';
import { BehaviorSubject } from 'rxjs';

export interface SuccessModalData {
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(Injector);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly destroyRef = inject(DestroyRef);

  // Track scroll lock state across multiple modals
  private openModalsCount = 0;
  private previousBodyOverflow: string | null = null;
  private previousHtmlOverflow: string | null = null;
  private successTrigger = new BehaviorSubject<SuccessModalData | null>(null);
  success$ = this.successTrigger.asObservable();

  triggerSuccess(data: SuccessModalData) {
    this.successTrigger.next(data);
  }

  open<T = any>(content: Type<any> | TemplateRef<any> | string, config: ModalConfig = {}): ModalRef<T> {
    const modalRef = new ModalRef<T>();

    const elementInjector = Injector.create({
      providers: [
        { provide: ModalRef, useValue: modalRef },
        { provide: MODAL_DATA, useValue: config.data ?? null },
      ],
      parent: this.injector,
    });

    const containerRef = createComponent(ModalContainerComponent, {
      environmentInjector: this.envInjector,
      elementInjector,
    });

    // Use signal inputs for Angular 20
    containerRef.setInput('content', content);
    containerRef.setInput('config', config);
    containerRef.setInput('modalRef', modalRef);

    modalRef.setCloseFn(() => this.close(containerRef));
    const previousFocus = document.activeElement;

    this.appRef.attachView(containerRef.hostView);
    document.body.appendChild(containerRef.location.nativeElement);

    if (this.openModalsCount === 0) {
      this.previousBodyOverflow = document.body.style.overflow || '';
      this.previousHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    this.openModalsCount += 1;

    // Auto cleanup when service is destroyed
    const unregisterDestroy = this.destroyRef.onDestroy(() => {
      if (modalRef.isOpen()) {
        modalRef.close();
      }
    });
    containerRef.onDestroy(() => {
      unregisterDestroy();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    });

    return modalRef;
  }

  private close(containerRef: ComponentRef<ModalContainerComponent>): void {
    try {
      this.appRef.detachView(containerRef.hostView);
      const element = containerRef.location.nativeElement;
      element.remove();
    } catch (e) {
      console.warn('Error during modal cleanup', e);
    } finally {
      containerRef.destroy();
      this.openModalsCount = Math.max(0, this.openModalsCount - 1);
      if (this.openModalsCount === 0) {
        if (this.previousBodyOverflow !== null) {
          document.body.style.overflow = this.previousBodyOverflow;
        } else {
          document.body.style.overflow = '';
        }
        document.documentElement.style.overflow = this.previousHtmlOverflow ?? '';
        this.previousBodyOverflow = null;
        this.previousHtmlOverflow = null;
      }
    }
  }
}
