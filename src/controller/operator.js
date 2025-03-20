

import operatorReport from "../models/operator.model.js";


const addOperatorReport = async (req, res) => {
    try {
        const { date, shift, dredger, workLog, oilReport } = req.body;
        const userId = req.user._id;
        console.log("userId", userId);

        // Validate required fields
        if (!date || !shift || !dredger || !workLog || !oilReport) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // Check for an existing report
        const existingReport = await operatorReport.findOne({ date, shift, dredger });

        if (existingReport) {
            // Update the existing report with new data
            existingReport.workLog.forward = workLog.forward;
            existingReport.workLog.swing = workLog.swing;
            existingReport.workLog.depth = workLog.depth;
            existingReport.workLog.meReading = workLog.meReading;
            existingReport.workLog.aeReading = workLog.aeReading;
            existingReport.workLog.dgReading = workLog.dgReading;
            existingReport.workLog.entries = workLog.entries;
            existingReport.oilReport = oilReport;

            await existingReport.save();
            return res.status(200).json({ message: "Report updated successfully." });
        }

        // Create a new report
        const newReport = new operatorReport({
            userId,
            date,
            shift,
            dredger,
            workLog: {
                forward: workLog.forward,
                swing: workLog.swing,
                depth: workLog.depth,
                meReading: workLog.meReading,
                aeReading: workLog.aeReading,
                dgReading: workLog.dgReading,
                entries: workLog.entries,
            },
            oilReport,
        });

        await newReport.save();
        res.status(201).json({ message: "Report submitted successfully." });
    } catch (error) {
        console.error("Error submitting report:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const getOperatorReport = async (req, res) => {
    try {
        const reports = await operatorReport.find({});

        // Process the data to calculate dredging duration in hh:mm format
        const processedReports = reports.map((report) => {
            let totalDredgingMinutes = 0;

            report.workLog.entries.forEach((entry) => {
                if (entry.workType === "Dredging") {
                    totalDredgingMinutes += parseInt(entry.duration, 10);
                }
            });

            const dredgingHours = Math.floor(totalDredgingMinutes / 60);
            const dredgingMinutes = totalDredgingMinutes % 60;
            const dredgingDuration = `${dredgingHours.toString().padStart(2, "0")}:${dredgingMinutes.toString().padStart(2, "0")}`;

            
            // Calculate production (forward * swing * depth)
            const forward = parseFloat(report.workLog.forward) || 0;
            const swing = parseFloat(report.workLog.swing) || 0;
            const depth = parseFloat(report.workLog.depth) || 0;
            const production = forward * swing * depth;

            return {
                ...report._doc, // Spread the original document
                dredgingDuration,   // Add calculated dredging duration in hh:mm format
                production
            };
        });

        res.status(200).json(processedReports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// async (req, res) => {
//     try {
//       const reports = await operatorReport.find({});

//       // Process the data to calculate dredging hour
//       const processedReports = reports.map((report) => {
//         let totalDredgingMinutes = 0;

//         report.workLog.entries.forEach((entry) => {
//           if (entry.workType === "Dredging") {
//             const [hours, minutes] = entry.duration.split(":").map(Number);
//             totalDredgingMinutes += hours * 60 + minutes;
//           }
//         });

//         const dredgingHours = Math.floor(totalDredgingMinutes / 60);
//         const dredgingMinutes = totalDredgingMinutes % 60;
//         const dredgingHour = `${dredgingHours}h ${dredgingMinutes}m`;

//         return {
//           ...report._doc, // Spread the original document
//           dredgingHour,   // Add calculated dredging hour
//         };
//       });

//       res.status(200).json(processedReports);
//     } catch (error) {
//       console.error("Error fetching reports:", error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   };

// const getOpeningBalace = async (req, res) => {
//     const { date, shift, dredger } = req.body;

//     if (!date || !shift || !dredger) {
//         return res.status(400).json({ error: "Date, shift, and dredger are required." });
//     }

//     try {
//         const selectedDate = new Date(date);

//         // Determine previous shift based on the current shift
//         // if(shift === )
//         const previousShift = shift === "Day" ? "Night" : "Day";

//         // Check data for the past 10 days
//         const tenDaysAgo = new Date(selectedDate);
//         tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

//         const previousReports = await operatorReport.find({
//             dredger,
//             shift: previousShift,
//             date: { $gte: tenDaysAgo.toISOString().split("T")[0], $lt: selectedDate.toISOString().split("T")[0] },
//         }).sort({ date: -1 }); // Sort by date descending to get the latest data

//         console.log("previous report", previousReports[0].oilReport);

//         if (previousReports.length > 0) {
//             // Use the C/B (Closing Balance) of the most recent previous report as O/B (Opening Balance)
//             const latestReport = previousReports[0];
//             const oilOB = latestReport.oilReport.map(oil => ({
//                 name: oil.name,
//                 OB: oil.balance || 0, // Use balance as O/B
//             }));

//             return res.json({ oilOB });
//         }

//         // If no previous data is found, return dummy data
//         const dummyData = [
//             { name: "H.S.D", OB: 100 },
//             { name: "15 W 40", OB: 150 },
//             { name: "H.Y.D.68", OB: 200 },
//             { name: "Grease", OB: 50 },
//             { name: "Coolant", OB: 75 },
//             { name: "Compound", OB: 120 },
//         ];

//         return res.json({ oilOB: dummyData });
//     } catch (error) {
//         console.error("Error fetching O/B data:", error);
//         return res.status(500).json({ error: "Internal Server Error." });
//     }
// }

const getOpeningBalance = async (req, res) => {
    const { date, shift, dredger } = req.body;

    // console.log("hello") 

    // console.log("data", date, shift, dredger)

    // res.status(200).send("ok working")

    if (!date || !shift || !dredger) {
        return res.status(400).json({ error: "Date, shift, and dredger are required." });
    }

    try {
        const selectedDate = new Date(date);

        const results = [];
        const tenDaysAgo = new Date(selectedDate);
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const shifts = ["Day", "Night"]; // Array to alternate between shifts

        // Loop through 10 days (starting from the selected date and going backwards)
        for (let i = 0; i < 10; i++) {
            const currentDate = new Date(selectedDate);
            currentDate.setDate(currentDate.getDate() - i);

            // Check shifts in the order for the given scenario
            if (shift === "Day") {
                // Scenario 1: "Day" shift, look for "Night" of the current date first
                for (let j = 1; j >= 0; j--) {
                    const currentShift = shifts[j];
                    const report = await operatorReport.findOne({
                        dredger,
                        shift: currentShift,
                        date: currentDate.toISOString().split("T")[0],
                    });

                    if (report) {
                        results.push(report);
                        break; // Break after finding the first report for this date
                    }
                }
            } else if (shift === "Night") {
                // Scenario 2: "Night" shift, look for "Day" of the current date first
                for (let j = 0; j < 2; j++) {
                    const currentShift = shifts[j];
                    const report = await operatorReport.findOne({
                        dredger,
                        shift: currentShift,
                        date: currentDate.toISOString().split("T")[0],
                    });

                    if (report) {
                        results.push(report);
                        break; // Break after finding the first report for this date
                    }
                }
            }

            // Stop searching if at least one result is found
            if (results.length > 0) {
                break;
            }
        }

        if (results.length > 0) {
            // Use the C/B (Closing Balance) of the most recent report as O/B (Opening Balance)
            const latestReport = results[0];
            // const date = latestReport.date;
            // const shift = latestReport.shift;
            // console.log("latestReport", latestReport)
            const oilOB = latestReport.oilReport.map((oil) => ({
                name: oil.name,
                OB: oil.balance || 0, // Use balance as O/B
               
            }));

            // oilOB.date = date
            // oilOB.shift = shift

            // return res.status(200).json({ ...oilOB, date, shift });
            return res.status(200).json({
                success: true,
                data: {
                    oilOB, 
                    date: latestReport.date, 
                    shift: latestReport.shift,
                    dredger
                }
            });
        }

        // If no previous data is found, return dummy data
        const dummyData = [
            { name: "H.S.D", OB: 0 },
            { name: "15 W 40", OB: 0 },
            { name: "H.Y.D.68", OB: 0 },
            { name: "Grease", OB: 0 },
            { name: "Coolant", OB: 0 },
            { name: "Compound", OB: 0 },
        ];

        // return res.status(200).json({ oilOB: dummyData });
        return res.status(200).json({
            success: true,
            data: {
                oilOB: dummyData,
                date,
                shift,
                dredger
            }
        });
    } catch (error) {
        console.error("Error fetching O/B data:", error);
        return res.status(500).json({ error: "Internal Server Error." });
    }
};


//   export { addOperatorWorkLog, addOilReportByOperator, getOilReportByDate }


export { addOperatorReport, getOpeningBalance, getOperatorReport }