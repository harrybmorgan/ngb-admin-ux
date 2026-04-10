import { FileText, Film, GraduationCap } from 'lucide-react'
import type { ContentLibraryType } from '@/data/contentLibraryMockData'

export function ContentTypeIcon({ type, className = 'h-4 w-4' }: { type: ContentLibraryType; className?: string }) {
  switch (type) {
    case 'document':
      return <FileText className={className} aria-hidden />
    case 'video':
      return <Film className={className} aria-hidden />
    case 'tutorial':
      return <GraduationCap className={className} aria-hidden />
  }
}

export function contentTypeLabel(type: ContentLibraryType): string {
  switch (type) {
    case 'document':
      return 'Document'
    case 'video':
      return 'Video'
    case 'tutorial':
      return 'Tutorial'
  }
}
