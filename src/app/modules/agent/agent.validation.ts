import { z } from "zod";
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const createAgentZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    nameBn: z.string().optional(),
    role: z.string().optional(),
    roleBn: z.string().optional(),
    phone: z.string().optional(),
    patch: z.array(z.string()).optional(),
    deals: z.number().optional(),
    rating: z.number().optional(),
    respondsIn: z.number().optional(),
    image: objectId.optional().nullable(),
    languages: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateAgentZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    nameBn: z.string().optional(),
    role: z.string().optional(),
    roleBn: z.string().optional(),
    phone: z.string().optional(),
    patch: z.array(z.string()).optional(),
    deals: z.number().optional(),
    rating: z.number().optional(),
    respondsIn: z.number().optional(),
    image: objectId.optional().nullable(),
    languages: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});
