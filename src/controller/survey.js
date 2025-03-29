import SurveyWorkLog from "../models/survey.model.js";
import SurveyOilReport from "../models/surveyOilReport.model.js";

// const addSurveyData = async (req, res) => {
//     try {
//       const formData = req.body;
//       const userId = req.user._id;
//       // console.log("user", user);
      
//       const { date, dredger,  shift } = formData; // Extract date and shift for checking
//       formData.userId = userId;
//       // Check if a record with the same date and shift exists
//       const existingWorkLog = await SurveyWorkLog.findOne({ date, dredger, shift });
  
//       if (existingWorkLog) {
//         // If it exists, update the record
//         const updatedWorkLog = await SurveyWorkLog.findByIdAndUpdate(
//           existingWorkLog._id,
//           formData,
//           { new: true } // Return the updated document
//         );
  
//         return res.status(200).json({
//           success: true,
//           message: "Work log updated successfully.",
//           data: updatedWorkLog,
//         });
//       } else {
//         // If it doesn't exist, create a new one
//         const newWorkLog = new SurveyWorkLog(formData);
//         const savedWorkLog = await newWorkLog.save();
  
//         return res.status(201).json({
//           success: true,
//           message: "Work log created successfully.",
//           data: savedWorkLog,
//         });
//       }
//     } catch (error) {
//       console.error("Error adding/updating data:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Internal server error while adding/updating work log.",
//         error: error.message,
//       });
//     }
//   };

// const addSurveyData = async (req, res) => {
//   try {
//     const formData = req.body;
//     const userId = req.user._id;
//     formData.userId = userId;

//     const { date, dredger, shift, isNewEntry } = formData;

//     // If isNewEntry is true, create a new record without checking for duplicates
//     if (isNewEntry) {
//       const newWorkLog = new SurveyWorkLog(formData);
//       const savedWorkLog = await newWorkLog.save();

//       return res.status(201).json({
//         success: true,
//         message: "New work log saved successfully.",
//         data: savedWorkLog,
//       });
//     }

//     // Check if a record with the same date, dredger, and shift exists
//     const existingWorkLog = await SurveyWorkLog.findOne({ date, dredger, shift });

//     if (existingWorkLog) {
//       return res.status(200).json({
//         success: false,
//         message: "A Survey work log already exists. Do you want to save a new entry?",
//         requireConfirmation: true,
//       });
//     }

//     // If no existing record, create a new one
//     const newWorkLog = new SurveyWorkLog(formData);
//     const savedWorkLog = await newWorkLog.save();

//     return res.status(201).json({
//       success: true,
//       message: "Survey work log submitted successfully!",
//       data: savedWorkLog,
//     });

//   } catch (error) {
//     console.error("Error adding work log:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error while adding work log.",
//       error: error.message,
//     });
//   }
// };

const addSurveyData = async (req, res) => {
  try {
    const formData = { ...req.body, userId: req.user._id };
    const { date, dredger, shift, isNewEntry } = formData;

    console.log("Received data:", { date, dredger, shift, isNewEntry });

    if (isNewEntry) {
      const savedWorkLog = await new SurveyWorkLog(formData).save();
      console.log("New entry saved:", savedWorkLog);
      return res.status(201).json({
        success: true,
        message: "New work log saved successfully.",
        data: savedWorkLog,
      });
    }

    const existingWorkLog = await SurveyWorkLog.findOne({ date, dredger, shift });

    if (existingWorkLog) {
      return res.status(200).json({
        success: false,
        message: "A Survey work log already exists. Do you want to save a new entry?",
        requireConfirmation: true,
      });
    }

    const savedWorkLog = await new SurveyWorkLog(formData).save();
    console.log("New survey log created:", savedWorkLog);

    res.status(201).json({
      success: true,
      message: "Survey work log submitted successfully!",
      data: savedWorkLog,
    });

  } catch (error) {
    console.error("Error adding work log:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while adding work log.",
      error: error.message,
    });
  }
};

const addSurveyOilReport = async (req, res) => {
    try {
      const { date, dredger, tanks, totalVolume } = req.body;
  
      if (!date || !dredger || !tanks || typeof totalVolume !== 'number') {
        return res.status(400).json({ message: 'Missing required fields.' });
      }

      const userId = req.user._id;
  
      // Check if a record already exists for the given date and dredger
      const existingReport = await SurveyOilReport.findOne({ date, dredger });
  
      if (existingReport) {
        // Update existing record
        existingReport.tanks = tanks;
        existingReport.totalVolume = totalVolume;
        await existingReport.save();
        return res.status(200).json({ message: 'Oil report updated successfully.', report: existingReport });
      } else {
        // Create a new record
        const newReport = new SurveyOilReport({userId, date, dredger, tanks, totalVolume });
        await newReport.save();
        return res.status(201).json({ message: 'Oil report created successfully.', report: newReport });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'An error occurred.', error: error.message });
    }
  }

 const getSurveyData = async (req, res) => {
    try {
      // Fetch all data from the database
      const surveyWorkLogs = await SurveyWorkLog.find();
  
      // Map through each entry and add the production field
      const result = surveyWorkLogs.map((log) => {
        const production = log.forward * log.width * log.depth;
        return {
          ...log.toObject(),
          production,
        };
      });
  
      // Return the result
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching data' });
    }
  }

  const getSurveyOilReport = async (req, res) => {
    const { dredger } = req.body;
  
    // Set default dredger to "K7" if none is provided
    const selectedDredger = dredger || "K7";
  
    try {
      // Find all reports for the selected dredger
      const reports = await SurveyOilReport.find({ dredger: selectedDredger });
  
      if (reports.length === 0) {
        return res.status(404).json({ message: `No reports found for dredger: ${selectedDredger}` });
      }
  
      return res.status(200).json({ dredger: selectedDredger, reports });
    } catch (error) {
      console.error('Error fetching data by dredger:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  


export {
   addSurveyData,
   addSurveyOilReport,
   getSurveyData,
   getSurveyOilReport
};
