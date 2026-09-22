import mongoose from "mongoose";

import config from "../app/config";
import { Area } from "../app/modules/area/area.model";
import { Project } from "../app/modules/project/project.model";
import { Property } from "../app/modules/property/property.model";
import { compactSerials } from "../app/shared/serial";

/**
 * Rewrites live Area / Project / Property serials to unique 1, 2, 3…
 *
 * Safe to run more than once.
 *
 *   npm run migrate:serials
 */
const run = async () => {
  if (!config.db_url) {
    throw new Error("DB_URL is not set — nothing to migrate against.");
  }

  await mongoose.connect(config.db_url);
  console.log("🛢  Connected to database");

  const jobs = [
    ["Areas", Area],
    ["Projects", Project],
    ["Properties", Property],
  ] as const;

  for (const [label, model] of jobs) {
    const { total, moved } = await compactSerials(model);
    const last = total ? total : 0;
    console.log(
      moved
        ? `✅ ${label}: ${moved} of ${total} resequenced to 1…${last}`
        : `✅ ${label}: already sequential (${total ? `1…${last}` : "empty"})`
    );
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("❌ Migration failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
