import { useRef, useState, type DragEvent } from 'react'
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { toast } from 'sonner'
import { GripVertical, Plus } from 'lucide-react'
import {
  ADDABLE_CUSTOM_COLUMN_TYPES,
  createCustomColumnConfig,
  getReportColumnLabel,
  type ReportColumnConfig,
  type ReportCustomColumnTypeId,
} from '@/lib/reportCustomization'
import { cn } from '@/lib/utils'

type ReportColumnEditorListProps = {
  columns: ReportColumnConfig[]
  onChange: (columns: ReportColumnConfig[]) => void
}

function moveIndex<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}

function reorderEnabledColumns(
  columns: ReportColumnConfig[],
  fromIndex: number,
  toIndex: number,
): ReportColumnConfig[] {
  const fromCol = columns[fromIndex]
  if (!fromCol?.enabled) return columns

  const enabled = columns.filter((c) => c.enabled)
  const disabled = columns.filter((c) => !c.enabled)

  const fromSub = enabled.findIndex((c) => c.id === fromCol.id)
  if (fromSub < 0) return columns

  let toSub: number
  if (toIndex < columns.length && columns[toIndex].enabled) {
    toSub = enabled.findIndex((c) => c.id === columns[toIndex].id)
  } else {
    toSub = enabled.length - 1
  }

  if (fromSub === toSub) return columns

  const nextEnabled = moveIndex(enabled, fromSub, toSub)
  return [...nextEnabled, ...disabled]
}

const layoutSpring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 28,
  mass: 0.8,
}

export function ReportColumnEditorList({ columns, onChange }: ReportColumnEditorListProps) {
  const reduceMotion = useReducedMotion()
  const dragSourceRef = useRef<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newColumnType, setNewColumnType] = useState<ReportCustomColumnTypeId>('text')
  const [newColumnName, setNewColumnName] = useState('')

  const toggleEnabled = (index: number, nextChecked: boolean) => {
    const col = columns[index]
    if (!col || nextChecked === col.enabled) return

    if (!nextChecked) {
      const enabledCount = columns.filter((c) => c.enabled).length
      if (enabledCount <= 1 && col.enabled) {
        toast.error('Keep at least one column.')
        return
      }
      const copy = [...columns]
      const [item] = copy.splice(index, 1)
      copy.push({ ...item, enabled: false })
      onChange(copy)
      return
    }

    const copy = [...columns]
    const [item] = copy.splice(index, 1)
    const enabledCount = copy.filter((c) => c.enabled).length
    copy.splice(enabledCount, 0, { ...item, enabled: true })
    onChange(copy)
  }

  const addCustomColumn = () => {
    const next = createCustomColumnConfig(newColumnType, newColumnName)
    const copy = [...columns]
    const enabledCount = copy.filter((c) => c.enabled).length
    copy.splice(enabledCount, 0, next)
    onChange(copy)
    setAddDialogOpen(false)
    setNewColumnName('')
    setNewColumnType('text')
    toast.success('Column added. Drag to reorder with other included columns.')
  }

  const clearDragState = () => {
    dragSourceRef.current = null
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragStart = (index: number) => (e: DragEvent) => {
    if (!columns[index]?.enabled) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
    dragSourceRef.current = index
    setDraggedIndex(index)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    clearDragState()
  }

  const handleDragOverItem = (index: number) => (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const from = dragSourceRef.current
    if (from !== null && index !== from) {
      setDragOverIndex(index)
    }
  }

  const handleDragOverList = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onDrop = (targetIndex: number) => (e: DragEvent) => {
    e.preventDefault()
    const from = Number(e.dataTransfer.getData('text/plain'))
    clearDragState()
    if (Number.isNaN(from) || from === targetIndex) return
    onChange(reorderEnabledColumns(columns, from, targetIndex))
  }

  const layoutTransition = reduceMotion ? { duration: 0.15 } : layoutSpring

  return (
    <div className="space-y-3">
      <LayoutGroup>
        <ul className="flex flex-col gap-1.5" onDragOver={handleDragOverList}>
          {columns.map((col, index) => {
            const defaultLabel = getReportColumnLabel(col)
            const layoutSafeId = col.id.replace(/[^a-zA-Z0-9_-]/g, '_')
            const isDragging = draggedIndex === index
            const isDropTarget =
              draggedIndex !== null &&
              dragOverIndex === index &&
              draggedIndex !== index

            return (
              <motion.li
                key={col.id}
                layout
                layoutId={`column-row-${layoutSafeId}`}
                transition={{ layout: layoutTransition }}
                onDragOver={handleDragOverItem(index)}
                onDrop={onDrop(index)}
                className={cn(
                  'relative flex min-w-0 items-center gap-1 rounded-lg border bg-[#f8f9fc]/80 p-1.5 pr-1',
                  'transition-[box-shadow,transform,opacity,border-color] duration-200 ease-out',
                  !col.enabled && 'opacity-70',
                  isDragging &&
                    'z-20 scale-[0.98] cursor-grabbing border-[#3958c3]/40 bg-white opacity-70 shadow-lg ring-2 ring-[#3958c3]/25',
                  !isDragging && col.enabled && 'border-[#e8ecf4] hover:border-[#3958c3]/30',
                  !isDragging && !col.enabled && 'border-[#e8ecf4]/80',
                  isDropTarget && 'ring-1 ring-[#3958c3]/35 ring-offset-1 ring-offset-[#f8f9fc]',
                )}
              >
                {isDropTarget && (
                  <motion.span
                    layoutId="drop-indicator"
                    className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-[#3958c3]"
                    initial={{ opacity: 0, scaleX: 0.85 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div
                  role="button"
                  tabIndex={0}
                  draggable={col.enabled}
                  onDragStart={handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'shrink-0 rounded p-1 text-[#9aa3bd]',
                    col.enabled
                      ? 'cursor-grab touch-none hover:bg-white hover:text-[#3958c3] active:cursor-grabbing'
                      : 'cursor-not-allowed opacity-50',
                  )}
                  aria-label={col.enabled ? 'Drag to reorder' : 'Enable column to reorder'}
                >
                  <GripVertical className="h-4 w-4" aria-hidden />
                </div>
                <Checkbox
                  checked={col.enabled}
                  onCheckedChange={(v) => toggleEnabled(index, v === true)}
                  className="shrink-0"
                  aria-label={`Include ${defaultLabel} in report`}
                />
                <div className="min-w-0 flex-1 py-0.5 pl-1.5">
                  <p
                    className={cn(
                      'text-sm font-medium leading-snug',
                      col.enabled ? 'text-[#14182c]' : 'text-[#5f6a94]',
                    )}
                  >
                    {defaultLabel}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </ul>
      </LayoutGroup>

      <Button
        type="button"
        variant="outline"
        className="mt-2 w-full rounded-xl border-[#d0d7e6] gap-2"
        onClick={() => setAddDialogOpen(true)}
      >
        <Plus className="h-4 w-4 shrink-0 text-[#3958c3]" aria-hidden />
        Add new column
      </Button>

      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open)
          if (!open) {
            setNewColumnName('')
            setNewColumnType('text')
          }
        }}
      >
        <DialogContent size="md" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add new column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="report-col-type" className="text-sm font-medium text-[#14182c]">
                Column type
              </Label>
              <Select
                value={newColumnType}
                onValueChange={(v) => setNewColumnType(v as ReportCustomColumnTypeId)}
              >
                <SelectTrigger id="report-col-type" className="w-full rounded-xl border-[#d0d7e6]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADDABLE_CUSTOM_COLUMN_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[#5f6a94]">
                Preview shows sample values; connect real data when this report is wired to your systems.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-col-name" className="text-sm font-medium text-[#14182c]">
                Column name
              </Label>
              <Input
                id="report-col-name"
                className="rounded-xl border-[#d0d7e6]"
                placeholder={
                  ADDABLE_CUSTOM_COLUMN_TYPES.find((t) => t.id === newColumnType)?.label ?? 'Column name'
                }
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" intent="primary" className="rounded-xl" onClick={addCustomColumn}>
              Add column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
