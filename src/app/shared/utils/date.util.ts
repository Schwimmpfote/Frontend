/**
 * Formats a Date as YYYY-MM-DD.
 *
 * @param date Date to format.
 * @returns Formatted date string.
 */
export function formatDate(
  date: Date
): string {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
}


/**
 * Returns today's date as YYYY-MM-DD.
 *
 * @returns Today's date.
 */
export function getToday(): string {

  return formatDate(
    new Date()
  );
}


/**
 * Converts a YYYY-MM-DD string to a local Date.
 *
 * @param value Date string to parse.
 * @returns Parsed local Date.
 */
export function parseDate(
  value: string
): Date {

  const [
    year,
    month,
    day
  ] =
    value
      .split('-')
      .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}
