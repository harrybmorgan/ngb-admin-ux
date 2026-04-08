/**
 * Lightweight chrome for the employee-portal preview inside the branding / theming flow.
 */
export function MemberPortalPreviewChrome() {
  return (
    <header className="border-b border-border bg-card px-4 py-3">
      <div className="mx-auto flex w-full max-w-full min-w-0 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Employee portal preview</span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Live preview
          </span>
        </div>
        <nav className="hidden gap-4 text-sm text-muted-foreground sm:flex">
          <span>Home</span>
          <span>Accounts</span>
          <span>Claims</span>
        </nav>
      </div>
    </header>
  );
}
