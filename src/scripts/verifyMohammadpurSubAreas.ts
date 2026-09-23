import mongoose from "mongoose";

import config from "../app/config";
import { Area } from "../app/modules/area/area.model";
import { SubArea } from "../app/modules/subArea/subArea.model";

const run = async () => {
  await mongoose.connect(config.db_url as string);
  const db = mongoose.connection.name;
  console.log("DB:", db);

  const areas = await Area.find({
    isDeleted: { $ne: true },
    name: /mohammadpur/i,
  })
    .select("_id name slug isActive")
    .lean();

  console.log("Mohammadpur areas:", areas.length);
  for (const a of areas) {
    console.log("-", a.name, a.slug, String(a._id), "active=", a.isActive);
    const subs = await SubArea.find({
      area: a._id,
      isDeleted: { $ne: true },
    })
      .select("name slug isActive order")
      .sort({ order: 1 })
      .lean();
    console.log("  subAreas:", subs.length);
    for (const s of subs) {
      console.log("   ", s.order, s.name, s.slug, "active=", s.isActive);
    }
  }

  const total = await SubArea.countDocuments({ isDeleted: { $ne: true } });
  console.log("Total live SubAreas:", total);

  await mongoose.disconnect();
};

run().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
