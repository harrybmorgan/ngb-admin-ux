import { z } from "zod";

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const cornerRadiusOptions = ["square", "soft", "round"] as const;
const cardShadowOptions = ["flat", "shadow"] as const;
const iconSetOptions = ["solid", "outline", "duotone"] as const;
const chartPaletteOptions = ["ocean", "vibrant", "warm"] as const;

/**
 * The 6 user-configurable brand color fields.
 * These are the ONLY colors an admin can set. See src/requirements/theming-variables.md.
 */
export const brandColorsSchema = z.object({
  primary:      z.string().regex(hexColorRegex).default("#0073C2"),
  secondary:    z.string().regex(hexColorRegex).default("#E2E5EA"),
  pageBg:       z.string().regex(hexColorRegex).default("#F7F7F7"),
  headerBg:     z.string().regex(hexColorRegex).default("#253746"),
  headerText:   z.string().regex(hexColorRegex).default("#FFFFFF"),
  illustration: z.string().regex(hexColorRegex).default("#0EA5E9"),
});

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_ALLOWED_TYPES = ["image/png", "image/svg+xml"] as const;

export const themingEngineSchema = z
  .object({
    headerLogoFile: z.union([z.instanceof(File), z.null()]).optional(),
    brandColors: brandColorsSchema,
    chartPalette: z.enum(chartPaletteOptions).default("ocean"),
    iconSet: z.enum(iconSetOptions).default("outline"),
    globalCornerRadiusEnabled: z.boolean().default(true),
    globalCornerRadius: z.enum(cornerRadiusOptions).default("soft"),
    cardRadius: z.enum(cornerRadiusOptions).default("soft"),
    buttonRadius: z.enum(cornerRadiusOptions).default("soft"),
    inputRadius: z.enum(cornerRadiusOptions).default("soft"),
    cardShadow: z.enum(cardShadowOptions).default("shadow"),
  })
  .refine(
    (data) => {
      const file = data.headerLogoFile;
      if (file == null || !(file instanceof File)) return true;
      return file.size <= LOGO_MAX_BYTES && LOGO_ALLOWED_TYPES.includes(file.type as (typeof LOGO_ALLOWED_TYPES)[number]);
    },
    { message: "Logo must be PNG or SVG and max 2MB.", path: ["headerLogoFile"] }
  );

/** Schema for validating imported theme JSON (no File; headerLogoFile null/undefined). */
export const themingEngineImportSchema = z.object({
  headerLogoFile: z.union([z.null(), z.undefined()]).optional(),
  brandColors: brandColorsSchema,
  chartPalette: z.enum(chartPaletteOptions).default("ocean"),
  iconSet: z.enum(iconSetOptions).default("outline"),
  globalCornerRadiusEnabled: z.boolean().default(true),
  globalCornerRadius: z.enum(cornerRadiusOptions).default("soft"),
  cardRadius: z.enum(cornerRadiusOptions).default("soft"),
  buttonRadius: z.enum(cornerRadiusOptions).default("soft"),
  inputRadius: z.enum(cornerRadiusOptions).default("soft"),
  cardShadow: z.enum(cardShadowOptions).default("shadow"),
});

/** Serializable theme payload for export; headerLogoFile is omitted or null (File cannot be serialized). */
export type ThemingEngineExportPayload = Omit<ThemingEngineFormValues, "headerLogoFile"> & {
  headerLogoFile?: null;
};

export type BrandColors = z.infer<typeof brandColorsSchema>;
export type ThemingEngineFormValues = z.infer<typeof themingEngineSchema>;
export type CornerRadiusOption = (typeof cornerRadiusOptions)[number];
export type CardShadowOption = (typeof cardShadowOptions)[number];
export type IconSetOption = (typeof iconSetOptions)[number];
export type ChartPaletteOption = (typeof chartPaletteOptions)[number];

const defaultBrandColors: BrandColors = {
  primary:      "#0073C2",
  secondary:    "#E2E5EA",
  pageBg:       "#F7F7F7",
  headerBg:     "#253746",
  headerText:   "#FFFFFF",
  illustration: "#0EA5E9",
};

export const defaultThemingEngineValues: ThemingEngineFormValues = {
  headerLogoFile: undefined,
  brandColors: defaultBrandColors,
  chartPalette: "ocean",
  iconSet: "outline",
  globalCornerRadiusEnabled: true,
  globalCornerRadius: "soft",
  cardRadius: "soft",
  buttonRadius: "soft",
  inputRadius: "soft",
  cardShadow: "shadow",
};
