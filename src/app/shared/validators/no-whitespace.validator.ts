import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator that disallows only whitespace input.
 * Returns { whitespace: true } if the input is empty or only whitespace.
 */
export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value || '').toString();
    if (value.length === 0) return null; // Don't trigger if empty (let required handle it)
    const isWhitespace = value.trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  };
}
