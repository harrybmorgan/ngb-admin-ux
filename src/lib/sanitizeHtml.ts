import DOMPurify from 'dompurify'

/**
 * Sanitize HTML for the content-zone preview (email-style body).
 * Does not replace server-side validation; defense in depth for interpreted HTML.
 */
export function sanitizeEmailBodyHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
  })
}
