import { Router } from "express";

import auth from "../../middleware/auth";
import checkPermission from "../../middleware/permission";
import { revalidates } from "../../middleware/revalidates";
import validateRequest from "../../middleware/validateRequest";
import { SubAreaController } from "./subArea.controller";
import { subAreaValidation } from "./subArea.validation";

const router = Router();

router.use(revalidates("areas"));

/* Public — before /:id so "public" is never parsed as an id. */
router.get("/public", SubAreaController.getPublicSubAreas);
router.get(
  "/public/:areaSlug/:subSlug",
  SubAreaController.getPublicBySlugs,
);

router.get("/", auth(), SubAreaController.getAllSubAreas);
router.get("/:id", auth(), SubAreaController.getSubAreaById);

router.post(
  "/",
  auth(),
  checkPermission("Areas", "create"),
  validateRequest(subAreaValidation.create),
  SubAreaController.createSubArea,
);

router.patch(
  "/:id",
  auth(),
  checkPermission("Areas", "update"),
  validateRequest(subAreaValidation.update),
  SubAreaController.updateSubArea,
);

router.delete(
  "/:id",
  auth(),
  checkPermission("Areas", "delete"),
  SubAreaController.deleteSubArea,
);

export const SubAreaRoutes = router;
