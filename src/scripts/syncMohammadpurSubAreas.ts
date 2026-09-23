import mongoose from "mongoose";
import slugify from "slugify";

import config from "../app/config";
import { Area } from "../app/modules/area/area.model";
import { SubArea } from "../app/modules/subArea/subArea.model";

/**
 * Ensure every live "Mohammadpur" area has the 10 Bus Stand / housing
 * sub-areas, then deactivate duplicate Mohammadpur rows so the site/admin
 * only use the canonical `mohammadpur` slug.
 *
 *   npx ts-node src/scripts/syncMohammadpurSubAreas.ts
 */
const SUB_AREAS: {
  name: string;
  nameBn: string;
  tagline: string;
  taglineBn: string;
}[] = [
  {
    name: "Mohammadpur Bus Stand",
    nameBn: "মোহাম্মদপুর বাস স্ট্যান্ড",
    tagline: "Main bus stand & surrounding flats",
    taglineBn: "মূল বাস স্ট্যান্ড ও আশপাশের ফ্ল্যাট",
  },
  {
    name: "Town Hall",
    nameBn: "টাউন হল",
    tagline: "Town Hall road housing",
    taglineBn: "টাউন হল রোড হাউজিং",
  },
  {
    name: "PC Culture Housing",
    nameBn: "পিসি কালচার হাউজিং",
    tagline: "PC Culture residential blocks",
    taglineBn: "পিসি কালচার আবাসিক ব্লক",
  },
  {
    name: "Japan Garden City",
    nameBn: "জাপান গার্ডেন সিটি",
    tagline: "Japan Garden City apartments",
    taglineBn: "জাপান গার্ডেন সিটি অ্যাপার্টমেন্ট",
  },
  {
    name: "Adabor Housing",
    nameBn: "আদাবর হাউজিং",
    tagline: "Adabor side of Mohammadpur",
    taglineBn: "মোহাম্মদপুরের আদাবর পাশ",
  },
  {
    name: "Bosila",
    nameBn: "বসিলা",
    tagline: "Bosila residential pocket",
    taglineBn: "বসিলা আবাসিক এলাকা",
  },
  {
    name: "Tajmahal Road",
    nameBn: "তাজমহল রোড",
    tagline: "Tajmahal Road flats",
    taglineBn: "তাজমহল রোডের ফ্ল্যাট",
  },
  {
    name: "Humayun Road",
    nameBn: "হুমায়ুন রোড",
    tagline: "Humayun Road housing",
    taglineBn: "হুমায়ুন রোড হাউজিং",
  },
  {
    name: "Asad Avenue",
    nameBn: "আসাদ অ্যাভিনিউ",
    tagline: "Asad Avenue & Asad Gate side",
    taglineBn: "আসাদ অ্যাভিনিউ ও আসাদ গেট পাশ",
  },
  {
    name: "Ring Road Housing",
    nameBn: "রিং রোড হাউজিং",
    tagline: "Ring Road / Chad Uddan side flats",
    taglineBn: "রিং রোড / চাঁদ উদ্যান পাশের ফ্ল্যাট",
  },
];

const live = { isDeleted: { $ne: true } };

const ensureSubs = async (areaId: mongoose.Types.ObjectId) => {
  let created = 0;
  for (let i = 0; i < SUB_AREAS.length; i += 1) {
    const row = SUB_AREAS[i];
    const slug =
      slugify(row.name, { lower: true, strict: true }) || `sub-area-${i + 1}`;
    const existing = await SubArea.findOne({
      area: areaId,
      slug,
      ...live,
    }).select("_id");
    if (existing) continue;
    await SubArea.create({
      name: row.name,
      nameBn: row.nameBn,
      slug,
      area: areaId,
      tagline: row.tagline,
      taglineBn: row.taglineBn,
      order: i + 1,
      isActive: true,
    });
    created += 1;
  }
  return created;
};

const run = async () => {
  await mongoose.connect(config.db_url as string);
  console.log("DB:", mongoose.connection.name);

  const areas = await Area.find({
    ...live,
    name: /^mohammadpur$/i,
  }).sort({ createdAt: 1 });

  if (!areas.length) {
    throw new Error("No Mohammadpur area found");
  }

  // Canonical = slug mohammadpur, else oldest
  let canonical =
    areas.find((a) => a.slug === "mohammadpur") || areas[0];

  await Area.findByIdAndUpdate(canonical._id, {
    $set: {
      name: "Mohammadpur",
      nameBn: "মোহাম্মদপুর",
      slug: "mohammadpur",
      isActive: true,
      isHome: true,
      featured: true,
    },
  });

  const createdOnCanonical = await ensureSubs(
    canonical._id as mongoose.Types.ObjectId,
  );
  console.log(
    `Canonical: ${canonical.slug} (${canonical._id}) +${createdOnCanonical} new subs`,
  );

  // Deactivate duplicate Mohammadpur rows so admin/site stop showing empties
  let deactivated = 0;
  for (const a of areas) {
    if (String(a._id) === String(canonical._id)) continue;
    await Area.findByIdAndUpdate(a._id, {
      $set: { isActive: false, isHome: false, featured: false },
    });
    deactivated += 1;
    console.log(`Deactivated duplicate: ${a.slug} (${a._id})`);
  }

  const subs = await SubArea.countDocuments({
    area: canonical._id,
    ...live,
  });
  console.log(`\nDone. live sub-areas on mohammadpur: ${subs}`);
  console.log(`Duplicates deactivated: ${deactivated}`);

  await mongoose.disconnect();
};

run().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
