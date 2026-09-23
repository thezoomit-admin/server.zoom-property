import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProjectService } from "./project.service";
import publicQuery from "../../utils/publicQuery";

const userId = (req: Request) => (req as any).user?.userId;

const createProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.createProject(req.body, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Project created successfully",
    data: result,
  });
});

const getAllProjects = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await ProjectService.getAllProjects(
    req.query as Record<string, unknown>
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Projects retrieved successfully",
    meta,
    data,
  });
});

/**
 * The website's read. `activeOnly` is forced — this route has no auth in
 * front of it, and a development switched off in the panel is off everywhere.
 */
const getPublicProjects = catchAsync(async (req: Request, res: Response) => {
  const narrowed = publicQuery(req.query as Record<string, unknown>, [
    "isHome",
    "isFooter",
    "featured",
    "area",
    "subArea",
    "stage",
    "city",
  ]);

  // Allow area / subArea to be sent as slug from the website.
  if (narrowed.area) {
    const { SubAreaService } = await import("../subArea/subArea.service");
    narrowed.area = await SubAreaService.resolveAreaFilter(narrowed.area);
  }
  if (narrowed.subArea && typeof narrowed.subArea === "string") {
    const { Types } = await import("mongoose");
    if (
      !(
        Types.ObjectId.isValid(narrowed.subArea) &&
        narrowed.subArea.length === 24
      )
    ) {
      const { SubArea } = await import("../subArea/subArea.model");
      const row = await SubArea.findOne({
        slug: String(narrowed.subArea).toLowerCase().trim(),
        isDeleted: { $ne: true },
        isActive: true,
      }).select("_id");
      if (row) narrowed.subArea = String(row._id);
    }
  }

  const { data, meta } = await ProjectService.getAllProjects({
    ...narrowed,
    activeOnly: "true",
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Projects retrieved successfully",
    meta,
    data,
  });
});

const getProjectBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.getProjectBySlug(req.params.slug);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project retrieved successfully",
    data: result,
  });
});

const getProjectById = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.getProjectById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project retrieved successfully",
    data: result,
  });
});

const updateProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.updateProject(
    req.params.id,
    req.body,
    userId(req)
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project updated successfully",
    data: result,
  });
});

const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.deleteProject(req.params.id, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project deleted successfully",
    data: result,
  });
});

export const ProjectController = {
  createProject,
  getAllProjects,
  getPublicProjects,
  getProjectBySlug,
  getProjectById,
  updateProject,
  deleteProject,
};
