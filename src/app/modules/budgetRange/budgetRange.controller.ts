import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BudgetRangeService } from "./budgetRange.service";

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await BudgetRangeService.create(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Budget range created successfully",
    data,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const data = await BudgetRangeService.getAll(req.query as any);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Budget ranges retrieved successfully",
    data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await BudgetRangeService.getById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Budget range retrieved successfully",
    data,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const data = await BudgetRangeService.update(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Budget range updated successfully",
    data,
  });
});

const remove = catchAsync(async (req: Request, res: Response) => {
  await BudgetRangeService.remove(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Budget range deleted successfully",
  });
});

export const BudgetRangeController = {
  create,
  getAll,
  getById,
  update,
  remove,
};
