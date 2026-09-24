/**
 * Converts a duration in minutes into HH:MM format.
 *
 * @param minutes Duration in minutes.
 * @returns Duration formatted as HH:MM.
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return (
    String(hours).padStart(2, '0') +
    ':' +
    String(remainingMinutes).padStart(2, '0')
  );
}
