import { StatusCodes } from "http-status-codes";
import slugify from "slugify";
import { Types } from "mongoose";

import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/appError";
import {
  compactSerials,
  moveSerial,
  takeSerial,
} from "../../shared/serial";
import { diffFields, recordHistory } from "../history/history.service";
import { Area } from "../area/area.model";
import { Project } from "../project/project.model";
import { ISubArea } from "./subArea.interface";
import { SubArea } from "./subArea.model";

const liveFilter = { isDeleted: { $ne: true } };

const uniqueSlug = async (
  areaId: string,
  name: string,
  excludeId?: string,
) => {
  const base = slugify(name, { lower: true, strict: true }) || "sub-area";
  let candidate = base;
  let suffix = 1;
  for (;;) {
    const clash = await SubArea.findOne({
      area: areaId,
      slug: candidate,
      ...liveFilter,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select("_id");
    if (!clash) return candidate;
    candidate = `${base}-${++suffix}`;
  }
};

const assertArea = async (areaId: string) => {
  const area = await Area.findOne({ _id: areaId, ...liveFilter }).select("_id");
  if (!area) throw new AppError(StatusCodes.NOT_FOUND, "Area not found");
  return area;
};

const createSubArea = async (
  payload: Partial<ISubArea> & { area: string },
  createdBy?: string,
) => {
  await assertArea(String(payload.area));

  const subArea = await SubArea.create({
    ...payload,
    order: await takeSerial(SubArea, payload.order),
    slug: await uniqueSlug(String(payload.area), payload.name as string),
    createdBy,
  });

  await recordHistory({
    entity: "SubArea",
    entityId: subArea._id as string,
    action: "created",
    by: createdBy,
  });

  return SubArea.findById(subArea._id)
    .populate({ path: "area", select: "_id name nameBn slug city" })
    .populate({ path: "image", select: "_id key" });
};

const getAllSubAreas = async (query: Record<string, unknown>) => {
  const { activeOnly, ...restQuery } = query;
  const baseFilter: Record<string, unknown> = { ...liveFilter };
  if (activeOnly === "true") baseFilter.isActive = true;

  if (!restQuery.sort || restQuery.sort === "order") {
    restQuery.sort = "order createdAt";
  }

  const subQuery = new QueryBuilder(
    SubArea.find(baseFilter)
      .populate({ path: "area", select: "_id name nameBn slug city" })
      .populate({ path: "image", select: "_id key" }),
    restQuery,
  )
    .search(["name", "nameBn"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [rows, meta] = await Promise.all([
    subQuery.modelQuery,
    subQuery.countTotal(),
  ]);

  const counts = await Project.aggregate<{ _id: unknown; count: number }>([
    {
      $match: {
        subArea: { $in: rows.map((r: any) => r._id) },
        isDeleted: { $ne: true },
        isActive: true,
      },
    },
    { $group: { _id: "$subArea", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const data = rows.map((row: any) => ({
    ...row.toObject(),
    projectCount: countMap.get(String(row._id)) ?? 0,
  }));

  return { data, meta };
};

const getSubAreaById = async (id: string) => {
  const subArea = await SubArea.findOne({ _id: id, ...liveFilter })
    .populate({ path: "area", select: "_id name nameBn slug city" })
    .populate({ path: "image", select: "_id key" });
  if (!subArea) throw new AppError(StatusCodes.NOT_FOUND, "Sub-area not found");
  return subArea;
};

/** Public: one sub-area by parent area slug + own slug. */
const getPublicBySlugs = async (areaSlug: string, subSlug: string) => {
  const area = await Area.findOne({
    slug: areaSlug.toLowerCase().trim(),
    ...liveFilter,
    isActive: true,
  }).select("_id name nameBn slug city");
  if (!area) throw new AppError(StatusCodes.NOT_FOUND, "Area not found");

  const subArea = await SubArea.findOne({
    area: area._id,
    slug: subSlug.toLowerCase().trim(),
    ...liveFilter,
    isActive: true,
  }).populate({ path: "image", select: "_id key" });

  if (!subArea) {
    throw new AppError(StatusCodes.NOT_FOUND, "Sub-area not found");
  }

  return {
    ...subArea.toObject(),
    area,
  };
};

const updateSubArea = async (
  id: string,
  payload: Partial<ISubArea>,
  updatedBy?: string,
) => {
  const existing = await SubArea.findOne({ _id: id, ...liveFilter });
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Sub-area not found");

  if (payload.area && String(payload.area) !== String(existing.area)) {
    await assertArea(String(payload.area));
  }

  const changes = diffFields(existing.toObject(), payload);
  const patch: Record<string, unknown> = { ...payload, updatedBy };
  const areaId = String(payload.area || existing.area);

  if (typeof payload.order === "number" && payload.order !== existing.order) {
    patch.order = await moveSerial(SubArea, id, existing.order, payload.order);
  }
  if (payload.name && payload.name !== existing.name) {
    patch.slug = await uniqueSlug(areaId, payload.name, id);
  }

  const subArea = await SubArea.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  })
    .populate({ path: "area", select: "_id name nameBn slug city" })
    .populate({ path: "image", select: "_id key" });

  await recordHistory({
    entity: "SubArea",
    entityId: id,
    action: "updated",
    changes,
    by: updatedBy,
  });

  return subArea;
};

const deleteSubArea = async (id: string, deletedBy?: string) => {
  const inUse = await Project.countDocuments({
    subArea: id,
    ...liveFilter,
  });
  if (inUse) {
    throw new AppError(
      StatusCodes.CONFLICT,
      `${inUse} project(s) are in this sub-area. Deactivate it instead.`,
    );
  }

  const subArea = await SubArea.findOneAndUpdate(
    { _id: id, ...liveFilter },
    { isDeleted: true, isActive: false, updatedBy: deletedBy },
    { new: true },
  );
  if (!subArea) throw new AppError(StatusCodes.NOT_FOUND, "Sub-area not found");

  await compactSerials(SubArea);

  await recordHistory({
    entity: "SubArea",
    entityId: id,
    action: "archived",
    by: deletedBy,
  });

  return subArea;
};

/** Resolve area filter that may be ObjectId or area slug. */
const resolveAreaFilter = async (areaParam?: unknown) => {
  if (!areaParam || typeof areaParam !== "string") return undefined;
  if (Types.ObjectId.isValid(areaParam) && areaParam.length === 24) {
    return areaParam;
  }
  const area = await Area.findOne({
    slug: areaParam.toLowerCase().trim(),
    ...liveFilter,
  }).select("_id");
  return area?._id ? String(area._id) : areaParam;
};

export const SubAreaService = {
  createSubArea,
  getAllSubAreas,
  getSubAreaById,
  getPublicBySlugs,
  updateSubArea,
  deleteSubArea,
  resolveAreaFilter,
};
