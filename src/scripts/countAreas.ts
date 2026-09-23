import mongoose from "mongoose";

import config from "../app/config";
import { Area } from "../app/modules/area/area.model";

const run = async () => {
  await mongoose.connect(config.db_url as string);
  const live = await Area.find({ isDeleted: { $ne: true } })
    .select("name slug isActive isHome")
    .lean();
  console.log("live total:", live.length);
  for (const a of live) {
    console.log(
      `- ${a.name} | ${a.slug} | active=${a.isActive} | home=${a.isHome}`,
    );
  }
  console.log(
    "active:",
    live.filter((a) => a.isActive !== false).length,
  );
  console.log(
    "isHome+active:",
    live.filter((a) => a.isHome && a.isActive !== false).length,
  );
  await mongoose.disconnect();
};

run().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
