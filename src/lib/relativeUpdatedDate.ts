/**
 * Calendar-day relative label from mock report `updated` YYYY-MM-DD
 * (e.g. "today", "2 days ago", "last week").
 */
export function relativeUpdatedFromIsoDate(isoDate: string, now: Date = new Date()): string {
  const parts = isoDate.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return isoDate
  const [y, m, d] = parts
  const startThen = new Date(y, m - 1, d).setHours(0, 0, 0, 0)
  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).setHours(0, 0, 0, 0)
  const diffDays = Math.round((startNow - startThen) / 86400000)
  if (diffDays < 0) return isoDate

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (diffDays < 7) {
    return rtf.format(-diffDays, 'day')
  }
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 5) {
    return rtf.format(-diffWeeks, 'week')
  }
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) {
    return rtf.format(-diffMonths, 'month')
  }
  const diffYears = Math.floor(diffDays / 365)
  return rtf.format(-diffYears, 'year')
}
