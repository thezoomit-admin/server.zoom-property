import mongoose from "mongoose";

import config from "../app/config";
import { Project } from "../app/modules/project/project.model";

/**
 * Moves existing projects onto the Upcoming / Running / Completed vocabulary.
 *
 * Rows written before the change may still carry Planning / Processing or
 * older construction labels. Normalize them so the new enum can read and save
 * every project and the website's status filters return consistent results.
 *
 * Planning becomes Upcoming, and all construction-stage labels become
 * Running. Completed remains unchanged.
 *
 * Safe to run more than once — a row already on a new stage matches nothing.
 *
 *   npm run migrate:project-stages
 */
const STAGE_MAP: Record<string, string> = {
  Planning: "Upcoming",
  planning: "Upcoming",
  Processing: "Running",
  processing: "Running",
  "Under Construction": "Running",
  "under construction": "Running",
  "In Progress": "Running",
  "in progress": "Running",
  Piling: "Running",
  Structure: "Running",
  Finishing: "Running",
  "Handover ready": "Completed",
};

const run = async () => {
  if (!config.db_url) {
    throw new Error("DB_URL is not set — nothing to migrate against.");
  }

  await mongoose.connect(config.db_url);
  console.log("🛢  Connected to database");

  let moved = 0;
  for (const [from, to] of Object.entries(STAGE_MAP)) {
    const res = await Project.updateMany({ stage: from }, { $set: { stage: to } });
    if (res.modifiedCount) {
      console.log(`   ${from} → ${to}: ${res.modifiedCount}`);
      moved += res.modifiedCount;
    }
  }

  // Anything else — a blank stage, or a word from some older list — starts at
  // the beginning rather than being guessed at.
  const stranded = await Project.updateMany(
    { stage: { $nin: ["Upcoming", "Running", "Completed"] } },
    { $set: { stage: "Upcoming" } }
  );
  if (stranded.modifiedCount) {
    console.log(`   unrecognised → Upcoming: ${stranded.modifiedCount}`);
    moved += stranded.modifiedCount;
  }

  console.log(moved ? `✅ ${moved} project(s) updated` : "✅ Nothing to update");
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("❌ Migration failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
