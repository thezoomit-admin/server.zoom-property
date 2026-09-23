import mongoose from "mongoose";
import slugify from "slugify";

import config from "../app/config";
import { Area } from "../app/modules/area/area.model";
import { SubArea } from "../app/modules/subArea/subArea.model";

/**
 * Merge every Mohammadpur duplicate's sub-areas onto canonical `mohammadpur`,
 * then soft-delete the duplicate area rows so admin/frontend share one record.
 *
 *   npx ts-node src/scripts/mergeMohammadpurDuplicates.ts
 */
const live = { isDeleted: { $ne: true } };

const run = async () => {
  await mongoose.connect(config.db_url as string);
  console.log("DB:", mongoose.connection.name);

  const areas = await Area.find({
    ...live,
    name: /^mohammadpur$/i,
  }).sort({ createdAt: 1 });

  if (!areas.length) throw new Error("No Mohammadpur area");

  const canonical =
    areas.find((a) => a.slug === "mohammadpur") || areas[0];

  await Area.findByIdAndUpdate(canonical._id, {
    $set: {
      slug: "mohammadpur",
      isActive: true,
      isHome: true,
      featured: true,
      isDeleted: false,
    },
  });

  console.log(`Canonical: ${canonical._id} (${canonical.slug})`);

  let moved = 0;
  for (const dup of areas) {
    if (String(dup._id) === String(canonical._id)) continue;

    const subs = await SubArea.find({ area: dup._id, ...live });
    for (const sub of subs) {
      const base =
        slugify(sub.name, { lower: true, strict: true }) || sub.slug;
      let slug = base;
      let n = 1;
      for (;;) {
        const clash = await SubArea.findOne({
          area: canonical._id,
          slug,
          ...live,
          _id: { $ne: sub._id },
        }).select("_id");
        if (!clash) break;
        // Same name already on canonical — skip duplicate row
        if (clash && n === 1) {
          const sameName = await SubArea.findOne({
            area: canonical._id,
            name: sub.name,
            ...live,
          }).select("_id");
          if (sameName) {
            await SubArea.findByIdAndUpdate(sub._id, {
              $set: { isDeleted: true, isActive: false },
            });
            console.log(`  skip (exists): ${sub.name}`);
            slug = "";
            break;
          }
        }
        n += 1;
        slug = `${base}-${n}`;
      }
      if (!slug) continue;

      const maxOrder = await SubArea.findOne({ area: canonical._id, ...live })
        .sort({ order: -1 })
        .select("order");
      const order =
        typeof maxOrder?.order === "number" ? maxOrder.order + 1 : 1;

      await SubArea.findByIdAndUpdate(sub._id, {
        $set: {
          area: canonical._id,
          slug,
          order,
          isActive: true,
          isDeleted: false,
        },
      });
      moved += 1;
      console.log(`  moved: ${sub.name} → canonical`);
    }

    await Area.findByIdAndUpdate(dup._id, {
      $set: { isDeleted: true, isActive: false, isHome: false },
    });
    console.log(`Soft-deleted duplicate area: ${dup.slug} (${dup._id})`);
  }

  const finalSubs = await SubArea.find({
    area: canonical._id,
    ...live,
  })
    .select("name order")
    .sort({ order: 1 })
    .lean();

  console.log(`\nMoved ${moved}. Canonical now has ${finalSubs.length} sub-areas:`);
  for (const s of finalSubs) {
    console.log(`  ${s.order}. ${s.name}`);
  }

  await mongoose.disconnect();
};

run().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
