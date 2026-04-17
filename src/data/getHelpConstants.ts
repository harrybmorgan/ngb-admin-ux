/** Copy and option lists for Get help / employer support prototype flows. */

export const EMPLOYER_REQUEST_TYPES = [
  'Change employee information',
  'Terminate employee',
  'Change LOA',
  'Add new employee',
  'Add new enrollment',
  'Add user to Employer portal',
  'Add Employer contact',
  'Change payroll deductions',
  'Suggest enhancements',
  'Process a contribution file',
  'Other',
] as const

export type EmployerRequestType = (typeof EMPLOYER_REQUEST_TYPES)[number]

export const SECURE_MESSAGE_REASONS = [
  'Active Benefits — Eligibility / enrollment',
  'Billing or payroll remittance',
  'COBRA or continuation coverage',
  'HSA / FSA / commuter accounts',
  'Plan design or carrier change',
  'Technical issue or login',
  'Other',
] as const

export type SecureMessageReason = (typeof SECURE_MESSAGE_REASONS)[number]

export const SUPPORT_CONTACT = {
  contactName: 'WEX Employer Services',
  phone: '(402) 718-8777',
  tollFree: '(866) 451-3399',
  email: 'employer.services@wexinc.com',
  hours: '7:30 a.m. – 6:00 p.m. Central Time, Monday–Friday',
} as const

/** Max attachment size described in employer request UX (not enforced server-side in prototype). */
export const REQUEST_ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024
