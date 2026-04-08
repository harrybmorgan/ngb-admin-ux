import { useFormContext } from "react-hook-form";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@wexinc-healthbenefits/ben-ui-kit";
import type {
  CardShadowOption,
  ChartPaletteOption,
  CornerRadiusOption,
  IconSetOption,
  ThemingEngineFormValues,
} from "./schema";
import { cn } from "@/lib/utils";

const ICON_SET_OPTIONS: { value: IconSetOption; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "duotone", label: "Duotone" },
];

const CORNER_OPTIONS: { value: CornerRadiusOption; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "soft", label: "Soft" },
  { value: "round", label: "Round" },
];

const CARD_SHADOW_OPTIONS: { value: CardShadowOption; label: string; description: string }[] = [
  { value: "flat", label: "Flat", description: "No shadow" },
  { value: "shadow", label: "Shadow", description: "Subtle drop shadow" },
];

const CHART_PALETTE_OPTIONS: { value: ChartPaletteOption; label: string }[] = [
  { value: "ocean", label: "Ocean (Blues/Teals)" },
  { value: "vibrant", label: "Vibrant (High Contrast)" },
  { value: "warm", label: "Warm (Oranges/Reds)" },
];

export function StylesTab() {
  const { register, watch, setValue } = useFormContext<ThemingEngineFormValues>();
  const globalCornerRadiusEnabled = watch("globalCornerRadiusEnabled");

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose the border styles in the portal.
      </p>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Icon Set</Label>
        <Select
          value={watch("iconSet")}
          onValueChange={(v) => setValue("iconSet", v as IconSetOption)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select icon set" />
          </SelectTrigger>
          <SelectContent>
            {ICON_SET_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Chart Palettes</Label>
        <p className="text-xs text-muted-foreground">
          Color-blind accessible palettes for Recharts in the preview. Brand colors do not apply to charts.
        </p>
        <div className="flex gap-2 flex-wrap">
          {CHART_PALETTE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                watch("chartPalette") === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-foreground hover:bg-muted/50"
              )}
            >
              <input
                type="radio"
                value={opt.value}
                className="sr-only"
                {...register("chartPalette")}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Card Shadow */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Card Shadow</Label>
        <p className="text-xs text-muted-foreground">
          Choose whether cards appear flat or with a subtle drop shadow.
        </p>
        <div className="flex gap-2 flex-wrap">
          {CARD_SHADOW_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                watch("cardShadow") === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-foreground hover:bg-muted/50"
              )}
            >
              <input
                type="radio"
                value={opt.value}
                className="sr-only"
                {...register("cardShadow")}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Corner Radius */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="global-corner-radius" className="text-sm font-medium text-foreground">
            Global Corner Radius
          </Label>
          <Switch
            id="global-corner-radius"
            checked={globalCornerRadiusEnabled}
            onCheckedChange={(checked) => setValue("globalCornerRadiusEnabled", checked)}
          />
        </div>

        {globalCornerRadiusEnabled ? (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Choose the border radius for all components.
            </Label>
            <div className="flex gap-2 flex-wrap">
              {CORNER_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    watch("globalCornerRadius") === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-background text-foreground hover:bg-muted/50"
                  )}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    className="sr-only"
                    {...register("globalCornerRadius")}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pl-0">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Card style</Label>
              <p className="text-xs text-muted-foreground">Choose the border radius for the cards.</p>
              <div className="flex gap-2 flex-wrap">
                {CORNER_OPTIONS.map((opt) => (
                  <label
                    key={`card-${opt.value}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      watch("cardRadius") === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-background text-foreground hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      className="sr-only"
                      {...register("cardRadius")}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Button style</Label>
              <p className="text-xs text-muted-foreground">
                Choose the border radius for the buttons.
              </p>
              <div className="flex gap-2 flex-wrap">
                {CORNER_OPTIONS.map((opt) => (
                  <label
                    key={`button-${opt.value}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      watch("buttonRadius") === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-background text-foreground hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      className="sr-only"
                      {...register("buttonRadius")}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Input style</Label>
              <p className="text-xs text-muted-foreground">
                Choose the border radius for the input fields.
              </p>
              <div className="flex gap-2 flex-wrap">
                {CORNER_OPTIONS.map((opt) => (
                  <label
                    key={`input-${opt.value}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      watch("inputRadius") === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-background text-foreground hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      className="sr-only"
                      {...register("inputRadius")}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
