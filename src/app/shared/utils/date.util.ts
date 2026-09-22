/**
 * Converts a Date object into the date representation expected by
 * the application's API and date input controls.
 *
 * @param date Date whose calendar values should be converted.
 * @returns Date string in YYYY-MM-DD format.
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
 * Provides the current local calendar date in the format used
 * throughout the application's date-based forms and requests.
 *
 * @returns Current date as a YYYY-MM-DD string.
 */
export function getToday(): string {

  return formatDate(
    new Date()
  );
}


/**
 * Creates a local Date instance from an ISO-style calendar date.
 * Constructing the date from individual components avoids the timezone
 * interpretation that can occur when passing YYYY-MM-DD directly to Date.
 *
 * @param value Calendar date in YYYY-MM-DD format.
 * @returns Date instance representing the supplied local calendar date.
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
