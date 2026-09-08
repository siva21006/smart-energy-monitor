export function parseFlexibleDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  
  // Handle DD-MM-YYYY or DD/MM/YYYY
  const ddmmMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmMatch) {
    const [, day, month, year] = ddmmMatch;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
  }
  
  // Handle YYYY-MM-DD
  const yyyymmMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yyyymmMatch) {
    const [, year, month, day] = yyyymmMatch;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
  }

  // Fallback to standard JS parsing
  return new Date(dateStr);
}

export function formatBillingPeriod(
  billingDateStr: string,
  billingCycle: string,
  billingPeriodStart?: string,
  billingPeriodEnd?: string
): string {
  // If we have both start and end, format them
  if (billingPeriodStart && billingPeriodEnd) {
    const start = parseFlexibleDate(billingPeriodStart);
    const end = parseFlexibleDate(billingPeriodEnd);
    
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const startMonth = start.toLocaleDateString('en-GB', { month: 'short' });
      const endMonth = end.toLocaleDateString('en-GB', { month: 'short' });
      const year = end.toLocaleDateString('en-GB', { year: 'numeric' });
      
      // e.g. Jul-Aug 2026
      if (startMonth !== endMonth) {
        return `${startMonth}–${endMonth} ${year}`;
      }
      return `${startMonth} ${year}`;
    }
  }

  // Fallback: Calculate based on billing date and cycle
  const d = parseFlexibleDate(billingDateStr);
  if (isNaN(d.getTime())) return billingDateStr;

  const currentMonth = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.toLocaleDateString('en-GB', { year: 'numeric' });

  if (billingCycle === 'Bi-Monthly') {
    // Subtract 1 month for the start of the bi-monthly period
    const prevDate = new Date(d);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.toLocaleDateString('en-GB', { month: 'short' });
    return `${prevMonth}–${currentMonth} ${year}`;
  }

  // Monthly fallback
  return `${currentMonth} ${year}`;
}

export function formatDate(dateString: string): string {
  const d = parseFlexibleDate(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }); // Output: 10 Aug 2026
}
