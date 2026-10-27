import { Pipe, PipeTransform } from '@angular/core';
import { formatPercentage } from '../utils/number-format.utils';

/**
 * Percentage formatting pipe for consistent display of percentages
 * Usage: {{ value | percentageFormat }} or {{ value | percentageFormat:false }}
 * Output: 85.5% (1 decimal place)
 */
@Pipe({
  name: 'percentageFormat',
})
export class PercentageFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, includeSymbol: boolean = true): string {
    return formatPercentage(value, includeSymbol);
  }
}
