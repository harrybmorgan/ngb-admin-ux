/** Realistic dummy data for the employer admin prototype (Summit Ridge Bakery Co.) */

export const EMPLOYER = {
  /** Display / marketing name used elsewhere in the admin shell */
  name: 'Summit Ridge Bakery Co.',
  legalName: 'Summit Ridge Bakery Company, LLC',
  dbaName: 'Summit Ridge Café',
  ein: '84-1029384',
  /** Multiline HQ + mailing (guided setup Company basics) */
  addresses:
    'Headquarters\n1200 Commerce Pkwy, Suite 200\nDenver, CO 80202\n\nMailing\nPO Box 4400\nDenver, CO 80204',
  industryNaics: '311811 — Retail bakery',
  businessStructure: 'LLC (Limited Liability Company)',
  payrollFrequency: 'Bi-weekly (26)',
  employeeCount: 48,
  hrAdminName: 'Shelly Hamilton',
  hrAdminEmail: 'shelly.nguyen@summitridgebakery.com',
}

/** Employer admin users for guided setup → Roles and Permissions (task 1). */
export type EmployerRolesUserRow = {
  id: string
  name: string
  email: string
  userRights: string
  /** When true, row is read-only (no edit control). */
  locked?: boolean
}

export const EMPLOYER_ROLES_USER_RIGHTS_OPTIONS = [
  'Benefits administrator — full access',
  'Payroll liaison',
  'Read-only auditor',
  'Billing & finance',
] as const

export const EMPLOYER_ROLES_DEFAULT_USERS: EmployerRolesUserRow[] = [
  {
    id: 'shelly',
    name: 'Shelly Hamilton',
    email: 'shelly.nguyen@summitridgebakery.com',
    userRights: 'Benefits administrator — full access',
    locked: true,
  },
  {
    id: 'marcus-chen',
    name: 'Marcus Chen',
    email: 'marcus.chen@summitridgebakery.com',
    userRights: 'Payroll liaison',
    locked: false,
  },
  {
    id: 'riley-patel',
    name: 'Riley Patel',
    email: 'riley.patel@summitridgebakery.com',
    userRights: 'Read-only auditor',
    locked: false,
  },
]

/**
 * Employee groups / divisions / classes (guided setup task 3).
 * Pre-populated as if imported from census in “Add employees” (step 2).
 */
export type EmployeeGroupClassRow = {
  id: string
  groupLabel: string
  /** Subdivisions or roles within the group, e.g. Office / Sales / Janitor */
  breakdown: string
  /** True when row came from census import in the prior step */
  fromCensus: boolean
}

export const EMPLOYEE_GROUPS_CENSUS_DEFAULT: EmployeeGroupClassRow[] = [
  {
    id: 'executives',
    groupLabel: 'Executives',
    breakdown: '—',
    fromCensus: true,
  },
  {
    id: 'full-time',
    groupLabel: 'Full-time',
    breakdown: 'Office / Sales / Janitor',
    fromCensus: true,
  },
  {
    id: 'part-time',
    groupLabel: 'Part-time',
    breakdown: 'Office / Sales / Janitor',
    fromCensus: true,
  },
  {
    id: 'cobra',
    groupLabel: 'COBRA',
    breakdown: 'Continuation coverage',
    fromCensus: true,
  },
]

/** Default enrollment window lookbacks / lookaheads for life events (guided setup). */
export const LIFE_EVENT_DEFAULT_RETRO_DAYS = 60
export const LIFE_EVENT_DEFAULT_FUTURE_DAYS = 30

export type LifeEventRuleRow = {
  id: string
  eventName: string
  code: string
  retroDays: number
  futureDays: number
}

export const LIFE_EVENTS_DEFAULT_ROWS: LifeEventRuleRow[] = [
  {
    id: 'birth-adoption',
    eventName: 'Birth or Adoption',
    code: 'BIRTH_ADOPT',
    retroDays: LIFE_EVENT_DEFAULT_RETRO_DAYS,
    futureDays: LIFE_EVENT_DEFAULT_FUTURE_DAYS,
  },
  {
    id: 'marriage-dp',
    eventName: 'Marriage, Domestic Partnership, Common Law, or Civil Union',
    code: 'MARRIAGE_DP',
    retroDays: LIFE_EVENT_DEFAULT_RETRO_DAYS,
    futureDays: LIFE_EVENT_DEFAULT_FUTURE_DAYS,
  },
  {
    id: 'pt-to-ft',
    eventName: 'Part Time to Full Time',
    code: 'PT_TO_FT',
    retroDays: LIFE_EVENT_DEFAULT_RETRO_DAYS,
    futureDays: LIFE_EVENT_DEFAULT_FUTURE_DAYS,
  },
  {
    id: 'dep-loss',
    eventName: 'Dependent Loss of Coverage',
    code: 'DEP_LOSS_COV',
    retroDays: LIFE_EVENT_DEFAULT_RETRO_DAYS,
    futureDays: LIFE_EVENT_DEFAULT_FUTURE_DAYS,
  },
  {
    id: 'dep-gains',
    eventName: 'Dependent Gains',
    code: 'DEP_GAIN',
    retroDays: LIFE_EVENT_DEFAULT_RETRO_DAYS,
    futureDays: LIFE_EVENT_DEFAULT_FUTURE_DAYS,
  },
  {
    id: 'cov-elsewhere',
    eventName: 'Coverage Elsewhere',
    code: 'COV_ELSEWHERE',
    retroDays: LIFE_EVENT_DEFAULT_RETRO_DAYS,
    futureDays: LIFE_EVENT_DEFAULT_FUTURE_DAYS,
  },
  {
    id: 'divorce',
    eventName: 'Divorce/Annulment',
    code: 'DIVORCE',
    retroDays: LIFE_EVENT_DEFAULT_RETRO_DAYS,
    futureDays: LIFE_EVENT_DEFAULT_FUTURE_DAYS,
  },
  {
    id: 'admin-override',
    eventName: 'Admin Override',
    code: 'ADMIN_OVR',
    retroDays: LIFE_EVENT_DEFAULT_RETRO_DAYS,
    futureDays: LIFE_EVENT_DEFAULT_FUTURE_DAYS,
  },
]

/** Options shown under Business structure in guided setup (Company basics). */
export const EMPLOYER_BUSINESS_STRUCTURE_OPTIONS = [
  'C Corporation',
  'Sole Proprietorship',
  'Partnership',
  'S Corporation',
  'LLC (Limited Liability Company)',
  'Non-Profit',
] as const

/**
 * Benefit / plan categories for guided setup “Choose benefits to offer” (task 5).
 * Distinct names from employer plan roster; hyphen suffixes (e.g. plan year) omitted.
 */
export const PRODUCT_OPTIONS = [
  { id: 'accident-insurance', label: 'Accident Insurance' },
  { id: 'associate-critical-illness', label: 'Associate Critical Illness' },
  { id: 'basic-term-adnd', label: 'Basic Term AD&D' },
  { id: 'basic-term-life', label: 'Basic Term Life' },
  { id: 'bicycle', label: 'Bicycle' },
  { id: 'dcfsa', label: 'Child / Elder Care Flexible Spending Account' },
  { id: 'dental', label: 'Dental' },
  { id: 'eap', label: 'Employee Assistance Plan' },
  { id: 'fsa', label: 'Health Care Flexible Spending Account' },
  { id: 'hsa', label: 'Health Savings Account' },
  { id: 'hospital-indemnity', label: 'Hospital Indemnity' },
  { id: 'identity-theft', label: 'Identity Theft' },
  { id: 'legal-plan', label: 'Legal Plan' },
  { id: 'lpfsa', label: 'Limited FSA' },
  { id: 'ltd-buy-up', label: 'Long-Term Disability Buy Up' },
  { id: 'medical', label: 'Medical' },
  { id: 'std', label: 'Short Term Disability' },
  { id: 'spousal-surcharge', label: 'Spousal Surcharge' },
  { id: 'spouse-critical-illness', label: 'Spouse Critical Illness' },
  { id: 'supplemental-adnd', label: 'Supplemental AD&D' },
  { id: 'supplemental-child-life', label: 'Supplemental Child Life' },
  { id: 'supplemental-life', label: 'Supplemental Life' },
  { id: 'supplemental-spouse-life', label: 'Supplemental Spouse Life' },
  { id: 'transit-parking', label: 'Transit & Parking' },
  { id: 'vision', label: 'Vision' },
] as const

/** Pre-checked categories in the guided setup prototype. */
export const DEFAULT_SELECTED_BENEFIT_PRODUCT_IDS: readonly string[] = [
  'medical',
  'dental',
  'vision',
  'fsa',
  'lpfsa',
  'basic-term-life',
]

export type EnrollmentRow = {
  id: string
  name: string
  role: 'Employee' | 'Dependent' | 'Authorized user' | 'Beneficiary'
  status: 'Active' | 'COBRA' | 'Terminated' | 'Pending'
  department: string
  plan: string
  lastUpdated: string
  /** Subscriber / employee this person belongs to for nested roster display (`Dependent`, `Authorized user`, `Beneficiary`). */
  parentEmployeeId?: string
}

export const ENROLLMENT_ROWS: EnrollmentRow[] = [
  {
    id: '1',
    name: 'Jordan Lee',
    role: 'Employee',
    status: 'Active',
    department: 'Production',
    plan: 'Medical PPO + Dental + HSA',
    lastUpdated: '2026-04-02',
  },
  {
    id: '2',
    name: 'Morgan Ellis (spouse)',
    role: 'Dependent',
    status: 'Active',
    department: '—',
    plan: 'Medical PPO',
    lastUpdated: '2026-03-28',
    parentEmployeeId: '1',
  },
  {
    id: '2b',
    name: 'Riley Lee (child)',
    role: 'Dependent',
    status: 'Active',
    department: '—',
    plan: 'Medical PPO + dental',
    lastUpdated: '2026-03-30',
    parentEmployeeId: '1',
  },
  {
    id: '3',
    name: 'Priya Shah',
    role: 'Employee',
    status: 'Pending',
    department: 'Retail',
    plan: 'Enrollment in progress',
    lastUpdated: '2026-04-07',
  },
  {
    id: '3-dep',
    name: 'Aiden Shah (child)',
    role: 'Dependent',
    status: 'Active',
    department: '—',
    plan: 'Will enroll with parent',
    lastUpdated: '2026-04-01',
    parentEmployeeId: '3',
  },
  {
    id: '4',
    name: 'Alex Rivera',
    role: 'Employee',
    status: 'COBRA',
    department: 'Warehouse',
    plan: 'Medical HDHP',
    lastUpdated: '2026-02-14',
  },
  {
    id: '5',
    name: 'Sam Okonkwo',
    role: 'Authorized user',
    status: 'Active',
    department: '—',
    plan: 'HSA cardholder',
    lastUpdated: '2026-01-09',
    parentEmployeeId: '1',
  },
  {
    id: '6',
    name: 'Taylor Brooks',
    role: 'Beneficiary',
    status: 'Active',
    department: '—',
    plan: 'Life — 50% allocation',
    lastUpdated: '2025-11-02',
    parentEmployeeId: '1',
  },
  ...Array.from({ length: 24 }, (_, i) => ({
    id: `gen-${i}`,
    name: `Sample Employee ${i + 7}`,
    role: 'Employee' as const,
    status: (i % 5 === 0 ? 'Pending' : 'Active') as EnrollmentRow['status'],
    department: ['Production', 'Retail', 'Office', 'Warehouse'][i % 4]!,
    plan: ['Medical PPO', 'Medical HDHP', 'HSA only', 'Dental + Vision'][i % 4]!,
    lastUpdated: `2026-03-${String((i % 28) + 1).padStart(2, '0')}`,
  })),
  {
    id: 'dep-g0-1',
    name: 'Sample Spouse 7',
    role: 'Dependent',
    status: 'Active',
    department: '—',
    plan: 'Medical PPO (family)',
    lastUpdated: '2026-03-20',
    parentEmployeeId: 'gen-0',
  },
  {
    id: 'dep-g0-2',
    name: 'Sample Child 7a',
    role: 'Dependent',
    status: 'Active',
    department: '—',
    plan: 'Medical + dental (child)',
    lastUpdated: '2026-03-22',
    parentEmployeeId: 'gen-0',
  },
  {
    id: 'dep-g1-1',
    name: 'Spouse of Sample 8',
    role: 'Dependent',
    status: 'Active',
    department: '—',
    plan: 'HDHP (spouse)',
    lastUpdated: '2026-03-10',
    parentEmployeeId: 'gen-1',
  },
  {
    id: 'auth-g2-1',
    name: 'Cardholder for Sample 9',
    role: 'Authorized user',
    status: 'Active',
    department: '—',
    plan: 'HSA cardholder (authorized)',
    lastUpdated: '2026-02-01',
    parentEmployeeId: 'gen-2',
  },
  {
    id: 'ben-g3-1',
    name: 'Contingent beneficiary (Sample 10)',
    role: 'Beneficiary',
    status: 'Active',
    department: '—',
    plan: 'Supplemental life — contingent',
    lastUpdated: '2025-12-15',
    parentEmployeeId: 'gen-3',
  },
]

export const CONNECTORS = [
  { id: 'adp', name: 'ADP Workforce Now', category: 'Payroll / HRIS', direction: 'Bi-directional' },
  { id: 'enav', name: 'Employee Navigator', category: 'Broker system', direction: 'Bi-directional' },
  { id: 'uhc', name: 'UnitedHealthcare eligibility', category: 'Carrier', direction: 'Inbound / Outbound' },
  { id: 'edi', name: 'WEX unified EDI (census & eligibility)', category: 'File-based', direction: 'Inbound / Outbound' },
  { id: 'workday', name: 'Workday HCM', category: 'Payroll / HRIS', direction: 'Bi-directional' },
] as const

/** Last-run health shown in the report library table. */
export type ReportLibraryItemStatus = 'Success' | 'Error' | 'Warning'

export const REPORT_LIBRARY = [
  {
    id: 'r1',
    name: 'Claims by Source',
    description: 'Listing of claims by the method they are filed.',
    author: 'System',
    service: 'Accounts Payments',
    category: 'Claims & Spending',
    updated: '2026-04-12',
    updatedTime: '3:15 PM',
    status: 'Success' satisfies ReportLibraryItemStatus,
    statusDetailMessage: null,
  },
  {
    id: 'r2',
    name: 'COBRA notice delivery log',
    description: 'Track COBRA notices, delivery status, and channel.',
    author: 'Shelly Hamilton',
    service: 'COBRA & Direct Bill',
    category: 'Member & Benefits',
    updated: '2026-03-29',
    updatedTime: '9:12 AM',
    status: 'Warning' satisfies ReportLibraryItemStatus,
    statusDetailMessage:
      'The last run could not confirm delivery for 3 queued notices (SMTP bounces on 2, invalid fax number on 1). Review recipients and retry from the notice queue.',
  },
  {
    id: 'r3',
    name: 'HSA / FSA funding summary',
    description: 'HSA and FSA contributions by account and year.',
    author: 'System',
    service: 'Accounts Payments',
    category: 'Contributions & Funding',
    updated: '2026-03-24',
    updatedTime: '4:30 PM',
    status: 'Success' satisfies ReportLibraryItemStatus,
    statusDetailMessage: null,
  },
  {
    id: 'r4',
    name: 'Premium subsidy by plan tier',
    description: 'Subsidies and enrollment by tier and coverage level.',
    author: 'Jordan Lee',
    service: 'BenAdmin',
    category: 'Plan Design & Compliance',
    updated: '2026-02-18',
    updatedTime: '11:05 AM',
    status: 'Error' satisfies ReportLibraryItemStatus,
    statusDetailMessage:
      'Subsidy rows for 2 plan tiers were skipped because tier codes in the eligibility feed did not match any configured tier in BenAdmin. Fix the mapping and re-run before relying on this report.',
  },
  {
    id: 'r5',
    name: 'Debit card activity',
    description: 'Card loads, spend, and merchants for funded programs.',
    author: 'System',
    service: 'Accounts Payments',
    category: 'Platform & Engagement',
    updated: '2026-04-07',
    updatedTime: '8:20 AM',
    status: 'Success' satisfies ReportLibraryItemStatus,
    statusDetailMessage: null,
  },
  {
    id: 'r6',
    name: 'Full Plan Enrollments',
    description: 'Enrollment counts and status across all plan lines.',
    author: 'System',
    service: 'All services',
    category: 'Member & Benefits',
    updated: '2026-04-01',
    updatedTime: '2:45 PM',
    status: 'Success' satisfies ReportLibraryItemStatus,
    statusDetailMessage: null,
  },
  {
    id: 'r7',
    name: 'Combined Overview Dashboard',
    description: 'Cross-service enrollment trends, distribution, and monthly benefits in one view.',
    author: 'System',
    service: 'All services',
    category: 'Platform & Engagement',
    updated: '2026-04-15',
    updatedTime: '8:40 AM',
    status: 'Success' satisfies ReportLibraryItemStatus,
    statusDetailMessage: null,
  },
] as const

/** Route id for the combined overview layout (not the claims detail template). */
export const COMBINED_OVERVIEW_REPORT_ID = 'r7'

/** Prototype run history for the report detail “Run log” sheet (newest first). */
export type ReportRunLogStatus = 'Success' | 'Warning' | 'Error'

export type ReportRunLogEntry = {
  id: string
  startedLabel: string
  durationLabel: string
  status: ReportRunLogStatus
  summary: string
  trigger: 'Scheduled' | 'Manual' | 'System'
}

export function getReportRunLog(reportId: string): ReportRunLogEntry[] {
  return [
    {
      id: `${reportId}-run-1`,
      startedLabel: 'Apr 15, 2026 · 8:40 AM',
      durationLabel: '2.8s',
      status: 'Success',
      summary: 'Run finished; output generated and indexed for download.',
      trigger: 'Scheduled',
    },
    {
      id: `${reportId}-run-2`,
      startedLabel: 'Apr 14, 2026 · 6:00 AM',
      durationLabel: '3.4s',
      status: 'Success',
      summary: 'Scheduled refresh completed with no anomalies.',
      trigger: 'System',
    },
    {
      id: `${reportId}-run-3`,
      startedLabel: 'Apr 12, 2026 · 9:15 AM',
      durationLabel: '5.1s',
      status: 'Warning',
      summary: 'Completed with warnings — one data source returned partial results.',
      trigger: 'Manual',
    },
    {
      id: `${reportId}-run-4`,
      startedLabel: 'Apr 10, 2026 · 6:00 AM',
      durationLabel: '2.9s',
      status: 'Success',
      summary: 'Extract delivered to the reporting folder.',
      trigger: 'Scheduled',
    },
    {
      id: `${reportId}-run-5`,
      startedLabel: 'Apr 8, 2026 · 6:00 AM',
      durationLabel: '4.0s',
      status: 'Error',
      summary: 'Run failed — connection to upstream source timed out.',
      trigger: 'Scheduled',
    },
  ]
}

export type CombinedOverviewMonthlyRow = {
  id: string
  employee: string
  employeeId: string
  division: string
  plan: string
  memberBenefits: string
  contributionsFunding: string
  claimsSpending: string
  coverageLevel: string
  effectiveDate: string
  /** Optional category tag for filter demo */
  benefitCategory: string
}

export const COMBINED_OVERVIEW_MONTHLY_ROWS: CombinedOverviewMonthlyRow[] = [
  {
    id: 'co-1',
    employee: 'Sarah Johnson',
    employeeId: 'EMP-1001',
    division: 'Engineering',
    plan: 'Silver Plan',
    memberBenefits: 'Enrolled',
    contributionsFunding: '—',
    claimsSpending: 'Active',
    coverageLevel: 'Individual + 1',
    effectiveDate: '01/01/2026',
    benefitCategory: 'Medical',
  },
  {
    id: 'co-13',
    employee: 'Emily Rodriguez',
    employeeId: 'EMP-1003',
    division: 'Marketing',
    plan: 'HSA Health',
    memberBenefits: 'Enrolled',
    contributionsFunding: '—',
    claimsSpending: 'Active',
    coverageLevel: '$2,500',
    effectiveDate: '01/01/2026',
    benefitCategory: 'Medical',
  },
  {
    id: 'co-14',
    employee: 'David Kim',
    employeeId: 'EMP-1004',
    division: 'Engineering',
    plan: 'Supplemental Emp Life',
    memberBenefits: 'Enrolled',
    contributionsFunding: '—',
    claimsSpending: '—',
    coverageLevel: '1x Salary',
    effectiveDate: '02/01/2026',
    benefitCategory: 'Medical',
  },
  {
    id: 'co-2',
    employee: 'Marcus Chen',
    employeeId: 'EMP-1002',
    division: 'Sales',
    plan: 'HMO Standard',
    memberBenefits: 'Enrolled',
    contributionsFunding: '—',
    claimsSpending: '—',
    coverageLevel: 'Individual',
    effectiveDate: '02/15/2026',
    benefitCategory: 'Medical',
  },
  {
    id: 'co-3',
    employee: 'Riley Patel',
    employeeId: 'EMP-1013',
    division: 'Marketing',
    plan: 'COBRA PPO',
    memberBenefits: '—',
    contributionsFunding: 'Pending',
    claimsSpending: '—',
    coverageLevel: 'Family',
    effectiveDate: '03/01/2026',
    benefitCategory: 'Medical',
  },
  {
    id: 'co-4',
    employee: 'Jordan Lee',
    employeeId: 'EMP-1014',
    division: 'Engineering',
    plan: 'Silver Plan',
    memberBenefits: 'Enrolled',
    contributionsFunding: 'Paid',
    claimsSpending: 'Active',
    coverageLevel: '$2,500',
    effectiveDate: '01/01/2026',
    benefitCategory: 'Medical',
  },
  {
    id: 'co-5',
    employee: 'Alex Rivera',
    employeeId: 'EMP-1005',
    division: 'Sales',
    plan: 'HDHP + HSA',
    memberBenefits: 'Enrolled',
    contributionsFunding: '—',
    claimsSpending: 'Active',
    coverageLevel: 'Family',
    effectiveDate: '01/15/2026',
    benefitCategory: 'Medical',
  },
  {
    id: 'co-6',
    employee: 'Taylor Brooks',
    employeeId: 'EMP-1006',
    division: 'Marketing',
    plan: 'Dental PPO',
    memberBenefits: 'Enrolled',
    contributionsFunding: '—',
    claimsSpending: '—',
    coverageLevel: 'Individual',
    effectiveDate: '02/01/2026',
    benefitCategory: 'Dental',
  },
  {
    id: 'co-7',
    employee: 'Casey Nguyen',
    employeeId: 'EMP-1007',
    division: 'Engineering',
    plan: 'Vision',
    memberBenefits: 'Enrolled',
    contributionsFunding: '—',
    claimsSpending: '—',
    coverageLevel: 'Individual + 1',
    effectiveDate: '01/01/2026',
    benefitCategory: 'Vision',
  },
  {
    id: 'co-8',
    employee: 'Morgan Blake',
    employeeId: 'EMP-1008',
    division: 'Sales',
    plan: 'PPO Gold',
    memberBenefits: 'Enrolled',
    contributionsFunding: '—',
    claimsSpending: '—',
    coverageLevel: 'Family',
    effectiveDate: '03/10/2026',
    benefitCategory: 'Medical',
  },
  {
    id: 'co-9',
    employee: 'Jamie Ortiz',
    employeeId: 'EMP-1009',
    division: 'Marketing',
    plan: 'HMO Standard',
    memberBenefits: 'Enrolled',
    contributionsFunding: '—',
    claimsSpending: '—',
    coverageLevel: 'Individual',
    effectiveDate: '02/20/2026',
    benefitCategory: 'Medical',
  },
  {
    id: 'co-10',
    employee: 'Drew Kim',
    employeeId: 'EMP-1010',
    division: 'Engineering',
    plan: 'COBRA PPO',
    memberBenefits: '—',
    contributionsFunding: 'Paid',
    claimsSpending: '—',
    coverageLevel: 'Family',
    effectiveDate: '01/05/2026',
    benefitCategory: 'Medical',
  },
  {
    id: 'co-11',
    employee: 'Sam Wright',
    employeeId: 'EMP-1011',
    division: 'Sales',
    plan: 'Dental PPO',
    memberBenefits: 'Enrolled',
    contributionsFunding: '—',
    claimsSpending: 'Active',
    coverageLevel: 'Individual',
    effectiveDate: '02/28/2026',
    benefitCategory: 'Dental',
  },
  {
    id: 'co-12',
    employee: 'Quinn Foster',
    employeeId: 'EMP-1012',
    division: 'Marketing',
    plan: 'PPO Gold',
    memberBenefits: 'Enrolled',
    contributionsFunding: 'Pending',
    claimsSpending: 'Active',
    coverageLevel: 'Individual + 1',
    effectiveDate: '01/01/2026',
    benefitCategory: 'Medical',
  },
]

/** Standard detail template rows for the reporting prototype (e.g. “Claims by Source” layout). */
export type ReportDetailPlanType = 'medical_flex' | 'dependent_care' | 'hsa'

export type ReportDetailClaimStatus = 'paid' | 'processing' | 'hold'

export type ReportDetailClaimRow = {
  id: string
  methodFiled: string
  employerName: string
  submitDate: string
  claimNumber: string
  planType: ReportDetailPlanType
  planDisplayName: string
  claimStatus: ReportDetailClaimStatus
  claimProcessingStatus: string
  /** Optional — shown when the column is enabled in report customization. */
  employeeName?: string
  employeeId?: string
  enrollmentDate?: string
  numberOfDependents?: number
  cobraDuration?: string
  ytdContributions?: string
}

/** Submit dates fall within the rolling “Last 30 days” window when report “as of” is the max date below (04/15/2026). */
export const REPORT_DETAIL_CLAIM_ROWS: ReportDetailClaimRow[] = [
  {
    id: 'c1',
    methodFiled: 'Claim import',
    employerName: 'ABC Company',
    submitDate: '04/15/2026',
    claimNumber: 'WEX00001001',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 1/1-12/31',
    claimStatus: 'paid',
    claimProcessingStatus: 'Auto Adjudicated',
  },
  {
    id: 'c2',
    methodFiled: 'Web portal',
    employerName: 'XYZ Corporation',
    submitDate: '04/14/2026',
    claimNumber: 'WEX00001002',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 1/1-12/31',
    claimStatus: 'processing',
    claimProcessingStatus: 'Manual',
  },
  {
    id: 'c3',
    methodFiled: 'Mobile app',
    employerName: 'Tech Solutions Inc',
    submitDate: '04/13/2026',
    claimNumber: 'WEX00001003',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 7/1-6/30',
    claimStatus: 'hold',
    claimProcessingStatus: 'Document Verification',
  },
  {
    id: 'c4',
    methodFiled: 'Email submission',
    employerName: 'Summit Ridge Bakery Co.',
    submitDate: '04/12/2026',
    claimNumber: 'WEX00001004',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 7/1-6/30',
    claimStatus: 'paid',
    claimProcessingStatus: 'Non Auto Adjudicated Manual',
  },
  {
    id: 'c5',
    methodFiled: 'Web portal',
    employerName: 'Northwind Foods LLC',
    submitDate: '04/11/2026',
    claimNumber: 'WEX00001005',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 1/1-12/31',
    claimStatus: 'processing',
    claimProcessingStatus: 'Auto Adjudicated',
  },
  {
    id: 'c6',
    methodFiled: 'Claim import',
    employerName: 'Harbor Dental Group',
    submitDate: '04/10/2026',
    claimNumber: 'WEX00001006',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 1/1-12/31',
    claimStatus: 'paid',
    claimProcessingStatus: 'Manual',
  },
  {
    id: 'c7',
    methodFiled: 'Mobile app',
    employerName: 'ABC Company',
    submitDate: '04/09/2026',
    claimNumber: 'WEX00001007',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 7/1-6/30',
    claimStatus: 'hold',
    claimProcessingStatus: 'Document Verification',
  },
  {
    id: 'c8',
    methodFiled: 'Email submission',
    employerName: 'XYZ Corporation',
    submitDate: '04/08/2026',
    claimNumber: 'WEX00001008',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 7/1-6/30',
    claimStatus: 'paid',
    claimProcessingStatus: 'Non Auto Adjudicated Manual',
  },
  {
    id: 'c9',
    methodFiled: 'Web portal',
    employerName: 'Tech Solutions Inc',
    submitDate: '04/07/2026',
    claimNumber: 'WEX00001009',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 1/1-12/31',
    claimStatus: 'processing',
    claimProcessingStatus: 'Auto Adjudicated',
  },
  {
    id: 'c10',
    methodFiled: 'Claim import',
    employerName: 'Summit Ridge Bakery Co.',
    submitDate: '04/05/2026',
    claimNumber: 'WEX00001010',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 1/1-12/31',
    claimStatus: 'paid',
    claimProcessingStatus: 'Manual',
  },
  {
    id: 'c11',
    methodFiled: 'Mobile app',
    employerName: 'Northwind Foods LLC',
    submitDate: '04/04/2026',
    claimNumber: 'WEX00001011',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 7/1-6/30',
    claimStatus: 'hold',
    claimProcessingStatus: 'Document Verification',
  },
  {
    id: 'c12',
    methodFiled: 'Email submission',
    employerName: 'Harbor Dental Group',
    submitDate: '04/03/2026',
    claimNumber: 'WEX00001012',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 7/1-6/30',
    claimStatus: 'processing',
    claimProcessingStatus: 'Non Auto Adjudicated Manual',
  },
  {
    id: 'c13',
    methodFiled: 'Web portal',
    employerName: 'ABC Company',
    submitDate: '04/02/2026',
    claimNumber: 'WEX00001013',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 1/1-12/31',
    claimStatus: 'paid',
    claimProcessingStatus: 'Auto Adjudicated',
  },
  {
    id: 'c14',
    methodFiled: 'Claim import',
    employerName: 'XYZ Corporation',
    submitDate: '04/01/2026',
    claimNumber: 'WEX00001014',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 1/1-12/31',
    claimStatus: 'processing',
    claimProcessingStatus: 'Manual',
  },
  {
    id: 'c15',
    methodFiled: 'Mobile app',
    employerName: 'Tech Solutions Inc',
    submitDate: '03/30/2026',
    claimNumber: 'WEX00001015',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 7/1-6/30',
    claimStatus: 'paid',
    claimProcessingStatus: 'Document Verification',
  },
  {
    id: 'c16',
    methodFiled: 'Email submission',
    employerName: 'Summit Ridge Bakery Co.',
    submitDate: '03/28/2026',
    claimNumber: 'WEX00001016',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 1/1-12/31',
    claimStatus: 'hold',
    claimProcessingStatus: 'Non Auto Adjudicated Manual',
  },
  {
    id: 'c17',
    methodFiled: 'Web portal',
    employerName: 'Northwind Foods LLC',
    submitDate: '03/26/2026',
    claimNumber: 'WEX00001017',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 1/1-12/31',
    claimStatus: 'paid',
    claimProcessingStatus: 'Auto Adjudicated',
  },
  {
    id: 'c18',
    methodFiled: 'Claim import',
    employerName: 'Harbor Dental Group',
    submitDate: '03/25/2026',
    claimNumber: 'WEX00001018',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 7/1-6/30',
    claimStatus: 'processing',
    claimProcessingStatus: 'Manual',
  },
  {
    id: 'c19',
    methodFiled: 'Mobile app',
    employerName: 'ABC Company',
    submitDate: '03/24/2026',
    claimNumber: 'WEX00001019',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 1/1-12/31',
    claimStatus: 'paid',
    claimProcessingStatus: 'Document Verification',
  },
  {
    id: 'c20',
    methodFiled: 'Email submission',
    employerName: 'XYZ Corporation',
    submitDate: '03/22/2026',
    claimNumber: 'WEX00001020',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 1/1-12/31',
    claimStatus: 'hold',
    claimProcessingStatus: 'Non Auto Adjudicated Manual',
  },
  {
    id: 'c21',
    methodFiled: 'Web portal',
    employerName: 'Tech Solutions Inc',
    submitDate: '03/20/2026',
    claimNumber: 'WEX00001021',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 1/1-12/31',
    claimStatus: 'processing',
    claimProcessingStatus: 'Auto Adjudicated',
  },
  {
    id: 'c22',
    methodFiled: 'Claim import',
    employerName: 'Summit Ridge Bakery Co.',
    submitDate: '03/19/2026',
    claimNumber: 'WEX00001022',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 1/1-12/31',
    claimStatus: 'paid',
    claimProcessingStatus: 'Manual',
  },
  {
    id: 'c23',
    methodFiled: 'Mobile app',
    employerName: 'Northwind Foods LLC',
    submitDate: '03/18/2026',
    claimNumber: 'WEX00001023',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 1/1-12/31',
    claimStatus: 'processing',
    claimProcessingStatus: 'Document Verification',
  },
  {
    id: 'c24',
    methodFiled: 'Email submission',
    employerName: 'Harbor Dental Group',
    submitDate: '03/17/2026',
    claimNumber: 'WEX00001024',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 1/1-12/31',
    claimStatus: 'hold',
    claimProcessingStatus: 'Non Auto Adjudicated Manual',
  },
]
