import { Pipe, PipeTransform } from '@angular/core';
import { formatCurrency } from '../utils/number-format.utils';

/**
 * Currency formatting pipe for consistent display of EGP amounts
 * Usage: {{ value | currencyFormat }}
 * Output: 1,250 (0 decimals, with thousand separators)
 */
@Pipe({
  name: 'currencyFormat',
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatCurrency(value);
  }
}
