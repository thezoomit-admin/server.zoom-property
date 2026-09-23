import mongoose from "mongoose";

import config from "../app/config";
import { DynamicContent } from "../app/modules/dynamicContent/dynamicContent.model";

/**
 * Put About just before Contact in the navbar order.
 *
 *   npx ts-node src/scripts/orderAboutBeforeContact.ts
 */
const PREFIX = "nav.menu";
const GROUP = "headerFooter";

const run = async () => {
  await mongoose.connect(config.db_url as string);

  const rows = await DynamicContent.find({
    key: { $regex: `^${PREFIX}\\.` },
  }).lean();

  const byIndex = new Map<number, Record<string, string>>();
  for (const row of rows) {
    const m = String(row.key).match(
      new RegExp(`^${PREFIX}\\.(\\d+)\\.(label|href)\\.(en|bn)$`),
    );
    if (!m) continue;
    const index = Number(m[1]);
    const field = `${m[2]}.${m[3]}`;
    const cur = byIndex.get(index) || {};
    cur[field] = String(row.value || "");
    byIndex.set(index, cur);
  }

  let aboutIdx: number | null = null;
  let contactIdx: number | null = null;
  for (const [index, fields] of byIndex) {
    const href = (fields["href.en"] || fields["href.bn"] || "")
      .trim()
      .toLowerCase();
    if (href === "/about" || href.endsWith("/about")) aboutIdx = index;
    if (href === "/contact" || href.endsWith("/contact")) contactIdx = index;
  }

  if (aboutIdx == null || contactIdx == null) {
    console.log("About or Contact missing — skip reorder.", {
      aboutIdx,
      contactIdx,
    });
    await mongoose.disconnect();
    return;
  }

  if (aboutIdx < contactIdx) {
    console.log(`Already ordered (About ${aboutIdx} < Contact ${contactIdx}).`);
    await mongoose.disconnect();
    return;
  }

  // Swap the two slots so About sits where Contact was and Contact moves to About's slot.
  const about = byIndex.get(aboutIdx)!;
  const contact = byIndex.get(contactIdx)!;

  const write = async (index: number, fields: Record<string, string>) => {
    for (const [field, value] of Object.entries(fields)) {
      const key = `${PREFIX}.${index}.${field}`;
      await DynamicContent.updateOne(
        { key },
        { $set: { key, value, group: GROUP, type: "text", isActive: true } },
        { upsert: true },
      );
    }
  };

  await write(contactIdx, about);
  await write(aboutIdx, contact);
  console.log(`Swapped: About → ${contactIdx}, Contact → ${aboutIdx}`);

  await mongoose.disconnect();
};

run().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
