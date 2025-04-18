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

import userRoute from "./routes/user.js";
import employeeRoute from "./routes/employee.js"
import Employee from "./models/employee.model.js";

app.use("/user", userRoute);
app.use("/employee", employeeRoute)


// import { User } from "./models/user.model.js";
// import Employee from "./models/employee.model.js";
 

// const cleanUsersToOnlyReportingHeads = async () => {
//   try {
//     // Step 1: Get all reportingHead strings from Employee DB
//     const employees = await Employee.find({ reportingHead: { $ne: null } });

//     // console.log("employee and length", employees, employees.length);

//     // Step 2: Extract employeeIds from reportingHead using regex
//     const reportingHeadIds = new Set();

//     employees.forEach((emp) => {

//     //   const regex = new RegExp(`\\(${headId}\\)$`);
//       const match = emp.reportingHead.match(/\(([^)]+)\)/);
//       console.log("match", match);

//       if (match && match[1]) {
//         reportingHeadIds.add(match[1]);
//       }
//     });

//     const reportingHeadArray = Array.from(reportingHeadIds);

//     const matchedUsers = await User.find({
//         employeeId: { $in: reportingHeadArray },
//       });
  
//       console.log(`✅ Total reporting heads in Employee DB: ${reportingHeadArray.length}`);
//       console.log(`✅ Reporting heads found in User DB: ${matchedUsers.length}`);

//     // Step 3: Delete users whose employeeId is NOT in reportingHeadIds
//     // const result = await User.deleteMany({
//     //   employeeId: { $nin: Array.from(reportingHeadIds) }
//     // });

//     // console.log(`Deleted ${result.deletedCount} users. Only reporting heads are kept.`);
//   } catch (error) {
//     console.error('Error while cleaning User DB:', error);
//   }
// };

// // Call the function (you can trigger it from an API or a script)
// cleanUsersToOnlyReportingHeads();

// async function removeDuplicateEmployees() {
//     try {
//       // Step 1: Find duplicate employeeIds
//       const duplicates = await Employee.aggregate([
//         {
//           $group: {
//             _id: "$employeeId",
//             count: { $sum: 1 },
//             ids: { $push: "$_id" }
//           }
//         },
//         {
//           $match: {
//             count: { $gt: 1 }
//           }
//         }
//       ]);
  
//       // Step 2: For each group of duplicates, delete all but one
//       for (const dup of duplicates) {
//         const [keepId, ...deleteIds] = dup.ids;
  
//         await Employee.deleteMany({ _id: { $in: deleteIds } });
  
//         console.log(`Kept employeeId ${dup._id}, deleted ${deleteIds.length} duplicate(s)`);
//       }
  
//       console.log("Cleanup complete!");
//     } catch (error) {
//       console.error("Error cleaning up duplicates:", error);
//     }
//   }

//   removeDuplicateEmployees();
  




// import adminRouter from "./routes/admin.js";

// app.use("/admin", adminRouter);

export { app };
