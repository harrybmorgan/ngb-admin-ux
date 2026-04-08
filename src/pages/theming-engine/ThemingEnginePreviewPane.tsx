import { useLayoutEffect, useRef, useState } from "react";
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
/** Logical width the dashboard is composed for; scale down when the pane is narrower. */
const PREVIEW_REFERENCE_WIDTH_PX = 1040;
const PREVIEW_HORIZONTAL_INSET_PX = 20;

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

export function ThemingEnginePreviewPane({ embedded = false }: { embedded?: boolean }) {
  const { watch } = useFormContext<ThemingEngineFormValues>();
  const values = watch() as ThemingEngineFormValues | undefined;
  const { activeColorKey } = useThemingEngineHighlight();
  const [darkMode, setDarkMode] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const themeVars = values ? themeToCssVars(values, darkMode) : {};
  const style = { ...themeVars, zoom: previewZoom } as React.CSSProperties;
  const showHighlight = activeColorKey != null;

  useLayoutEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const update = () => {
      const w = node.clientWidth;
      if (w <= 0) return;
      const available = Math.max(160, w - PREVIEW_HORIZONTAL_INSET_PX);
      const z = Math.min(1, Math.max(0.48, available / PREVIEW_REFERENCE_WIDTH_PX));
      setPreviewZoom(z);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
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
        ref={viewportRef}
        className={cn(
          "box-border min-h-0 flex-1 overflow-x-hidden px-2.5 transition-colors",
          embedded ? "overflow-y-auto" : "overflow-auto",
          darkMode && "dark bg-zinc-900",
        )}
      >
        <div
          className={cn(
            "mx-auto box-border min-h-full min-w-0 bg-background text-foreground",
            darkMode && "bg-zinc-800 text-zinc-100",
          )}
          style={{
            ...style,
            width: PREVIEW_REFERENCE_WIDTH_PX,
          }}
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
