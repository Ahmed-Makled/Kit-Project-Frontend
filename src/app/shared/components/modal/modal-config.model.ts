import { InjectionToken } from '@angular/core';

/** Token for data passed into a modal via ModalConfig.data */
export const MODAL_DATA = new InjectionToken<unknown>('MODAL_DATA');

export interface ModalConfig {
  ariaLabel?: string;
  width?: string;
  height?: string;
  backdropClose?: boolean;
  panelClass?: string;
  data?: any;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  /** Allow content to overflow the modal bounds (needed for dropdown/popover menus). */
  overflowVisible?: boolean;
}
