import { signal, Signal } from '@angular/core';

export class ModalRef<T = any> {
  private _closeFn?: () => void;
  private _isOpen = signal(true);
  private _result: T | undefined;

  readonly isOpen: Signal<boolean> = this._isOpen.asReadonly();

  getResult(): T | undefined {
    return this._result;
  }

  setCloseFn(fn: () => void): void {
    this._closeFn = fn;
  }

  close(result?: T): void {
    if (this._closeFn && this._isOpen()) {
      this._result = result;
      this._isOpen.set(false);
      this._closeFn();
    }
  }
}
