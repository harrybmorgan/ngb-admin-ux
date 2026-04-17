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
  },
  {
    id: '6',
    name: 'Taylor Brooks',
    role: 'Beneficiary',
    status: 'Active',
    department: '—',
    plan: 'Life — 50% allocation',
    lastUpdated: '2025-11-02',
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
]

export const CONNECTORS = [
  { id: 'adp', name: 'ADP Workforce Now', category: 'Payroll / HRIS', direction: 'Bi-directional' },
  { id: 'enav', name: 'Employee Navigator', category: 'Broker system', direction: 'Bi-directional' },
  { id: 'uhc', name: 'UnitedHealthcare eligibility', category: 'Carrier', direction: 'Inbound / Outbound' },
  { id: 'edi', name: 'WEX unified EDI (census & eligibility)', category: 'File-based', direction: 'Inbound / Outbound' },
  { id: 'workday', name: 'Workday HCM', category: 'Payroll / HRIS', direction: 'Bi-directional' },
] as const

export const REPORT_LIBRARY = [
  {
    id: 'r1',
    name: 'Payroll deduction reconciliation',
    description: 'Compare payroll deductions to funding and variances.',
    author: 'System',
    service: 'BenAdmin',
    category: 'Contributions & Funding',
    updated: '2026-04-01',
    updatedTime: '2:45 PM',
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
  },
  {
    id: 'r3',
    name: 'HSA / FSA funding summary',
    description: 'HSA and FSA contributions by account and year.',
    author: 'System',
    service: 'Accounts Payments',
    category: 'Plan Design & Compliance',
    updated: '2026-03-24',
    updatedTime: '4:30 PM',
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
  },
  {
    id: 'r5',
    name: 'Company card activity',
    description: 'Card loads, spend, and merchants for funded programs.',
    author: 'System',
    service: 'BenAdmin',
    category: 'Platform & Engagement',
    updated: '2026-04-07',
    updatedTime: '8:20 AM',
  },
  {
    id: 'r6',
    name: 'Full Plan Enrollments',
    description: 'Enrollment counts and status across all plan lines.',
    author: 'System',
    service: 'BenAdmin',
    category: 'Member & Benefits',
    updated: '2026-04-12',
    updatedTime: '3:15 PM',
  },
] as const

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
}

/** Submit dates fall within the rolling “Last 30 days” window when report “as of” is the max date below (04/15/2026). */
export const REPORT_DETAIL_CLAIM_ROWS: ReportDetailClaimRow[] = [
  {
    id: 'c1',
    methodFiled: 'Claim import',
    employerName: 'ABC Company',
    submitDate: '04/15/2026',
    claimNumber: 'DBI54050260122I0000101',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 01/01/2025-12/31/2025',
    claimStatus: 'paid',
    claimProcessingStatus: 'Auto Adjudicated',
  },
  {
    id: 'c2',
    methodFiled: 'Web portal',
    employerName: 'XYZ Corporation',
    submitDate: '04/14/2026',
    claimNumber: 'DBI54050260122I0000102',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 01/01/2025-12/31/2025',
    claimStatus: 'processing',
    claimProcessingStatus: 'Manual',
  },
  {
    id: 'c3',
    methodFiled: 'Mobile app',
    employerName: 'Tech Solutions Inc',
    submitDate: '04/13/2026',
    claimNumber: 'DBI54050260122I0000103',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 01/01/2025-12/31/2025',
    claimStatus: 'hold',
    claimProcessingStatus: 'Document Verification',
  },
  {
    id: 'c4',
    methodFiled: 'Email submission',
    employerName: 'Summit Ridge Bakery Co.',
    submitDate: '04/12/2026',
    claimNumber: 'DBI54050260122I0000104',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 01/01/2025-12/31/2025',
    claimStatus: 'paid',
    claimProcessingStatus: 'Non Auto Adjudicated Manual',
  },
  {
    id: 'c5',
    methodFiled: 'Web portal',
    employerName: 'Northwind Foods LLC',
    submitDate: '04/11/2026',
    claimNumber: 'DBI54050260122I0000105',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 01/01/2025-12/31/2025',
    claimStatus: 'processing',
    claimProcessingStatus: 'Auto Adjudicated',
  },
  {
    id: 'c6',
    methodFiled: 'Claim import',
    employerName: 'Harbor Dental Group',
    submitDate: '04/10/2026',
    claimNumber: 'DBI54050260122I0000106',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 01/01/2025-12/31/2025',
    claimStatus: 'paid',
    claimProcessingStatus: 'Manual',
  },
  {
    id: 'c7',
    methodFiled: 'Mobile app',
    employerName: 'ABC Company',
    submitDate: '04/09/2026',
    claimNumber: 'DBI54050260122I0000107',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 01/01/2025-12/31/2025',
    claimStatus: 'hold',
    claimProcessingStatus: 'Document Verification',
  },
  {
    id: 'c8',
    methodFiled: 'Email submission',
    employerName: 'XYZ Corporation',
    submitDate: '04/08/2026',
    claimNumber: 'DBI54050260122I0000108',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 01/01/2025-12/31/2025',
    claimStatus: 'paid',
    claimProcessingStatus: 'Non Auto Adjudicated Manual',
  },
  {
    id: 'c9',
    methodFiled: 'Web portal',
    employerName: 'Tech Solutions Inc',
    submitDate: '04/07/2026',
    claimNumber: 'DBI54050260122I0000109',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 01/01/2025-12/31/2025',
    claimStatus: 'processing',
    claimProcessingStatus: 'Auto Adjudicated',
  },
  {
    id: 'c10',
    methodFiled: 'Claim import',
    employerName: 'Summit Ridge Bakery Co.',
    submitDate: '04/05/2026',
    claimNumber: 'DBI54050260122I0000110',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 01/01/2025-12/31/2025',
    claimStatus: 'paid',
    claimProcessingStatus: 'Manual',
  },
  {
    id: 'c11',
    methodFiled: 'Mobile app',
    employerName: 'Northwind Foods LLC',
    submitDate: '04/04/2026',
    claimNumber: 'DBI54050260122I0000111',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 01/01/2025-12/31/2025',
    claimStatus: 'hold',
    claimProcessingStatus: 'Document Verification',
  },
  {
    id: 'c12',
    methodFiled: 'Email submission',
    employerName: 'Harbor Dental Group',
    submitDate: '04/03/2026',
    claimNumber: 'DBI54050260122I0000112',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 01/01/2025-12/31/2025',
    claimStatus: 'processing',
    claimProcessingStatus: 'Non Auto Adjudicated Manual',
  },
  {
    id: 'c13',
    methodFiled: 'Web portal',
    employerName: 'ABC Company',
    submitDate: '04/02/2026',
    claimNumber: 'DBI54050260122I0000113',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 01/01/2025-12/31/2025',
    claimStatus: 'paid',
    claimProcessingStatus: 'Auto Adjudicated',
  },
  {
    id: 'c14',
    methodFiled: 'Claim import',
    employerName: 'XYZ Corporation',
    submitDate: '04/01/2026',
    claimNumber: 'DBI54050260122I0000114',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 01/01/2025-12/31/2025',
    claimStatus: 'processing',
    claimProcessingStatus: 'Manual',
  },
  {
    id: 'c15',
    methodFiled: 'Mobile app',
    employerName: 'Tech Solutions Inc',
    submitDate: '03/30/2026',
    claimNumber: 'DBI54050260122I0000115',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 01/01/2025-12/31/2025',
    claimStatus: 'paid',
    claimProcessingStatus: 'Document Verification',
  },
  {
    id: 'c16',
    methodFiled: 'Email submission',
    employerName: 'Summit Ridge Bakery Co.',
    submitDate: '03/28/2026',
    claimNumber: 'DBI54050260122I0000116',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 01/01/2025-12/31/2025',
    claimStatus: 'hold',
    claimProcessingStatus: 'Non Auto Adjudicated Manual',
  },
  {
    id: 'c17',
    methodFiled: 'Web portal',
    employerName: 'Northwind Foods LLC',
    submitDate: '03/26/2026',
    claimNumber: 'DBI54050260122I0000117',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 01/01/2025-12/31/2025',
    claimStatus: 'paid',
    claimProcessingStatus: 'Auto Adjudicated',
  },
  {
    id: 'c18',
    methodFiled: 'Claim import',
    employerName: 'Harbor Dental Group',
    submitDate: '03/25/2026',
    claimNumber: 'DBI54050260122I0000118',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 01/01/2025-12/31/2025',
    claimStatus: 'processing',
    claimProcessingStatus: 'Manual',
  },
  {
    id: 'c19',
    methodFiled: 'Mobile app',
    employerName: 'ABC Company',
    submitDate: '03/24/2026',
    claimNumber: 'DBI54050260122I0000119',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 01/01/2025-12/31/2025',
    claimStatus: 'paid',
    claimProcessingStatus: 'Document Verification',
  },
  {
    id: 'c20',
    methodFiled: 'Email submission',
    employerName: 'XYZ Corporation',
    submitDate: '03/22/2026',
    claimNumber: 'DBI54050260122I0000120',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 01/01/2025-12/31/2025',
    claimStatus: 'hold',
    claimProcessingStatus: 'Non Auto Adjudicated Manual',
  },
  {
    id: 'c21',
    methodFiled: 'Web portal',
    employerName: 'Tech Solutions Inc',
    submitDate: '03/20/2026',
    claimNumber: 'DBI54050260122I0000121',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 01/01/2025-12/31/2025',
    claimStatus: 'processing',
    claimProcessingStatus: 'Auto Adjudicated',
  },
  {
    id: 'c22',
    methodFiled: 'Claim import',
    employerName: 'Summit Ridge Bakery Co.',
    submitDate: '03/19/2026',
    claimNumber: 'DBI54050260122I0000122',
    planType: 'medical_flex',
    planDisplayName: 'Medical FSA 01/01/2025-12/31/2025',
    claimStatus: 'paid',
    claimProcessingStatus: 'Manual',
  },
  {
    id: 'c23',
    methodFiled: 'Mobile app',
    employerName: 'Northwind Foods LLC',
    submitDate: '03/18/2026',
    claimNumber: 'DBI54050260122I0000123',
    planType: 'dependent_care',
    planDisplayName: 'Dependent Care FSA 01/01/2025-12/31/2025',
    claimStatus: 'processing',
    claimProcessingStatus: 'Document Verification',
  },
  {
    id: 'c24',
    methodFiled: 'Email submission',
    employerName: 'Harbor Dental Group',
    submitDate: '03/17/2026',
    claimNumber: 'DBI54050260122I0000124',
    planType: 'hsa',
    planDisplayName: 'Health Savings Account 01/01/2025-12/31/2025',
    claimStatus: 'hold',
    claimProcessingStatus: 'Non Auto Adjudicated Manual',
  },
]
