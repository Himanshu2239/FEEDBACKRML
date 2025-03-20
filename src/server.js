import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { MAX_LIMIT_OF_DATA, STORE_STATIC_DATA } from "./constant.js";
import dotenv from "dotenv";
// import { addSurveyData } from "./controller/survey.js";
dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
// app.use(cors())

app.use(express.json({ limit: `${MAX_LIMIT_OF_DATA}` })); //accept data : json format
app.use(express.urlencoded({ extended: true, limit: `${MAX_LIMIT_OF_DATA}` })); //accept data : url
app.use(express.static(`${STORE_STATIC_DATA}`)); //store  static data  in public folder.
app.use(cookieParser());

import surveyRoute from "./routes/survey.js";
import operatorRoute from "./routes/operator.js";
import userRoute from "./routes/user.js";
import commonRoute from "./routes/common.js";
import adminRouter from "./routes/admin.js";

app.use("/survey", surveyRoute);
app.use("/operator", operatorRoute);
app.use("/user", userRoute);
app.use("/common", commonRoute);
app.use("/admin", adminRouter);

//routes import
// import authRouter from "./routes/Auth.js";
// import userRouter from "./routes/user.js";
// import adminRouter from "./routes/admin.js";
// import productionRouter from "./routes/production.js";
// import commonRouter from "./routes/common.js";

// //routes declaration
// app.use("/auth", authRouter);
// app.use("/user", userRouter);
// app.use("/admin", adminRouter);
// app.use("/production", productionRouter);
// app.use("/common", commonRouter);

export { app };
