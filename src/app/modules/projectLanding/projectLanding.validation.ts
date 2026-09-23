import { z } from "zod";

import { optionalUrl } from "../../utils/optionalUrl";
import { LANDING_PATCH_SECTIONS, LANDING_SECTIONS } from "./projectLanding.interface";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id")
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

const str = z.string().optional().nullable().transform((v) => v ?? undefined);

const flag = z
  .object({ visible: z.boolean().optional() })
  .optional();

const body = z
  .object({
    path: z
      .string()
      .min(1, "Landing path is required")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase slug, for example zoom-al-zahra"),
    isActive: z.boolean().optional(),
    facebookUrl: optionalUrl,
    phonePrimary: str,
    phoneSecondary: str,
    whatsapp: str,
    metaTitle: str,
    metaTitleBn: str,
    metaDescription: str,
    metaDescriptionBn: str,
    navEnquire: str,
    navEnquireBn: str,
    sections: z
      .object(
        Object.fromEntries(LANDING_SECTIONS.map((key) => [key, flag])) as Record<
          string,
          typeof flag
        >,
      )
      .optional(),
    hero: z.any().optional(),
    about: z.any().optional(),
    residences: z.any().optional(),
    elevation: z.any().optional(),
    films: z.any().optional(),
    amenities: z.any().optional(),
    gallery: z.any().optional(),
    location: z.any().optional(),
    process: z.any().optional(),
    cta: z.any().optional(),
    reviews: z.any().optional(),
    faq: z.any().optional(),
    enquire: z.any().optional(),
    custom: z.any().optional(),
  })
  .passthrough();

/** Publishing tab — path required; other meta optional. */
const publishingBody = z
  .object({
    path: z
      .string()
      .min(1, "Landing path is required")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use a lowercase slug, for example zoom-al-zahra",
      ),
    isActive: z.boolean().optional(),
    facebookUrl: optionalUrl,
    phonePrimary: str,
    phoneSecondary: str,
    whatsapp: str,
    metaTitle: str,
    metaTitleBn: str,
    metaDescription: str,
    metaDescriptionBn: str,
    navEnquire: str,
    navEnquireBn: str,
  })
  .passthrough();

/** Content section body = section fields + optional visible flag. */
const sectionBody = z
  .object({
    visible: z.boolean().optional(),
  })
  .passthrough();

const sectionParam = z.enum(
  LANDING_PATCH_SECTIONS as unknown as [string, ...string[]],
);

export const projectLandingValidation = {
  upsert: z.object({ body }),
  /** Body shape: publishing fields OR content section (+ optional visible). */
  patchSection: z.object({
    body: z.union([publishingBody, sectionBody]),
  }),
};

void objectId;
void sectionParam;
