import { Schema, model } from "mongoose";
import { IBudgetRange } from "./budgetRange.interface";

const budgetRangeSchema = new Schema<IBudgetRange>(
  {
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, trim: true, default: "" },
    value: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

budgetRangeSchema.index({ order: 1, name: 1 });

export const BudgetRange = model<IBudgetRange>(
  "BudgetRange",
  budgetRangeSchema,
);
