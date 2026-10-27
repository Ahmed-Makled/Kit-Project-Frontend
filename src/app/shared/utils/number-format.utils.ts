/**
 * Centralized number formatting utilities for consistent display across the application
 * Standards:
 * - Currency (EGP): 2 decimals, with thousand separators (e.g., 18,495.75)
 * - Price/Rate: 2 decimals (e.g., 12.50)
 * - Percentage: 1 decimal (e.g., 85.5%)
 * - All use en-US locale for English numerals
 * - Negative numbers: -100 (with minus sign)
 */

/**
 * Format currency values (EGP) with 2 decimal places and thousand separators
 * @param value - The number to format
 * @returns Formatted string (e.g., "18,495.75")
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format price/rate values with 2 decimal places and thousand separators
 * @param value - The number to format
 * @returns Formatted string (e.g., "12.50")
 */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format percentage values with 1 decimal place
 * @param value - The number to format (as decimal, e.g., 0.855 for 85.5%)
 * @param includeSymbol - Whether to include % symbol (default: true)
 * @returns Formatted string (e.g., "85.5%" or "85.5")
 */
export function formatPercentage(value: number | null | undefined, includeSymbol: boolean = true): string {
  if (value === null || value === undefined || isNaN(value)) {
    return includeSymbol ? '0.0%' : '0.0';
  }
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return includeSymbol ? `${formatted}%` : formatted;
}

/**
 * Format any number with specified decimal places and thousand separators
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string
 */
export function formatNumber(value: number | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
