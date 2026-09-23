import { Document, Types } from "mongoose";

/**
 * A neighbourhood pocket inside an Area.
 *
 * Areas are the big labels people search first ("Mohammadpur"). Sub-areas are
 * the streets and pockets under them ("Pc Culture", "Town Hall") that the desk
 * uses to group projects and gate the lead capture before showing inventory.
 */
export interface ISubArea extends Document {
  name: string;
  nameBn?: string;
  /** URL segment under `/areas/[areaSlug]/[slug]`. Unique per parent area. */
  slug: string;
  area: Types.ObjectId;

  tagline?: string;
  taglineBn?: string;
  note?: string;
  noteBn?: string;

  image?: Types.ObjectId;

  order: number;
  isActive: boolean;
  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
