import { useRef } from "react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Separator, toast } from "@wexinc-healthbenefits/ben-ui-kit";
import { RotateCcw, Download, FileUp } from "lucide-react";
import type { ThemingEngineFormValues, ThemingEngineExportPayload } from "./schema";
import { defaultThemingEngineValues, themingEngineImportSchema } from "./schema";

const EDITING_THEME_FOR = "Acme Corp (Employer Instance)";
const THEME_EXPORT_FILENAME = "theme-export.json";

export function ThemingEngineTopBar() {
  const { handleSubmit, reset, getValues } = useFormContext<ThemingEngineFormValues>();
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement>(null);

  const onReset = () => {
    reset(defaultThemingEngineValues);
  };

  const onSubmit = (data: ThemingEngineFormValues) => {
    void data;
    toast.success("Theme published successfully.");
  };

  const onExport = () => {
    const values = getValues();
    const payload: ThemingEngineExportPayload = { ...values, headerLogoFile: null };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = THEME_EXPORT_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text) as unknown;
        const result = themingEngineImportSchema.safeParse(parsed);
        if (!result.success) {
          toast.error("Invalid theme file. Please use a valid theme export JSON.");
          return;
        }
        reset({ ...result.data, headerLogoFile: undefined });
        toast.success("Theme imported successfully.");
      } catch {
        toast.error("Invalid theme file. Could not parse JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="shrink-0 border-b border-border bg-background px-6 py-3">
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        aria-hidden
        onChange={onImportFile}
      />
      <div className="flex items-center gap-4">
        {/* Left: context + title */}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
            Appearance
          </h1>
          <Badge intent="default" className="w-fit text-xs font-medium text-muted-foreground">
            Editing Theme for: {EDITING_THEME_FOR}
          </Badge>
        </div>

        {/* Right: actions */}
        <div className="ml-auto flex items-center gap-1">
          {/* Low-prominence utility actions */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-1.5 text-muted-foreground"
            title="Reset to system default"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => importInputRef.current?.click()}
            className="gap-1.5 text-muted-foreground"
            title="Upload a theme JSON file"
          >
            <FileUp className="h-4 w-4" />
            Upload Theme
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onExport}
            className="gap-1.5 text-muted-foreground"
            title="Download theme as JSON"
          >
            <Download className="h-4 w-4" />
            Download Theme
          </Button>

          {/* Separator */}
          <Separator orientation="vertical" className="mx-1 h-5" />

          {/* Primary navigation actions */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" onClick={handleSubmit(onSubmit)}>
            Publish Theme
          </Button>
        </div>
      </div>
    </header>
  );
}
