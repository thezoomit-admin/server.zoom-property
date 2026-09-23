import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const subAreaFields = {
  name: z.string().min(1, "Name is required"),
  nameBn: z.string().optional(),
  area: objectId,

  tagline: z.string().optional(),
  taglineBn: z.string().optional(),
  note: z.string().optional(),
  noteBn: z.string().optional(),

  image: objectId.optional().nullable(),

  order: z.number().optional(),
  isActive: z.boolean().optional(),
};

export const subAreaValidation = {
  create: z.object({ body: z.object(subAreaFields) }),
  update: z.object({
    body: z.object({ ...subAreaFields, area: objectId.optional() }).partial(),
  }),
};
