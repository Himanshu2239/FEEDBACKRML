import xlsx from 'xlsx';
import Employee from '../models/employee.model.js';
import ExcelJS from "exceljs";
import { feedbackMaterData } from '../models/feedback.model.js';


const fetchEmployeeDetailsByExcel = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Only POST method allowed' });
    }

    const excelFilePath = "C:/Users/Vishal Gupta/Downloads/Salary_Confirmation Datasheet(Final).xlsx"

    const workbook = xlsx.readFile(excelFilePath);
    const sheet = workbook.Sheets[workbook.SheetNames[1]];

    // ✅ This will automatically use row 1 as header and row 2+ as data
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    const formattedData = jsonData.map(row => {
      // Convert DOB to Date format if needed
      const excelDate = row['Date of Joining'];

      // Handle Excel date (serial or string)

      let dateOfJoining = null;
      if (typeof excelDate === 'number') {
        // Convert Excel serial date to JS Date
        dateOfJoining = new Date((excelDate - 25569) * 86400 * 1000);
        // dateOfJoining = formatDateToMMDDYYYY(dateOfJoining);
        // console.log("date of joining", dateOfJoining)
      } else if (typeof excelDate === 'string') {
        dateOfJoining = new Date(excelDate);
      }

      return {
        employeeId: row['Employee Id']?.toString(),
        employeeName: row['Employee Name'],
        businessUnit: row['Business Unit'],
        department: row['Department'],
        designation: row['Designation'],
        dateOfJoining: isNaN(dateOfJoining) ? null : dateOfJoining,
        reportingHead: row['Reporting Manager'],
        purpose: row['Purpose']
      };
    });

    // console.log('Formatted Data:', formattedData);

    await Employee.insertMany(formattedData); // Uncomment this to save to DB
    res.status(200).json({ message: '✅ Excel data processed successfully', data: formattedData });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};



const getEmployeesByReportingHeadId = async (req, res) => {

  // await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST method allowed' });
  }

  const { headId } = req.body;

  if (!headId) {
    return res.status(400).json({ message: 'headId is required in body' });
  }

  try {
    // Match anything ending in (RML000878)
    const regex = new RegExp(`\\(${headId}\\)$`);

    const employees = await Employee.find({ reportingHead: { $regex: regex } });

    res.status(200).json({
      message: `Employees under ID ${headId}`,
      data: employees,
    });
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


const addFeedBackMasterData = async (req, res) => {
  const { data } = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: "No data provided." });
  }

  try {
    for (const row of data) {
      const [
        slNo,
        employeeId,
        employeeName,
        businessUnit,
        department,
        designation,
        dateOfJoining,
        reportingHead,
        kra,
        kpi1Target,
        kpi1Achievement,
        kpi2Target,
        kpi2Achievement,
        kpi3Target,
        kpi3Achievement,
        kpi4Target,
        kpi4Achievement,
        kpi5Target,
        kpi5Achievement,
        overallKpiAchievement,
        knowledgeExpertise,
        attitudeApproach,
        initiativeProactivity,
        teamworkCollaboration,
        adaptabilityLearning,
        communicationSkills,
        attendancePunctuality,
        areasForImprovement,
        // trainingRecommendations,
        confirmationStatus,
        // rationale,
        remarks
      ] = row.fields;

      const feedbackData = {
        slNo,
        employeeId,
        employeeName,
        businessUnit,
        department,
        designation,
        dateOfJoining,
        reportingHead,
        kra,
        kpi1Target,
        kpi1Achievement,
        kpi2Target,
        kpi2Achievement,
        kpi3Target,
        kpi3Achievement,
        kpi4Target,
        kpi4Achievement,
        kpi5Target,
        kpi5Achievement,
        overallKpiAchievement,
        knowledgeExpertise,
        attitudeApproach,
        initiativeProactivity,
        teamworkCollaboration,
        adaptabilityLearning,
        communicationSkills,
        attendancePunctuality,
        areasForImprovement,
        confirmationStatus,
        remarks,
        submittedAt: new Date()
      };

      // Check if employee feedback already exists
      const existing = await feedbackMaterData.findOne({ employeeId });

      if (existing) {
        // Update existing record
        await feedbackMaterData.updateOne({ employeeId }, feedbackData);
      } else {
        // Insert new record
        await feedbackMaterData.create(feedbackData);
      }
    }

    return res.status(200).json({ message: "Feedback processed successfully." });
  } catch (err) {
    console.error("Error saving feedback:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// const downloadExcelFeedbackReport = async (req, res) => {
//   try {

//     const data = await feedbackMaterData.find();

//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Feedback Report");

//     // Setup heading
//     const headers = [
//       { header: "Sl No", key: "slNo", width: 10 },
//       { header: "Employee ID", key: "employeeId", width: 15 },
//       { header: "Employee Name", key: "employeeName", width: 20 },
//       { header: "Business Unit", key: "businessUnit", width: 20 },
//       { header: "Department", key: "department", width: 15 },
//       { header: "Designation", key: "designation", width: 20 },
//       { header: "Date Of Joining", key: "dateOfJoining", width: 15 },
//       { header: "Reporting Head", key: "reportingHead", width: 20 },
//       { header: "KRA", key: "kra", width: 20 },

//       // KPI Groups
//       { header: "KPI 1 - Target", key: "kpi1Target", width: 15 },
//       { header: "KPI 1 - Achievement", key: "kpi1Achievement", width: 18 },
//       { header: "KPI 2 - Target", key: "kpi2Target", width: 15 },
//       { header: "KPI 2 - Achievement", key: "kpi2Achievement", width: 18 },
//       { header: "KPI 3 - Target", key: "kpi3Target", width: 15 },
//       { header: "KPI 3 - Achievement", key: "kpi3Achievement", width: 18 },
//       { header: "KPI 4 - Target", key: "kpi4Target", width: 15 },
//       { header: "KPI 4 - Achievement", key: "kpi4Achievement", width: 18 },
//       { header: "KPI 5 - Target", key: "kpi5Target", width: 15 },
//       { header: "KPI 5 - Achievement", key: "kpi5Achievement", width: 18 },

//       // Renamed Headings
//       { header: "Overall KPI Achievement (%)", key: "overallKpiAchievement", width: 25 },
//       { header: "Knowledge & Expertise (1-5)", key: "knowledgeExpertise", width: 25 },
//       { header: "Attitude & Approach (1-5)", key: "attitudeApproach", width: 25 },
//       { header: "Initiative & Proactivity (1-5)", key: "initiativeProactivity", width: 25 },
//       { header: "Teamwork & Collaboration (1-5)", key: "teamworkCollaboration", width: 25 },
//       { header: "Adaptability & Learning (1-5)", key: "adaptabilityLearning", width: 25 },
//       { header: "Communication Skills (1-5)", key: "communicationSkills", width: 25 },
//       { header: "Attendance & Punctuality (1-5)", key: "attendancePunctuality", width: 25 },
//       { header: "Areas for Improvement", key: "areasForImprovement", width: 30 },
//       { header: "Confirmation Status", key: "confirmationStatus", width: 20 },
//       { header: "Remarks", key: "remarks", width: 30 },
//       { header: "Submitted At", key: "submittedAt", width: 20 },
//     ];

//     worksheet.columns = headers;

//     // Add rows
//     data.forEach((record, index) => {
//       worksheet.addRow({
//         slNo: index + 1,
//         ...record.toObject()
//       });
//     });

//     // Set response headers

//     // res.setHeader(
//     //   "Content-Type",
//     //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     // );
//     // res.setHeader(
//     //   "Content-Disposition",
//     //   "attachment; filename=Feedback_Report.xlsx"
//     // );

//     // Set headers for Excel file download

//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
    
//     res.setHeader("Content-Disposition", "attachment; filename=Feedback_Report.xlsx");

//     await workbook.xlsx.write(res);

//     res.end();

//   } catch (err) {
//     console.error("Excel export error:", err);
//     res.status(500).json({ error: "Failed to export data" });
//   }
// }



// const downloadExcelFeedbackReport = async (req, res) => {
//   try {

//     // await dbConnect();
//     const data = await feedbackMaterData.find();

//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Feedback Report");

//     // 1️⃣ Define column keys and widths (real data columns)
//     worksheet.columns = [
//       { key: "slNo", width: 8 },
//       { key: "employeeId", width: 15 },
//       { key: "employeeName", width: 20 },
//       { key: "businessUnit", width: 20 },
//       { key: "department", width: 15 },
//       { key: "designation", width: 20 },
//       { key: "dateOfJoining", width: 15 },
//       { key: "reportingHead", width: 20 },
//       { key: "kra", width: 20 },

//       { key: "kpi1Target", width: 15 },
//       { key: "kpi1Achievement", width: 18 },
//       { key: "kpi2Target", width: 15 },
//       { key: "kpi2Achievement", width: 18 },
//       { key: "kpi3Target", width: 15 },
//       { key: "kpi3Achievement", width: 18 },
//       { key: "kpi4Target", width: 15 },
//       { key: "kpi4Achievement", width: 18 },
//       { key: "kpi5Target", width: 15 },
//       { key: "kpi5Achievement", width: 18 },

//       { key: "overallKpiAchievement", width: 25 },
//       { key: "knowledgeExpertise", width: 25 },
//       { key: "attitudeApproach", width: 25 },
//       { key: "initiativeProactivity", width: 25 },
//       { key: "teamworkCollaboration", width: 25 },
//       { key: "adaptabilityLearning", width: 25 },
//       { key: "communicationSkills", width: 25 },
//       { key: "attendancePunctuality", width: 25 },
//       { key: "areasForImprovement", width: 30 },
//       { key: "confirmationStatus", width: 20 },
//       { key: "remarks", width: 30 },
//       { key: "submittedAt", width: 20 },
//     ];

//     // 2️⃣ Add First Header Row (grouped headings)
//     worksheet.addRow([
//       "Sl No", "Employee ID", "Employee Name", "Business Unit", "Department",
//       "Designation", "Date Of Joining", "Reporting Head", "KRA",
//       "KPI 1", "", "KPI 2", "", "KPI 3", "", "KPI 4", "", "KPI 5", "",
//       "Overall KPI Achievement (%)", "Knowledge & Expertise (1-5)", "Attitude & Approach (1-5)",
//       "Initiative & Proactivity (1-5)", "Teamwork & Collaboration (1-5)", "Adaptability & Learning (1-5)",
//       "Communication Skills (1-5)", "Attendance & Punctuality (1-5)", "Areas for Improvement",
//       "Confirmation Status", "Remarks", "Submitted At"
//     ]);

//     // 3️⃣ Add Second Header Row (subheadings)
//     worksheet.addRow([
//       "", "", "", "", "", "", "", "", "",
//       "Target", "Achievement", "Target", "Achievement", "Target", "Achievement",
//       "Target", "Achievement", "Target", "Achievement",
//       "", "", "", "", "", "", "", "", "", "", "", ""
//     ]);

//     // 4️⃣ Merge cells for grouped KPI headers
//     const mergeGroups = [
//       [10, 11], [12, 13], [14, 15], [16, 17], [18, 19]
//     ];

//     mergeGroups.forEach(([start, end], i) => {
//       worksheet.mergeCells(1, start, 1, end);
//       worksheet.getCell(1, start).alignment = { vertical: "middle", horizontal: "center" };
//     });

//     // Merge for other headers
//     const singleHeaders = [1, 2, 3, 4, 5, 6, 7, 8, 9,
//       20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
//     singleHeaders.forEach((col) => {
//       worksheet.mergeCells(1, col, 2, col);
//       worksheet.getCell(1, col).alignment = { vertical: "middle", horizontal: "center" };
//     });

//     // 5️⃣ Style header rows
//     [1, 2].forEach((rowNum) => {
//       const row = worksheet.getRow(rowNum);
//       row.font = { bold: true };
//       row.alignment = { vertical: "middle", horizontal: "center" };
//       row.eachCell((cell) => {
//         cell.fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "D9E1F2" }
//         };
//         cell.border = {
//           top: { style: "thin" },
//           left: { style: "thin" },
//           bottom: { style: "thin" },
//           right: { style: "thin" }
//         };
//       });
//     });

//     // 6️⃣ Add data rows
//     data.forEach((item, index) => {
//       worksheet.addRow({
//         slNo: index + 1,
//         ...item.toObject()
//       });
//     });

//     // 7️⃣ Set headers and return file
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=Feedback_Report.xlsx"
//     );

//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (err) {
//     console.error("Excel export error:", err);
//     res.status(500).json({ error: "Failed to export data" });
//   }
// };

const downloadExcelFeedbackReport = async (req, res) => {
  try {
    // const data = await dbConnect(); // If needed
    const data = await feedbackMaterData.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Feedback Report");

    // Column setup (Removed SlNo & SubmittedAt)
    worksheet.columns = [
      { key: "employeeId", width: 15 },
      { key: "employeeName", width: 20 },
      { key: "businessUnit", width: 20 },
      { key: "department", width: 15 },
      { key: "designation", width: 20 },
      { key: "dateOfJoining", width: 15 },
      { key: "reportingHead", width: 20 },
      { key: "kra", width: 20 },
      { key: "kpi1Target", width: 15 },
      { key: "kpi1Achievement", width: 18 },
      { key: "kpi2Target", width: 15 },
      { key: "kpi2Achievement", width: 18 },
      { key: "kpi3Target", width: 15 },
      { key: "kpi3Achievement", width: 18 },
      { key: "kpi4Target", width: 15 },
      { key: "kpi4Achievement", width: 18 },
      { key: "kpi5Target", width: 15 },
      { key: "kpi5Achievement", width: 18 },
      { key: "overallKpiAchievement", width: 25 },
      { key: "knowledgeExpertise", width: 25 },
      { key: "attitudeApproach", width: 25 },
      { key: "initiativeProactivity", width: 25 },
      { key: "teamworkCollaboration", width: 25 },
      { key: "adaptabilityLearning", width: 25 },
      { key: "communicationSkills", width: 25 },
      { key: "attendancePunctuality", width: 25 },
      { key: "areasForImprovement", width: 30 },
      { key: "confirmationStatus", width: 20 },
      { key: "remarks", width: 30 },
    ];

    // Header row 1
    worksheet.addRow([
      "Employee ID", "Employee Name", "Business Unit", "Department", "Designation", "Date Of Joining",
      "Reporting Head", "KRA",
      "KPI 1", "", "KPI 2", "", "KPI 3", "", "KPI 4", "", "KPI 5", "",
      "Overall KPI Achievement (%)", "Knowledge & Expertise (1-5)", "Attitude & Approach (1-5)",
      "Initiative & Proactivity (1-5)", "Teamwork & Collaboration (1-5)", "Adaptability & Learning (1-5)",
      "Communication Skills (1-5)", "Attendance & Punctuality (1-5)", "Areas for Improvement",
      "Confirmation Status", "Remarks"
    ]);

    // Header row 2 (subheadings)
    worksheet.addRow([
      "", "", "", "", "", "", "", "",
      "Target", "Achievement", "Target", "Achievement", "Target", "Achievement",
      "Target", "Achievement", "Target", "Achievement",
      "", "", "", "", "", "", "", "", "", "", ""
    ]);

    // Merge KPI groups
    const kpiMerge = [
      [9, 10], [11, 12], [13, 14], [15, 16], [17, 18]
    ];
    kpiMerge.forEach(([start, end]) => {
      worksheet.mergeCells(1, start, 1, end);
      worksheet.getCell(1, start).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });

    // Merge single headers
    const singleHeaderCols = [1,2,3,4,5,6,7,8,19,20,21,22,23,24,25,26,27,28,29];
    singleHeaderCols.forEach((col) => {
      worksheet.mergeCells(1, col, 2, col);
      worksheet.getCell(1, col).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });

    // Style headers
    [1, 2].forEach((rowNum) => {
      const row = worksheet.getRow(rowNum);
      row.font = { bold: true };
      row.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "D9E1F2" }
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
    });

    // Add rows
    data.forEach((item) => {
      const obj = item.toObject();
      const rowData = {};

      for (const [key, value] of Object.entries(obj)) {
        if (key === "submittedAt" || key === "_id" || key === "__v") continue;

        // if (key === "dateOfJoining") {
        //   const date = new Date(value);
        //   rowData[key] = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
        // }
        if (key === "dateOfJoining") {
          const [day, month, year] = value.split("/");
          // console.log("day month year", day, month, year);
          // const date = new Date(`${month}/${day}/${year}`); // convert to MM/DD/YYYY
          const date = new Date(Date.UTC(year, month - 1, day));
          // console.log("date", date);
          rowData[key] = date;
        }
        else {
          rowData[key] = typeof value === "string" ? value.trim() : value;
        }
      }

      const addedRow = worksheet.addRow(rowData);
      addedRow.eachCell((cell) => {
        cell.alignment = { wrapText: true, vertical: "top" };
      });
    });

    // Send file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Feedback_Report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).json({ error: "Failed to export data" });
  }
};


const downloadNotSubmittedExcelReport = async(req, res) =>  {
  try {
    // await connectDB();

    // Get employeeIds already in feedback
    const feedbackEmployeeIds = await feedbackMaterData.find().distinct('employeeId');

    // Find employees NOT in feedback, exclude `purpose`
    const employees = await Employee.find({
      employeeId: { $nin: feedbackEmployeeIds },
    }).select('-purpose');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pending_Report');

    // Set column definitions
    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 20 },
      { header: 'Employee Name', key: 'employeeName', width: 30 },
      { header: 'Business Unit', key: 'businessUnit', width: 25 },
      { header: 'Department', key: 'department', width: 25 },
      { header: 'Designation', key: 'designation', width: 25 },
      { header: 'Date of Joining', key: 'dateOfJoining', width: 20 },
      { header: 'Reporting Head', key: 'reportingHead', width: 30 },
    ];

    // Add data rows
    employees.forEach(emp => {
      const doj = emp.dateOfJoining
        ? new Date(emp.dateOfJoining).toLocaleDateString('en-US') // mm/dd/yyyy
        : '';
      worksheet.addRow({
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        businessUnit: emp.businessUnit,
        department: emp.department,
        designation: emp.designation,
        dateOfJoining: doj,
        reportingHead: emp.reportingHead,
      });
    });

    // Wrap all cells (headers + data)
    worksheet.eachRow(row => {
      row.eachCell(cell => {
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    });

    // Export workbook
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Pending_Report.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Excel export failed:', error);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
}


export {
  fetchEmployeeDetailsByExcel,
  getEmployeesByReportingHeadId,
  addFeedBackMasterData,
  downloadExcelFeedbackReport,
  downloadNotSubmittedExcelReport
}