import mongoose from "mongoose";

import config from "../app/config";
import { DynamicContent } from "../app/modules/dynamicContent/dynamicContent.model";

/**
 * Remove Properties catalogue links from header / footer CMS chrome.
 *
 * Clears any `nav.menu.*` / `footer.exploreLinks.*` row whose href is
 * `/properties` (label + href keys for both locales).
 *
 *   npx ts-node src/scripts/removePropertiesFromChrome.ts
 */
const PREFIXES = ["nav.menu", "footer.exploreLinks"] as const;

const isPropertiesHref = (value: unknown) => {
  const href = String(value || "")
    .trim()
    .split(/[?#]/)[0]
    .replace(/\/+$/, "")
    .toLowerCase();
  return (
    href === "/properties" ||
    href.endsWith("/properties") ||
    /^\/(en|bn)\/properties$/.test(href)
  );
};

const run = async () => {
  if (!config.db_url) throw new Error("DB_URL is not set.");
  await mongoose.connect(config.db_url);

  let removed = 0;

  for (const prefix of PREFIXES) {
    const hrefKeys = await DynamicContent.find({
      key: { $regex: `^${prefix}\\.\\d+\\.href\\.` },
    }).lean();

    for (const row of hrefKeys) {
      if (!isPropertiesHref(row.value)) continue;
      const match = String(row.key).match(
        new RegExp(`^(${prefix}\\.\\d+)\\.href\\.`),
      );
      if (!match) continue;
      const base = match[1];
      const res = await DynamicContent.deleteMany({
        key: { $regex: `^${base}\\.` },
      });
      removed += res.deletedCount || 0;
      console.log(`Removed chrome row: ${base}`);
    }
  }

  console.log(`Done. deleted ${removed} CMS key(s).`);
  await mongoose.disconnect();
};

run().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
