import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import catchAsync from "../../utils/catchAsync";
import publicQuery from "../../utils/publicQuery";
import sendResponse from "../../utils/sendResponse";
import { SubAreaService } from "./subArea.service";

const userId = (req: Request) => (req as any).user?.userId;

const createSubArea = catchAsync(async (req: Request, res: Response) => {
  const result = await SubAreaService.createSubArea(req.body, userId(req));
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Sub-area created successfully",
    data: result,
  });
});

const getAllSubAreas = catchAsync(async (req: Request, res: Response) => {
  const query = { ...(req.query as Record<string, unknown>) };
  if (query.area) {
    query.area = await SubAreaService.resolveAreaFilter(query.area);
  }
  const { data, meta } = await SubAreaService.getAllSubAreas(query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sub-areas retrieved successfully",
    meta,
    data,
  });
});

const getPublicSubAreas = catchAsync(async (req: Request, res: Response) => {
  const narrowed = publicQuery(req.query as Record<string, unknown>, [
    "area",
  ]);
  if (narrowed.area) {
    narrowed.area = await SubAreaService.resolveAreaFilter(narrowed.area);
  }
  const { data, meta } = await SubAreaService.getAllSubAreas({
    ...narrowed,
    activeOnly: "true",
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sub-areas retrieved successfully",
    meta,
    data,
  });
});

const getPublicBySlugs = catchAsync(async (req: Request, res: Response) => {
  const result = await SubAreaService.getPublicBySlugs(
    req.params.areaSlug,
    req.params.subSlug,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sub-area retrieved successfully",
    data: result,
  });
});

const getSubAreaById = catchAsync(async (req: Request, res: Response) => {
  const result = await SubAreaService.getSubAreaById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sub-area retrieved successfully",
    data: result,
  });
});

const updateSubArea = catchAsync(async (req: Request, res: Response) => {
  const result = await SubAreaService.updateSubArea(
    req.params.id,
    req.body,
    userId(req),
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sub-area updated successfully",
    data: result,
  });
});

const deleteSubArea = catchAsync(async (req: Request, res: Response) => {
  const result = await SubAreaService.deleteSubArea(
    req.params.id,
    userId(req),
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sub-area deleted successfully",
    data: result,
  });
});

export const SubAreaController = {
  createSubArea,
  getAllSubAreas,
  getPublicSubAreas,
  getPublicBySlugs,
  getSubAreaById,
  updateSubArea,
  deleteSubArea,
};
