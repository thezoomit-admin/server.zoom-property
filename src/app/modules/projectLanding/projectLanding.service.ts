import slugify from "slugify";
import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { Project } from "../project/project.model";
import { LANDING_SECTIONS } from "./projectLanding.interface";
import { ProjectLanding } from "./projectLanding.model";

const withRelations = <T>(q: T) =>
  (q as any)
    .populate({ path: "project", select: "_id name nameBn slug" })
    .populate({ path: "hero.image", select: "_id key" })
    .populate({ path: "about.image", select: "_id key" })
    .populate({ path: "residences.images", select: "_id key" })
    .populate({ path: "elevation.views.image", select: "_id key" })
    .populate({ path: "gallery.shots.image", select: "_id key" })
    .populate({ path: "reviews.items.avatar", select: "_id key" }) as T;

const emptySections = () =>
  Object.fromEntries(LANDING_SECTIONS.map((key) => [key, { visible: true }]));

const uniquePath = async (raw: string, excludeId?: string) => {
  const base = slugify(raw, { lower: true, strict: true }) || "project";
  let candidate = base;
  let suffix = 1;
  for (;;) {
    const clash = await ProjectLanding.findOne({
      path: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select("_id");
    if (!clash) return candidate;
    candidate = `${base}-${++suffix}`;
  }
};

const stripEmptyIds = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripEmptyIds);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry === "" || entry === null) {
        out[key] = undefined;
      } else {
        out[key] = stripEmptyIds(entry);
      }
    }
    return out;
  }
  return value;
};

const getByProject = async (projectId: string) => {
  const project = await Project.findOne({
    _id: projectId,
    isDeleted: { $ne: true },
  }).select("_id name nameBn slug");
  if (!project) {
    throw new AppError(StatusCodes.NOT_FOUND, "Project not found");
  }

  const landing = await withRelations(
    ProjectLanding.findOne({ project: projectId }),
  ).lean();

  return { project, landing };
};

const getPublicByPath = async (path: string) => {
  const landing = await withRelations(
    ProjectLanding.findOne({ path: path.toLowerCase().trim(), isActive: true }),
  ).lean();
  if (!landing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Landing page not found");
  }
  return landing;
};

const getChrome = async () => {
  const rows = await ProjectLanding.find({ isActive: true })
    .select(
      "path phonePrimary phoneSecondary whatsapp facebookUrl navEnquire navEnquireBn hero.title hero.titleBn hero.location hero.locationBn cta.primary cta.primaryBn enquire.phoneLabel enquire.phoneLabelBn enquire.whatsappLabel enquire.whatsappLabelBn",
    )
    .lean();
  return rows;
};

const upsert = async (
  projectId: string,
  payload: Record<string, unknown>,
  userId?: string,
) => {
  const project = await Project.findOne({
    _id: projectId,
    isDeleted: { $ne: true },
  }).select("_id name slug");
  if (!project) {
    throw new AppError(StatusCodes.NOT_FOUND, "Project not found");
  }

  const existing = await ProjectLanding.findOne({ project: projectId });
  const requestedPath =
    typeof payload.path === "string" && payload.path.trim()
      ? payload.path
      : existing?.path || project.slug;
  const path = await uniquePath(String(requestedPath), existing?._id?.toString());

  const cleaned = stripEmptyIds(payload) as Record<string, unknown>;
  const next = {
    ...cleaned,
    project: projectId,
    path,
    sections: { ...emptySections(), ...(cleaned.sections as object | undefined) },
    updatedBy: userId,
  };

  const landing = existing
    ? await ProjectLanding.findByIdAndUpdate(
        existing._id,
        { $set: next },
        { new: true, runValidators: true },
      )
    : await ProjectLanding.create({ ...next, createdBy: userId });

  if (!landing) {
    throw new Error("Failed to save project landing");
  }

  return withRelations(ProjectLanding.findById(landing._id));
};

export const ProjectLandingService = {
  getByProject,
  getPublicByPath,
  getChrome,
  upsert,
};
