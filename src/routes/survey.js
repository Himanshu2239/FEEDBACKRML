import { Router } from "express"
import { addSurveyData, addSurveyOilReport, deleteSurveyReport, editSurveyReport, getSurveyData, getSurveyOilReport } from "../controller/survey.js";
import { verifyjwt } from "../middleware/auth.js";

const router = Router();

router.route('/addSurveyData').post(verifyjwt, addSurveyData);
router.route('/addSurveyOilReport').post(verifyjwt, addSurveyOilReport);
router.route('/getSurveyData').post(verifyjwt, getSurveyData);
router.route('/getSurveyOilReport').post(verifyjwt, getSurveyOilReport);
router.route('/deleteSurveyReport/:id').delete(verifyjwt, deleteSurveyReport);
router.route('/editSurveyReport/:id').put(verifyjwt, editSurveyReport);

export default router;