import mongoose from "mongoose";

import config from "../app/config";
import { Area } from "../app/modules/area/area.model";
import { SubArea } from "../app/modules/subArea/subArea.model";

/**
 * Soft-deletes every sub-area under Mohammadpur (undoes seedMohammadpurSubAreas.ts).
 *
 *   npx ts-node src/scripts/removeMohammadpurSubAreas.ts
 */
const run = async () => {
  const uri = config.db_url as string;
  if (!uri) throw new Error("DB_URL / db_url missing");

  await mongoose.connect(uri);
  console.log("Connected.");

  const area = await Area.findOne({
    isDeleted: { $ne: true },
    $or: [{ slug: "mohammadpur" }, { name: /^mohammadpur$/i }],
  });

  if (!area) {
    console.log("No Mohammadpur area found, nothing to do.");
    await mongoose.disconnect();
    return;
  }

  const res = await SubArea.updateMany(
    { area: area._id, isDeleted: { $ne: true } },
    { $set: { isDeleted: true } },
  );

  console.log(`Soft-deleted ${res.modifiedCount} sub-area(s) under ${area.name}.`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
