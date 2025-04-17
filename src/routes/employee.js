import { Router } from "express";
import { addFeedBackMasterData, fetchEmployeeDetailsByExcel, getEmployeesByReportingHeadId } from "../controller/employee.js";


const router = Router();

router.route("/fetchEmployeeDetails").post(fetchEmployeeDetailsByExcel);
router.route("/getEmployeesByReportingHeadId").post(getEmployeesByReportingHeadId);
router.route("/addFeedBackMasterData").post(addFeedBackMasterData);

// router.route("/login").post(loginUser);
// router.route("/register").post(registerUser);

export default router;