import { Schema, model } from "mongoose";
import { ISubArea } from "./subArea.interface";

const subAreaSchema = new Schema<ISubArea>(
  {
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    area: {
      type: Schema.Types.ObjectId,
      ref: "Area",
      required: true,
      index: true,
    },

    tagline: { type: String, trim: true },
    taglineBn: { type: String, trim: true },
    note: { type: String, trim: true },
    noteBn: { type: String, trim: true },

    image: { type: Schema.Types.ObjectId, ref: "Media" },

    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Same slug may exist in two areas; unique only within one parent.
subAreaSchema.index(
  { area: 1, slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

export const SubArea = model<ISubArea>("SubArea", subAreaSchema);
