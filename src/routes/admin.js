import { Router } from "express";
import {
  fetchProductionDetailsForGivenDate,
  fetchProductionDetailsForGivenRange,
  serveyOilConsumedForGivenDate,
  surveyOilConsumedForGivenRange
} from "../controller/admin.js";

const router = Router();

router
  .route("/fetchProductionDetailsForGivenDate")
  .post(fetchProductionDetailsForGivenDate);
router
  .route("/fetchProductionDetailsForGivenRange")
  .post(fetchProductionDetailsForGivenRange);

router.route("/serveyOilConsumed").post(serveyOilConsumedForGivenDate);
router.route("/surveyOilConsumedForGivenRange").post(surveyOilConsumedForGivenRange);

export default router;
