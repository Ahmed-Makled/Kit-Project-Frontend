export function localDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  return localDateIso(new Date());
}

export function firstDayOfMonthIso(date = new Date()): string {
  return localDateIso(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function lastDayOfMonthIso(date = new Date()): string {
  return localDateIso(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}
