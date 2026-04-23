import { useFormContext, Controller } from "react-hook-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Label,
} from "@wexinc-healthbenefits/ben-ui-kit";
import { Upload } from "lucide-react";
import type { ThemingEngineFormValues } from "./schema";
import { BrandColorsTab } from "./BrandColorsTab";
import { StylesTab } from "./StylesTab";
import { cn } from "@/lib/utils";

const LOGO_ACCEPT = "image/png,image/svg+xml,.png,.svg";

export function ThemingEngineConfigPane({ embedded = false }: { embedded?: boolean }) {
  const { control } = useFormContext<ThemingEngineFormValues>();

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col space-y-4 overflow-y-auto px-6 py-5",
        embedded ? "h-full min-h-0 flex-1" : "h-full",
      )}
    >
      <p className="text-sm text-muted-foreground">
        Customize the application appearance.
      </p>

      <Accordion
        type="multiple"
        defaultValue={["brand-identity", "component-styling"]}
        className="w-full"
      >
        {/* Group 1: Brand Identity */}
        <AccordionItem value="brand-identity" className="border-border">
          <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
            Brand Identity
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-5">
              {/* Company logo upload */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">Company Logo</Label>
                <Controller
                  name="headerLogoFile"
                  control={control}
                  render={({ field: { onChange, value: _v, ref } }) => (
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 w-fit">
                      <Upload className="h-4 w-4" />
                      <span>Upload logo</span>
                      <input
                        ref={ref}
                        type="file"
                        accept={LOGO_ACCEPT}
                        className="sr-only"
                        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Max 400x100px, 2MB. PNG or SVG.
                </p>
              </div>

              {/* 6 Brand Color Pickers */}
              <BrandColorsTab />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Group 2: Component Styling */}
        <AccordionItem value="component-styling" className="border-border">
          <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
            Component Styling
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <StylesTab />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
