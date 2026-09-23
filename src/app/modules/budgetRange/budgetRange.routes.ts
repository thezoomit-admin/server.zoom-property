import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import validateRequest from "../../middleware/validateRequest";
import { BudgetRangeController } from "./budgetRange.controller";
import { BudgetRangeValidation } from "./budgetRange.validation";

const router = Router();

// Public reads — contact form + admin list
router.get("/", BudgetRangeController.getAll);
router.get("/:id", BudgetRangeController.getById);

router.post(
  "/",
  auth(),
  checkPermission("Budget Ranges", "create"),
  validateRequest(BudgetRangeValidation.create),
  BudgetRangeController.create,
);

router.patch(
  "/:id",
  auth(),
  checkPermission("Budget Ranges", "update"),
  validateRequest(BudgetRangeValidation.update),
  BudgetRangeController.update,
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Budget Ranges", "delete"),
  BudgetRangeController.remove,
);

export const BudgetRangeRoutes = router;
