/**
 * Utility helpers for date calculations.
 * - workingDaysBetween: counts Mon-Fri between two dates inclusive.
 * - yearOf: returns the year number for a date string.
 */
import dayjs from 'dayjs';

export function workingDaysBetween(start, end) {
  const s = dayjs(start);
  const e = dayjs(end);
  if (e.isBefore(s)) throw new Error('endDate cannot be before startDate');
  let days = 0;
  for (let d = s; !d.isAfter(e); d = d.add(1, 'day')) {
    const dow = d.day(); // 0=Sun ... 6=Sat
    if (dow !== 0 && dow !== 6) days += 1;
  }
  return days;
}

export function yearOf(dateStr) {
  return dayjs(dateStr).year();
}
