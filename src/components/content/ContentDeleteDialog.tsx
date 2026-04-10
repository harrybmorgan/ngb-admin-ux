import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@wexinc-healthbenefits/ben-ui-kit'
import type { ContentLibraryItem } from '@/data/contentLibraryMockData'

export interface ContentDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ContentLibraryItem | null
  onConfirm: () => void
}

export function ContentDeleteDialog({ open, onOpenChange, item, onConfirm }: ContentDeleteDialogProps) {
  const titleText = item?.title ?? ''

  const description =
    item?.status === 'published'
      ? `This will remove "${titleText}" from the library. This action cannot be undone in this prototype. This item is published; removing it may affect what employees see in the portal.`
      : `This will remove "${titleText}" from the library. This action cannot be undone in this prototype.`

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete content?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              intent="destructive"
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
            >
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
