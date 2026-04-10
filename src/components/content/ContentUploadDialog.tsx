import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FloatLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { Upload, X } from 'lucide-react'
import type { ContentLibraryType } from '@/data/contentLibraryMockData'

export type UploadFormStatusChoice = 'draft' | 'scheduled'

export interface NewContentPayload {
  title: string
  description: string
  type: ContentLibraryType
  statusChoice: UploadFormStatusChoice
  scheduledDate?: Date
  /** Optional file chosen via drag-and-drop or browse (prototype only). */
  file?: File | null
}

export interface ContentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: NewContentPayload) => void
}

function defaultFormatForType(type: ContentLibraryType): string {
  switch (type) {
    case 'document':
      return '—'
    case 'video':
      return 'Stream'
    case 'tutorial':
      return 'Guide'
  }
}

function stripExtension(name: string): string {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(0, i) : name
}

export function ContentUploadDialog({ open, onOpenChange, onSubmit }: ContentUploadDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ContentLibraryType>('document')
  const [statusChoice, setStatusChoice] = useState<UploadFormStatusChoice>('draft')
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined)
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const applyFile = useCallback((file: File | null) => {
    setStagedFile(file)
    if (file) {
      setTitle((prev) => (prev.trim() ? prev : stripExtension(file.name)))
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setTitle('')
      setDescription('')
      setType('document')
      setStatusChoice('draft')
      setScheduleDate(undefined)
      setStagedFile(null)
      setIsDragging(false)
    }
  }, [open])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) applyFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) applyFile(file)
    e.target.value = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    if (statusChoice === 'scheduled' && !scheduleDate) return
    onSubmit({
      title: t,
      description: description.trim(),
      type,
      statusChoice,
      scheduledDate: statusChoice === 'scheduled' ? scheduleDate : undefined,
      file: stagedFile,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload new content</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Files</span>
              <input
                ref={inputRef}
                type="file"
                className="sr-only"
                aria-label="Choose file to upload"
                onChange={handleFileInputChange}
              />
              <button
                type="button"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/30 bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium">Drag and drop a file here</p>
                <p className="mt-1 text-xs text-muted-foreground">or click to browse (demo — file stays in browser only)</p>
              </button>
              {stagedFile && (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
                  <span className="min-w-0 truncate font-medium" title={stagedFile.name}>
                    {stagedFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    aria-label="Remove selected file"
                    onClick={(e) => {
                      e.stopPropagation()
                      setStagedFile(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <FloatLabel label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Description</span>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary for the library"
                rows={3}
                className="resize-y"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Type</span>
              <Select value={type} onValueChange={(v) => setType(v as ContentLibraryType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="tutorial">Tutorial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Status</span>
              <Select value={statusChoice} onValueChange={(v) => setStatusChoice(v as UploadFormStatusChoice)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {statusChoice === 'scheduled' && (
              <div className="space-y-1">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Publish on</span>
                <DatePicker
                  date={scheduleDate}
                  onDateChange={setScheduleDate}
                  placeholder="Pick a date"
                  aria-label="Scheduled publish date"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Demo only — the format column shows uploaded file size when a file is attached; otherwise it follows the
              content type default ({defaultFormatForType(type)}).
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || (statusChoice === 'scheduled' && !scheduleDate)}>
              Add to library
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
