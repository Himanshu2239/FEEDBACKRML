import { Router } from "express";
import { loginUser, registerUser } from "../controller/user.js";
// import { fetchEmployeeDetails } from "../controller/employee.js";


const router = Router();

router.route("/login").post(loginUser);
router.route("/register").post(registerUser);
// router.route("/fetchEmployeeDetails").post(fetchEmployeeDetails)
export default router;

