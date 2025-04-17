import xlsx from 'xlsx';
import Employee from '../models/employee.model.js';
import  { feedbackMaterData } from '../models/feedback.model.js';


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
    const feedbackEntries = data.map(row => {
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
        trainingRecommendations,
        confirmationStatus,
        rationale,
        remarks
      ] = row.fields;

      return {
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
        trainingRecommendations,
        confirmationStatus,
        rationale,
        remarks,
      };
    });

    // Save all entries to the DB
    await feedbackMaterData.insertMany(feedbackEntries);

    return res.status(200).json({ message: "Feedback submitted successfully." });

  } catch (err) {
    console.error("Error saving feedback:", err);
    return res.status(500).json({ message: "Server error." });
  }
}



export {
  fetchEmployeeDetailsByExcel,
  getEmployeesByReportingHeadId,
  addFeedBackMasterData,
}