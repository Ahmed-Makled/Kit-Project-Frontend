import { Pipe, PipeTransform } from '@angular/core';
import { formatPrice } from '../utils/number-format.utils';
/**
 * Price/Rate formatting pipe for consistent display of prices
 * Usage: {{ value | priceFormat }}
 * Output: 12.50 (2 decimals, with thousand separators)
 */
@Pipe({
  name: 'priceFormat',
})
export class PriceFormatPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatPrice(value);
  }
}
