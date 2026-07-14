/**
 * Period Utilities for Budget
 *
 * Helper functions for working with budget periods (monthly, weekly, etc.)
 */

/**
 * Format a date to YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the current month period (first day to last day of current month).
 */
export function getCurrentMonthPeriod(): { periodStart: string; periodEnd: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    periodStart: formatDate(start),
    periodEnd: formatDate(end),
  };
}

/**
 * Get the current week period (Monday to Sunday).
 */
export function getCurrentWeekPeriod(): { periodStart: string; periodEnd: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  // Adjust to Monday (dayOfWeek: 0 = Sunday, 1 = Monday, etc.)
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - daysToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    periodStart: formatDate(start),
    periodEnd: formatDate(end),
  };
}

/**
 * Get period based on period type.
 */
export function getPeriodByType(
  periodType: 'weekly' | 'biweekly' | 'monthly' | 'yearly'
): { periodStart: string; periodEnd: string } {
  switch (periodType) {
    case 'weekly':
      return getCurrentWeekPeriod();
    case 'biweekly':
      // For biweekly, return 2-week period starting from Monday
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const start = new Date(now);
      start.setDate(now.getDate() - daysToMonday);

      const end = new Date(start);
      end.setDate(start.getDate() + 13); // 2 weeks = 14 days, but we use inclusive end

      return {
        periodStart: formatDate(start),
        periodEnd: formatDate(end),
      };
    case 'monthly':
      return getCurrentMonthPeriod();
    case 'yearly':
      const year = new Date().getFullYear();
      return {
        periodStart: `${year}-01-01`,
        periodEnd: `${year}-12-31`,
      };
    default:
      return getCurrentMonthPeriod();
  }
}

/**
 * Format period for display.
 */
export function formatPeriodDisplay(
  periodStart: string,
  periodEnd: string,
  periodType: string
): string {
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);

  const formatShortDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  };

  switch (periodType) {
    case 'weekly':
      return `Tuần ${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
    case 'biweekly':
      return `2 tuần ${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
    case 'monthly':
      const monthNames = [
        'Tháng 1',
        'Tháng 2',
        'Tháng 3',
        'Tháng 4',
        'Tháng 5',
        'Tháng 6',
        'Tháng 7',
        'Tháng 8',
        'Tháng 9',
        'Tháng 10',
        'Tháng 11',
        'Tháng 12',
      ];
      return `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
    case 'yearly':
      return `Năm ${startDate.getFullYear()}`;
    default:
      return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
  }
}
