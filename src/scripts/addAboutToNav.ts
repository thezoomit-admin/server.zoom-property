import mongoose from "mongoose";

import config from "../app/config";
import { DynamicContent } from "../app/modules/dynamicContent/dynamicContent.model";

/**
 * Ensure navbar includes About (`/about`).
 *
 * Places it just before Contact when Contact exists; otherwise appends.
 * Idempotent — skips if an About /about row is already present.
 *
 *   npx ts-node src/scripts/addAboutToNav.ts
 */
const PREFIX = "nav.menu";
const GROUP = "headerFooter";

const ABOUT = {
  en: "About",
  bn: "আমাদের সম্পর্কে",
  href: "/about",
};

const run = async () => {
  if (!config.db_url) throw new Error("DB_URL is not set.");
  await mongoose.connect(config.db_url);

  const hrefRows = await DynamicContent.find({
    key: { $regex: `^${PREFIX}\\.\\d+\\.href\\.` },
  }).lean();

  const byIndex = new Map<
    number,
    { en?: string; bn?: string }
  >();

  for (const row of hrefRows) {
    const m = String(row.key).match(
      new RegExp(`^${PREFIX}\\.(\\d+)\\.href\\.(en|bn)$`),
    );
    if (!m) continue;
    const index = Number(m[1]);
    const locale = m[2] as "en" | "bn";
    const cur = byIndex.get(index) || {};
    cur[locale] = String(row.value || "");
    byIndex.set(index, cur);
  }

  for (const [index, hrefs] of byIndex) {
    const href = (hrefs.en || hrefs.bn || "").trim().toLowerCase();
    if (href === "/about" || href.endsWith("/about")) {
      console.log(`About already in nav at index ${index} — nothing to do.`);
      await mongoose.disconnect();
      return;
    }
  }

  let contactIndex: number | null = null;
  for (const [index, hrefs] of byIndex) {
    const href = (hrefs.en || hrefs.bn || "").trim().toLowerCase();
    if (href === "/contact" || href.endsWith("/contact")) {
      contactIndex = index;
      break;
    }
  }

  const maxIndex = byIndex.size
    ? Math.max(...Array.from(byIndex.keys()))
    : -1;

  // Prefer slot just before Contact; if that index is taken, append.
  let target =
    contactIndex != null ? contactIndex : maxIndex + 1;
  if (byIndex.has(target)) {
    target = maxIndex + 1;
  }

  const put = async (key: string, value: string) => {
    await DynamicContent.updateOne(
      { key },
      {
        $set: { key, value, group: GROUP, type: "text", isActive: true },
      },
      { upsert: true },
    );
  };

  await put(`${PREFIX}.${target}.label.en`, ABOUT.en);
  await put(`${PREFIX}.${target}.label.bn`, ABOUT.bn);
  await put(`${PREFIX}.${target}.href.en`, ABOUT.href);
  await put(`${PREFIX}.${target}.href.bn`, ABOUT.href);

  console.log(`Added About to nav.menu.${target} → ${ABOUT.href}`);
  await mongoose.disconnect();
};

run().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
