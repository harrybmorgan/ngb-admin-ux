import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@wexinc-healthbenefits/ben-ui-kit'
import { FileText, Film, GraduationCap, Upload } from 'lucide-react'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { AdminFooter } from '@/components/layout/AdminFooter'
import { CONTENT_ITEMS } from '@/data/adminMockData'

export default function ContentPage() {
  const [tab, setTab] = useState<'document' | 'video' | 'tutorial'>('document')

  const items = CONTENT_ITEMS.filter((c) => c.type === tab)

  return (
    <div className="admin-app-bg flex min-h-screen flex-col font-sans">
      <AdminNavigation />
      <main className="mx-auto w-full max-w-[1000px] flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content management</h1>
          <p className="text-sm text-muted-foreground">
            Documents, videos, and tutorials you can publish to the employee portal.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
            <TabsTrigger value="document" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-2">
              <Film className="h-4 w-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="tutorial" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Tutorials
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-6 space-y-6">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Drag & drop upload</CardTitle>
                <CardDescription>PDF, DOCX, MP4, SCORM zip — prototype drop target.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center hover:bg-muted/50">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop files here or browse</p>
                  <p className="text-xs text-muted-foreground">Max 500 MB per file (demo)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Library</CardTitle>
                <CardDescription>Items tagged for {tab}s.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.size}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm">
                      Replace
                    </Button>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground">No items yet for this type.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <AdminFooter />
    </div>
  )
}
