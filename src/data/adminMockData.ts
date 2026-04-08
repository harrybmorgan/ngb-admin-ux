/** Realistic dummy data for the employer admin prototype (Summit Ridge Bakery Co.) */

export const EMPLOYER = {
  name: 'Summit Ridge Bakery Co.',
  ein: '84-1029384',
  payrollFrequency: 'Bi-weekly (26)',
  employeeCount: 48,
  hrAdminName: 'Shelly Nguyen',
  hrAdminEmail: 'shelly.nguyen@summitridgebakery.com',
}

export const PRODUCT_OPTIONS = [
  { id: 'hsa', label: 'HSA' },
  { id: 'lpfsa', label: 'Limited purpose FSA' },
  { id: 'commuter', label: 'Commuter' },
  { id: 'medical', label: 'Medical' },
  { id: 'dental', label: 'Dental' },
  { id: 'vision', label: 'Vision' },
  { id: 'voluntary', label: 'Voluntary' },
] as const

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
    author: 'System',
    service: 'BenAdmin',
    updated: '2026-04-01',
  },
  {
    id: 'r2',
    name: 'COBRA notice delivery log',
    author: 'Shelly Nguyen',
    service: 'COBRA & Direct Bill',
    updated: '2026-03-29',
  },
  {
    id: 'r3',
    name: 'HSA / FSA funding summary',
    author: 'System',
    service: 'Accounts Payments',
    updated: '2026-04-06',
  },
  {
    id: 'r4',
    name: 'Premium subsidy by plan tier',
    author: 'Jordan Lee',
    service: 'BenAdmin',
    updated: '2026-02-18',
  },
] as const

export const CONTENT_ITEMS = [
  { id: 'c1', type: 'document' as const, title: '2026 SPD — Medical & Rx', size: '2.4 MB' },
  { id: 'c2', type: 'video' as const, title: 'Open enrollment walkthrough (8 min)', size: 'Stream' },
  { id: 'c3', type: 'tutorial' as const, title: 'How to approve life events', size: 'Guide' },
]
