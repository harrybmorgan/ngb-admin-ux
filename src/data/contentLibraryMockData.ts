export type ContentLibraryType = 'document' | 'video' | 'tutorial'

export type ContentLibraryStatus = 'published' | 'draft' | 'scheduled'

export interface ContentLibraryItem {
  id: string
  type: ContentLibraryType
  title: string
  description: string
  status: ContentLibraryStatus
  /** ISO date string when status is scheduled */
  scheduledFor?: string
  updatedAt: string
  /** Display size or format, e.g. "2.4 MB", "Stream" */
  format: string
}

export const CONTENT_LIBRARY_TYPES: ContentLibraryType[] = ['document', 'video', 'tutorial']

export const CONTENT_LIBRARY_STATUSES: ContentLibraryStatus[] = ['published', 'draft', 'scheduled']

export const CONTENT_LIBRARY_MOCK: ContentLibraryItem[] = [
  {
    id: 'cl-1',
    type: 'document',
    title: '2026 SPD — Medical & Rx',
    description: 'Summary plan description covering medical, prescription, and related disclosures for the plan year.',
    status: 'published',
    updatedAt: 'Apr 2, 2026',
    format: '2.4 MB',
  },
  {
    id: 'cl-2',
    type: 'document',
    title: 'HSA eligible expenses quick reference',
    description: 'One-page PDF for employees listing common eligible and ineligible HSA expenses.',
    status: 'draft',
    updatedAt: 'Apr 5, 2026',
    format: '890 KB',
  },
  {
    id: 'cl-3',
    type: 'document',
    title: 'COBRA rights and election form',
    description: 'Model notice and election form; legal review pending before publish.',
    status: 'scheduled',
    scheduledFor: '2026-04-15T12:00:00.000Z',
    updatedAt: 'Apr 1, 2026',
    format: '1.1 MB',
  },
  {
    id: 'cl-4',
    type: 'video',
    title: 'Open enrollment walkthrough (8 min)',
    description: 'Narrated tour of plan selection, life events, and confirmation steps in the portal.',
    status: 'published',
    updatedAt: 'Mar 28, 2026',
    format: 'Stream',
  },
  {
    id: 'cl-5',
    type: 'video',
    title: 'HSA vs FSA — which is right for you?',
    description: 'Short explainer comparing account types; awaiting final captions.',
    status: 'draft',
    updatedAt: 'Apr 6, 2026',
    format: 'Stream',
  },
  {
    id: 'cl-6',
    type: 'video',
    title: 'New hire benefits overview',
    description: 'Scheduled to align with April new-hire cohort onboarding.',
    status: 'scheduled',
    scheduledFor: '2026-04-20T14:00:00.000Z',
    updatedAt: 'Apr 4, 2026',
    format: 'Stream',
  },
  {
    id: 'cl-7',
    type: 'tutorial',
    title: 'How to approve life events',
    description: 'Step-by-step guide for managers approving dependent adds and other life events.',
    status: 'published',
    updatedAt: 'Mar 10, 2026',
    format: 'Guide',
  },
  {
    id: 'cl-8',
    type: 'tutorial',
    title: 'Annual enrollment checklist',
    description: 'Internal checklist for HR before go-live; scheduled to publish after leadership sign-off.',
    status: 'scheduled',
    scheduledFor: '2026-04-22T09:00:00.000Z',
    updatedAt: 'Apr 7, 2026',
    format: 'Guide',
  },
]
