import { Pipe, PipeTransform } from '@angular/core';

/**
 * Extracts a single initial letter from a display name.
 * Usage: {{ 'John Doe' | userInitial }}
 * Output: J
 */
@Pipe({
  name: 'userInitial',
})
export class UserInitialPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    const initial = value?.trim().charAt(0).toUpperCase();
    return initial || 'U';
  }
}
