import { z } from "zod";

const create = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    nameBn: z.string().max(120).optional(),
    value: z.string().min(1).max(80).optional(),
    order: z.number().int().min(0).max(9999).optional(),
    isActive: z.boolean().optional(),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    nameBn: z.string().max(120).optional(),
    value: z.string().min(1).max(80).optional(),
    order: z.number().int().min(0).max(9999).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const BudgetRangeValidation = { create, update };
