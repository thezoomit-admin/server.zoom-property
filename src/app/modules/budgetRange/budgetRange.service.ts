import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { IBudgetRange } from "./budgetRange.interface";
import { BudgetRange } from "./budgetRange.model";

/** URL-safe value from English name when none is provided. */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/** Default crore bands — same as the old hard-coded contact form. */
const DEFAULTS: IBudgetRange[] = [
  { name: "Not sure yet", nameBn: "এখনও ঠিক করিনি", value: "any", order: 0 },
  {
    name: "Under ৳1 Cr",
    nameBn: "১ কোটির নিচে",
    value: "under1",
    order: 1,
  },
  { name: "৳1 – 2 Cr", nameBn: "১ – ২ কোটি", value: "1to2", order: 2 },
  { name: "৳2 – 5 Cr", nameBn: "২ – ৫ কোটি", value: "2to5", order: 3 },
  { name: "৳5 – 10 Cr", nameBn: "৫ – ১০ কোটি", value: "5to10", order: 4 },
  {
    name: "৳10 Cr and above",
    nameBn: "১০ কোটি বা তার বেশি",
    value: "over10",
    order: 5,
  },
];

const ensureDefaults = async () => {
  const count = await BudgetRange.estimatedDocumentCount();
  if (count > 0) return;
  await BudgetRange.insertMany(
    DEFAULTS.map((row) => ({ ...row, isActive: true })),
  );
};

const create = async (payload: IBudgetRange) => {
  const value = (
    payload.value?.trim() ||
    slugify(payload.name)
  ).toLowerCase();
  if (!value) {
    throw new AppError(StatusCodes.BAD_REQUEST, "A valid value is required.");
  }
  const existing = await BudgetRange.findOne({ value });
  if (existing) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "A budget range with this value already exists.",
    );
  }
  const order =
    payload.order ??
    ((await BudgetRange.findOne().sort({ order: -1 }).select("order"))?.order ??
      -1) + 1;
  return BudgetRange.create({
    name: payload.name.trim(),
    nameBn: payload.nameBn?.trim() || "",
    value,
    order,
    isActive: payload.isActive ?? true,
  });
};

const getAll = async (
  params: { keyword?: string; isActive?: string | boolean } = {},
) => {
  await ensureDefaults();

  const where: Record<string, unknown> = {};
  if (params.keyword) {
    where.$or = [
      { name: { $regex: params.keyword, $options: "i" } },
      { nameBn: { $regex: params.keyword, $options: "i" } },
      { value: { $regex: params.keyword, $options: "i" } },
    ];
  }
  if (params.isActive !== undefined && params.isActive !== "") {
    where.isActive =
      params.isActive === "true" || params.isActive === true;
  }
  return BudgetRange.find(where).sort({ order: 1, name: 1 });
};

const getById = async (id: string) => {
  const item = await BudgetRange.findById(id);
  if (!item) {
    throw new AppError(StatusCodes.NOT_FOUND, "Budget range not found.");
  }
  return item;
};

const update = async (id: string, payload: Partial<IBudgetRange>) => {
  const item = await BudgetRange.findById(id);
  if (!item) {
    throw new AppError(StatusCodes.NOT_FOUND, "Budget range not found.");
  }

  const next: Partial<IBudgetRange> = { ...payload };
  if (payload.name && !payload.value) {
    // Keep existing value unless explicitly changed — don't regenerate.
  }
  if (next.value) next.value = next.value.toLowerCase().trim();

  if (next.value) {
    const conflict = await BudgetRange.findOne({
      _id: { $ne: id },
      value: next.value,
    });
    if (conflict) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "Another budget range with this value already exists.",
      );
    }
  }

  if (typeof next.name === "string") next.name = next.name.trim();
  if (typeof next.nameBn === "string") next.nameBn = next.nameBn.trim();

  return BudgetRange.findByIdAndUpdate(id, next, {
    new: true,
    runValidators: true,
  });
};

const remove = async (id: string) => {
  const item = await BudgetRange.findById(id);
  if (!item) {
    throw new AppError(StatusCodes.NOT_FOUND, "Budget range not found.");
  }
  await BudgetRange.findByIdAndDelete(id);
  return item;
};

export const BudgetRangeService = {
  create,
  getAll,
  getById,
  update,
  remove,
};
