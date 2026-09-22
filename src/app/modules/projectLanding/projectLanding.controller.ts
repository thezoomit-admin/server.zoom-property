import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProjectLandingService } from "./projectLanding.service";

const userId = (req: Request) => (req as any).user?.userId;

const getByProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectLandingService.getByProject(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project landing retrieved successfully",
    data: result,
  });
});

const getPublicByPath = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectLandingService.getPublicByPath(req.params.path);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project landing retrieved successfully",
    data: result,
  });
});

const getChrome = catchAsync(async (_req: Request, res: Response) => {
  const result = await ProjectLandingService.getChrome();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Landing chrome retrieved successfully",
    data: result,
  });
});

const upsert = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectLandingService.upsert(
    req.params.id,
    req.body,
    userId(req),
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project landing saved successfully",
    data: result,
  });
});

export const ProjectLandingController = {
  getByProject,
  getPublicByPath,
  getChrome,
  upsert,
};
