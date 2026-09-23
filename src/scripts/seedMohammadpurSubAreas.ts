import mongoose from "mongoose";
import slugify from "slugify";

import config from "../app/config";
import { Area } from "../app/modules/area/area.model";
import { SubArea } from "../app/modules/subArea/subArea.model";

/**
 * Seed 10 sub-areas under Mohammadpur (Bus Stand + nearby housing pockets).
 *
 * Idempotent on (area + slug) — re-running skips existing rows.
 *
 *   npx ts-node src/scripts/seedMohammadpurSubAreas.ts
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

const run = async () => {
  const uri = config.db_url as string;
  if (!uri) throw new Error("DB_URL / db_url missing");

  await mongoose.connect(uri);
  console.log("Connected.");

  let area = await Area.findOne({
    ...live,
    $or: [
      { slug: "mohammadpur" },
      { name: /^mohammadpur$/i },
      { nameBn: /মোহাম্মদপুর/ },
    ],
  });

  if (!area) {
    // Prefer a clean "Mohammadpur" row over "Lalmatia & Mohammadpur".
    area = await Area.findOne({
      ...live,
      name: /mohammadpur/i,
    }).sort({ order: 1 });
  }

  if (!area) {
    area = await Area.create({
      name: "Mohammadpur",
      nameBn: "মোহাম্মদপুর",
      slug: "mohammadpur",
      city: "Dhaka",
      tagline: "Bus stand & residential pockets",
      taglineBn: "বাস স্ট্যান্ড ও আবাসিক পকেট",
      order: 99,
      isActive: true,
      isHome: true,
      featured: true,
    });
    console.log(`Created area: ${area.name} (${area._id})`);
  } else {
    console.log(`Using area: ${area.name} / ${area.slug} (${area._id})`);
  }

  const areaId = area._id;
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < SUB_AREAS.length; i += 1) {
    const row = SUB_AREAS[i];
    const slug =
      slugify(row.name, { lower: true, strict: true }) || `sub-area-${i + 1}`;

    const existing = await SubArea.findOne({
      area: areaId,
      slug,
      ...live,
    }).select("_id name");

    if (existing) {
      skipped += 1;
      console.log(`   = skip ${row.name}`);
      continue;
    }

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
    console.log(`   + ${row.name}`);
  }

  console.log(
    `\nDone. area=${area.slug} created=${created} skipped=${skipped}`,
  );
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
