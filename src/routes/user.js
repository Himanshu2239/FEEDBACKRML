import { Router } from "express";
// import {verfiyjwt} from "../middleware/auth.js"
import { loginUser, logoutUser, refresh_token, registerUser } from "../controller/user.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/token").post(refresh_token);
router.route("/login").post(loginUser);
router.route("/logoutUser").get(logoutUser);


export default router;


// router.route("/")