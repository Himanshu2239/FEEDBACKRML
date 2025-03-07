import { Router } from "express"
import { addOperatorReport, getOpeningBalance, getOperatorReport } from "../controller/operator.js";
import { verifyjwt } from "../middleware/auth.js";
// import { addOilReportByOperator, addOperatorWorkLog, getOilReportByDate } from "../controller/operator.js";

const router = Router();

// router.route('/addWorkLog').post(addOperatorWorkLog);
// router.route('/addOilReport').post(addOilReportByOperator);
// router.route('/getOilReportByDate').get(getOilReportByDate);

router.route('/getOpeningBalace').post(verifyjwt, getOpeningBalance);
router.route('/addOperatorReport').post(verifyjwt, addOperatorReport);
router.route('/getOperatorReport').post(verifyjwt, getOperatorReport);

export default router;