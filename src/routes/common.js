import { Router } from "express"
// import { addSurveyData, addSurveyOilReport, getSurveyData, getSurveyOilReport } from "../controller/survey.js";
import { verifyjwt } from "../middleware/auth.js";
import { getAdminAllData, getDredgerTotalProduction, getProductionDataBlockWise, getProductionDataDykewise,serveyOilConsumed} from "../controller/common.js";

const router = Router();


router.route('/getAdminAllData').post(getAdminAllData);
router.route('/getDredgerTotalProduction').post(getDredgerTotalProduction);
router.route('/getProductionDataDykewise').post(getProductionDataDykewise);
router.route('/getProductionDataBlockWise').post(getProductionDataBlockWise);
router.route('/serveyOilConsumed').post(serveyOilConsumed);

// router.route('/addSurveyData').post(verifyjwt, addSurveyData);
// router.route('/addSurveyOilReport').post(verifyjwt, addSurveyOilReport);
// router.route('/getSurveyData').post(verifyjwt, getSurveyData);
// router.route('/getSurveyOilReport').post(verifyjwt, getSurveyOilReport);

export default router;