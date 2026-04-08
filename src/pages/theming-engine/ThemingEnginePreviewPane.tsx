import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@wexinc-healthbenefits/ben-ui-kit";
import { Moon, Sun } from "lucide-react";
import type { BrandColors } from "./schema";
import type { ThemingEngineFormValues } from "./schema";
import { themeToCssVars } from "./themeToCssVars";
import { useThemingEngineHighlight } from "./ThemingEngineHighlightContext";
import { MemberDashboardPreview } from "./MemberDashboardPreview";
import { cn } from "@/lib/utils";

function getHighlightStyle(activeColorKey: keyof BrandColors): string {
  const selector = `[data-theming-preview] [data-theme-token="${activeColorKey}"]`;
  return `
  @keyframes theming-highlight-pulse {
    0%, 100% { box-shadow: 0 0 0 2px rgb(59 130 246); opacity: 1; }
    50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6); opacity: 0.9; }
  }
  ${selector} {
    outline: none;
    animation: theming-highlight-pulse 1.5s ease-in-out infinite;
    border-radius: var(--radius, 6px);
  }
`;
}

/**
 * Scoped CSS that applies radius and shadow only to cards, action buttons, and inputs.
 *
 * We use data-preview-button instead of a plain "button" selector because Radix UI
 * renders Tabs triggers, Checkboxes, Switches, RadioGroup items, and Stepper steps
 * all as <button> elements. Targeting all buttons would change their radius too.
 *
 * We intentionally do NOT touch --radius globally because it flows into every
 * Tailwind rounded-* utility (rounded-sm/md/lg are all calc(var(--radius) ± Xpx)),
 * which would alter every component in the preview.
 */
const PREVIEW_SCOPED_STYLE = `
  [data-theming-preview] [data-preview-card] {
    border-radius: var(--preview-card-radius, 8px) !important;
    box-shadow: var(--theme-card-shadow, 0 1px 3px 0 rgb(0 0 0 / 0.1)) !important;
  }
  [data-theming-preview] [data-preview-button] {
    border-radius: var(--preview-button-radius, 8px) !important;
  }
  [data-theming-preview] input,
  [data-theming-preview] [role="combobox"],
  [data-theming-preview] textarea {
    border-radius: var(--preview-input-radius, 8px) !important;
  }
`;

export function ThemingEnginePreviewPane() {
  const { watch } = useFormContext<ThemingEngineFormValues>();
  const values = watch() as ThemingEngineFormValues | undefined;
  const { activeColorKey } = useThemingEngineHighlight();
  const [darkMode, setDarkMode] = useState(false);
  const themeVars = values ? themeToCssVars(values, darkMode) : {};
  const style = { ...themeVars } as React.CSSProperties;
  const showHighlight = activeColorKey != null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-border bg-background">
        <h2 className="text-lg font-display font-semibold text-foreground">Preview</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDarkMode((d) => !d)}
          className="gap-2"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {darkMode ? "Light" : "Dark"}
        </Button>
      </div>
      <div
        className={cn(
          "flex-1 min-h-0 overflow-auto transition-colors",
          darkMode && "dark bg-zinc-900"
        )}
      >
        <div
          className={cn(
            "min-h-full bg-background text-foreground",
            darkMode && "bg-zinc-800 text-zinc-100"
          )}
          style={style}
          data-theming-preview
        >
          <style dangerouslySetInnerHTML={{ __html: PREVIEW_SCOPED_STYLE }} />
          {showHighlight && activeColorKey && (
            <style dangerouslySetInnerHTML={{ __html: getHighlightStyle(activeColorKey) }} />
          )}
          <MemberDashboardPreview />
        </div>
      </div>
    </div>
  );
}
