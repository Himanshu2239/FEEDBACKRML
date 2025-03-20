// Adjust the path as needed
import SurveyWorkLog from "../models/survey.model.js";
import operatorReport from "../models/operator.model.js";
import SurveyOilReport from "../models/surveyOilReport.model.js";

// Example API endpoint for fetching production details

const fetchProductionDetailsForGivenDate = async (req, res) => {
  try {
    // Destructure inputs from request body
    const { dredger, date, view } = req.body;

    if ((view === "Survey" || view === "Operator") && !dredger) {
      return res.status(400).json({ message: "Unsupported view" });
    }

    // Determine which dredgers to include:
    // If dredger is "All", use the array below; otherwise, only the specified dredger.
    const dredgerList =
      dredger === "All" ? ["K7", "K9", "K14", "K15"] : [dredger];

    // This object will hold the calculated production details per dredger.
    const recordsByDredger = {};
    // Initialize operator hours individually for each dredger.
    let operatorHoursByDredger = {};
    dredgerList.forEach((d) => (operatorHoursByDredger[d] = 0));

    // This will be the date used for the calculation.
    let recordDate = null;
    // Message to be sent if no record is found.
    let noUpdateMessage = "";

    if (date) {
      // When a specific date is provided, query SurveyWorkLog records matching the given date, dredger(s) and both shifts.
      //This is when view ==="Survey"
      let records;
      if (view === "Survey") {
        records = await SurveyWorkLog.find({
          date: date,
          dredger: { $in: dredgerList },
          shift: { $in: ["Day", "Night"] },
        }).lean();
      } else if (view === "Operator") {
        //This is when view==="Operator"
        records = await operatorReport
          .find({
            date: date,
            dredger: { $in: dredgerList },
            shift: { $in: ["Day", "Night"] },
          })
          .lean();
      }

      if (!records || records.length === 0) {
        noUpdateMessage = "No update found for the given date.";
      }
      // Query operatorReport for the same date and conditions.
      const reports = await operatorReport
        .find({
          date: date,
          dredger: { $in: dredgerList },
          shift: { $in: ["Day", "Night"] },
        })
        .lean();

      // Process operator reports individually per dredger.
      reports.forEach((report) => {
        if (report.workLog && Array.isArray(report.workLog.entries)) {
          report.workLog.entries.forEach((entry) => {
            if (entry.workType === "Dredging") {
              const durationValue = parseFloat(entry.duration);
              if (
                !isNaN(durationValue) &&
                report.dredger &&
                dredgerList.includes(report.dredger)
              ) {
                operatorHoursByDredger[report.dredger] += durationValue;
                // You can uncomment the next line to see each duration added:
                // console.log(`Added ${durationValue} for ${report.dredger}`);
              }
            }
          });
        }
      });

      // For each dredger, aggregate production from SurveyWorkLog records.
      for (let d of dredgerList) {
        const filtered = records.filter((rec) => rec.dredger === d);
        if (filtered.length > 0) {
          let totalProduction = 0;
          filtered.forEach((rec) => {
            if (view === "Survey") {
              totalProduction += rec.forward * rec.width * rec.depth;
            } else if (view === "Operator") {
              totalProduction +=
                rec.workLog.forward * rec.workLog.swing * rec.workLog.depth;
            }
          });
          recordsByDredger[d] = {
            production: totalProduction,
            totalHours: Number(operatorHoursByDredger[d] / 60),
            efficiency: Number((operatorHoursByDredger[d] / 60 / 24) * 100),
          };
        } else {
          recordsByDredger[d] = {
            production: 0,
            totalHours: 0,
            efficiency: 0,
          };
        }
      }
      recordDate = date;
    } else {
      // When no date is provided, iterate backwards over the last 30 days (starting from yesterday)
      // and stop as soon as a day with any SurveyWorkLog record is found.
      const today = new Date();
      let foundDate = null;

      for (let i = 1; i <= 30; i++) {
        const queryDate = new Date();
        queryDate.setDate(today.getDate() - i);
        const formattedDate = queryDate.toISOString().slice(0, 10);

        // const records = await SurveyWorkLog.find({
        //   date: formattedDate,
        //   dredger: { $in: dredgerList },
        //   shift: { $in: ["Day", "Night"] },
        // });
        let records;
        if (view === "Survey") {
          records = await SurveyWorkLog.find({
            date: formattedDate,
            dredger: { $in: dredgerList },
            shift: { $in: ["Day", "Night"] },
          }).lean();
        } else if (view === "Operator") {
          //This is when view==="Operator"
          records = await operatorReport
            .find({
              date: formattedDate,
              dredger: { $in: dredgerList },
              shift: { $in: ["Day", "Night"] },
            })
            .lean();
        }

        if (records && records.length > 0) {
          foundDate = formattedDate;
          // Query operator reports for this found date.
          const reports = await operatorReport
            .find({
              date: foundDate,
              dredger: { $in: dredgerList },
              shift: { $in: ["Day", "Night"] },
            })
            .lean();

          // Reinitialize operatorHoursByDredger for this date.
          operatorHoursByDredger = {};
          dredgerList.forEach((d) => (operatorHoursByDredger[d] = 0));

          reports.forEach((report) => {
            if (report.workLog && Array.isArray(report.workLog.entries)) {
              report.workLog.entries.forEach((entry) => {
                if (entry.workType === "Dredging") {
                  const durationValue = parseFloat(entry.duration);
                  if (
                    !isNaN(durationValue) &&
                    report.dredger &&
                    dredgerList.includes(report.dredger)
                  ) {
                    operatorHoursByDredger[report.dredger] += durationValue;
                  }
                }
              });
            }
          });

          for (let d of dredgerList) {
            const filtered = records.filter((rec) => rec.dredger === d);
            if (filtered.length > 0) {
              let totalProduction = 0;
              filtered.forEach((rec) => {
                // totalProduction += rec.forward * rec.width * rec.depth;
                if (view === "Survey") {
                  totalProduction += rec.forward * rec.width * rec.depth;
                } else if (view === "Operator") {
                  totalProduction +=
                    rec.workLog.forward * rec.workLog.swing * rec.workLog.depth;
                }
              });
              recordsByDredger[d] = {
                production: totalProduction,
                totalHours: Number(operatorHoursByDredger[d] / 60),
                efficiency: Number((operatorHoursByDredger[d] / 60 / 24) * 100),
              };
            } else {
              recordsByDredger[d] = {
                production: 0,
                totalHours: 0,
                efficiency: 0,
              };
            }
          }
          break; // Stop iterating once records are found.
        }
      }
      if (!foundDate) {
        noUpdateMessage = "No update in last 30 days.";
        dredgerList.forEach((d) => {
          recordsByDredger[d] = {
            production: 0,
            totalHours: 0,
            efficiency: 0,
          };
        });
      } else {
        recordDate = foundDate;
      }
    }

    // Calculate cumulative values if required.
    let cumulative = {
      production: 0,
      totalHours: 0,
      efficiency: 0,
    };
    dredgerList.forEach((d) => {
      cumulative.production += recordsByDredger[d].production;
      cumulative.totalHours += recordsByDredger[d].totalHours || 0;
      cumulative.efficiency += recordsByDredger[d].efficiency;
    });
    if (dredger === "All" && dredgerList.length > 0) {
      cumulative.efficiency = cumulative.efficiency / dredgerList.length;
    }

    return res.json({
      date: recordDate,
      details: { ...recordsByDredger, all: cumulative },
      message: noUpdateMessage,
    });
  } catch (error) {
    console.error("Error in fetchProductionDetails:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const fetchProductionDetailsForGivenRange = async (req, res) => {
  try {
    let { dredger, startDate, endDate, view } = req.body;
    // Only "survey" view is supported.
    if ((view === "Survey" || view === "Operator") && !endDate && !startDate) {
      return res.status(400).json({ message: "Unsupported view" });
    }

    // Determine which dredgers to include.
    const dredgerList =
      dredger === "All" ? ["K7", "K9", "K14", "K15"] : [dredger];

    // Query SurveyWorkLog records for the given date range.
    // const surveyRecords = await SurveyWorkLog.find({
    //   date: { $gte: startDate, $lte: endDate },
    //   dredger: { $in: dredgerList },
    //   shift: { $in: ["Day", "Night"] },
    // });
    let surveyRecords;
    if (view === "Survey") {
      surveyRecords = await SurveyWorkLog.find({
        date: { $gte: startDate, $lte: endDate },
        dredger: { $in: dredgerList },
        shift: { $in: ["Day", "Night"] },
      }).lean();
    } else if (view === "Operator") {
      //This is when view==="Operator"
      surveyRecords = await operatorReport
        .find({
          date: { $gte: startDate, $lte: endDate },
          dredger: { $in: dredgerList },
          shift: { $in: ["Day", "Night"] },
        })
        .lean();
    }

    // Query operatorReport records for the given date range.
    const operatorReports = await operatorReport
      .find({
        date: { $gte: startDate, $lte: endDate },
        dredger: { $in: dredgerList },
        shift: { $in: ["Day", "Night"] },
      })
      .lean();

    // Initialize operator hours individually for each dredger.
    const operatorHoursByDredger = {};
    dredgerList.forEach((d) => {
      operatorHoursByDredger[d] = 0;
    });

    // Aggregate operator report durations per dredger.
    operatorReports.forEach((report) => {
      if (report.workLog && Array.isArray(report.workLog.entries)) {
        report.workLog.entries.forEach((entry) => {
          if (entry.workType === "Dredging") {
            const durationValue = parseFloat(entry.duration);
            if (
              !isNaN(durationValue) &&
              report.dredger &&
              dredgerList.includes(report.dredger)
            ) {
              operatorHoursByDredger[report.dredger] += durationValue;
            }
          }
        });
      }
    });
    // For debugging:
    // console.log("operatorHoursByDredger", operatorHoursByDredger);

    // Calculate the number of days in the range.
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysInRange = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // For each dredger, aggregate SurveyWorkLog production.
    const recordsByDredger = {};
    dredgerList.forEach((d) => {
      const filtered = surveyRecords.filter((rec) => rec.dredger === d);
      let totalProduction = 0;
      filtered.forEach((rec) => {
        // totalProduction += rec.forward * rec.width * rec.depth;
        if (view === "Survey") {
          totalProduction += rec.forward * rec.width * rec.depth;
        } else if (view === "Operator") {
          totalProduction +=
            rec.workLog.forward * rec.workLog.swing * rec.workLog.depth;
        }
      });
      // Convert operator minutes to hours.
      const totalHours = operatorHoursByDredger[d] / 60;
      // Efficiency is the percentage of available hours (24 per day) used.
      const efficiency = (totalHours / (daysInRange * 24)) * 100;
      recordsByDredger[d] = {
        production: totalProduction,
        totalHours: Number(totalHours),
        efficiency: Number(efficiency),
      };
    });

    // Compute cumulative values over all dredgers.
    let cumulative = {
      production: 0,
      totalHours: 0,
      efficiency: 0,
    };
    dredgerList.forEach((d) => {
      cumulative.production += recordsByDredger[d].production;
      cumulative.totalHours += recordsByDredger[d].totalHours;
      cumulative.efficiency += recordsByDredger[d].efficiency;
    });
    // For "All", average efficiency over the number of dredgers.
    if (dredger === "All" && dredgerList.length > 0) {
      cumulative.efficiency = cumulative.efficiency / dredgerList.length;
    }

    return res.json({
      startDate,
      endDate,
      details: { ...recordsByDredger, all: cumulative },
    });
  } catch (error) {
    console.error("Error in fetchProductionDetailsForGivenRange:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//this api will response afer fetchProductionDetailsForGivenDate
const serveyOilConsumedForGivenDate = async (req, res) => {
  try {
    const { date, dredger, view } = req.body;

    // Validate date presence and format
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use yyyy-mm-dd" });
    }
    const givenDateObj = new Date(date);
    if (isNaN(givenDateObj.getTime())) {
      return res.status(400).json({ message: "Invalid date provided" });
    }

    // Determine yesterday's date string
    const yesterdayObj = new Date(givenDateObj);
    yesterdayObj.setDate(givenDateObj.getDate() - 1);
    const year = yesterdayObj.getFullYear();
    const month = String(yesterdayObj.getMonth() + 1).padStart(2, "0");
    const day = String(yesterdayObj.getDate()).padStart(2, "0");
    const yesterdayDateString = `${year}-${month}-${day}`;

    // If dredger is "All", use the full list; otherwise, a single-element array.
    const dredgerList =
      dredger === "All" ? ["K7", "K9", "K14", "K15"] : [dredger];

    let results = [];
    let cumulativeTotal = 0;

    if (view === "Survey") {
      // For each dredger, process survey view calculations
      for (const d of dredgerList) {
        // Fetch today's survey report for the given dredger (no shift field in SurveyOilReport)
        const surveyToday = await SurveyOilReport.findOne({
          date: date,
          dredger: d,
        })
          .select("totalVolume")
          .lean();

        // Fetch yesterday's survey report for the given dredger
        const surveyYesterday = await SurveyOilReport.findOne({
          date: yesterdayDateString,
          dredger: d,
        })
          .select("totalVolume")
          .lean();

        // If one of the survey reports is missing, include an error in the result for that dredger
        if (!surveyToday || !surveyYesterday) {
          results.push({
            dredger: d,
            error: "Survey oil report not found for one or both dates",
          });
          continue;
        }

        // Fetch operator reports from yesterday (using select and lean for faster response)
        const operatorReports = await operatorReport
          .find({
            date: yesterdayDateString,
            dredger: d,
            shift: { $in: ["Day", "Night"] },
          })
          .select("oilReport")
          .lean();

        let totalReceived = 0;
        let totalIssued = 0;
        operatorReports.forEach((report) => {
          if (Array.isArray(report.oilReport) && report.oilReport.length > 0) {
            totalReceived += report.oilReport[0].received || 0;
            totalIssued += report.oilReport[0].issued || 0;
          }
        });

        // Calculate consumed oil using the provided algorithm
        const consumed =
          surveyToday.totalVolume -
          surveyYesterday.totalVolume +
          (totalReceived - totalIssued);
        cumulativeTotal += consumed;

        results.push({
          dredger: d,
          consumed,
          surveyTodayVolume: surveyToday.totalVolume,
          surveyYesterdayVolume: surveyYesterday.totalVolume,
          totalReceived,
          totalIssued,
        });
      }

      return res.status(200).json({ results, cumulative: cumulativeTotal });
    } else if (view === "Operator") {
      // For each dredger, process operator view calculations
      for (const d of dredgerList) {
        // Fetch today's operator reports for the given dredger
        const operatorReports = await operatorReport
          .find({
            date: date,
            dredger: d,
            shift: { $in: ["Day", "Night"] },
          })
          .select("oilReport")
          .lean();

        let dredgerConsumed = 0;
        operatorReports.forEach((report) => {
          if (Array.isArray(report.oilReport) && report.oilReport.length > 0) {
            dredgerConsumed += report.oilReport[0].consumed || 0;
          }
        });
        cumulativeTotal += dredgerConsumed;

        results.push({
          dredger: d,
          consumed: dredgerConsumed,
        });
      }
      return res.status(200).json({ results, cumulative: cumulativeTotal });
    } else {
      return res.status(400).json({ message: "Invalid view provided" });
    }
  } catch (error) {
    console.error("Error calculating consumed oil:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const surveyOilConsumedForGivenRange = async (req, res) => {
  try {
    const { startDate, endDate, view, dredger } = req.body;

    // Validate required parameters and date formats
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "startDate and endDate are required" });
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use yyyy-mm-dd" });
    }
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      return res.status(400).json({ message: "Invalid date provided" });
    }
    if (startObj > endObj) {
      return res
        .status(400)
        .json({ message: "startDate cannot be after endDate" });
    }

    // Determine dredger list
    const dredgerList =
      dredger === "All" ? ["K7", "K9", "K14", "K15"] : [dredger];

    let overallCumulative = 0;
    let results = [];

    // Build an array of dates in the range (inclusive)
    let currentDate = new Date(startObj);
    let dateArray = [];
    while (currentDate <= endObj) {
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
      const dd = String(currentDate.getDate()).padStart(2, "0");
      dateArray.push(`${yyyy}-${mm}-${dd}`);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // For each dredger, iterate over each date in the range
    for (const d of dredgerList) {
      let dredgerTotal = 0;
      let dailyResults = [];

      for (const date of dateArray) {
        let consumed = 0;

        if (view === "Survey") {
          // Calculate yesterday's date for current date
          const givenDateObj = new Date(date);
          const yesterdayObj = new Date(givenDateObj);
          yesterdayObj.setDate(givenDateObj.getDate() - 1);
          const yYear = yesterdayObj.getFullYear();
          const yMonth = String(yesterdayObj.getMonth() + 1).padStart(2, "0");
          const yDay = String(yesterdayObj.getDate()).padStart(2, "0");
          const yesterdayDateString = `${yYear}-${yMonth}-${yDay}`;

          // Fetch today's survey report for the given dredger
          const surveyToday = await SurveyOilReport.findOne({
            date: date,
            dredger: d,
          })
            .select("totalVolume")
            .lean();

          // Fetch yesterday's survey report for the given dredger
          const surveyYesterday = await SurveyOilReport.findOne({
            date: yesterdayDateString,
            dredger: d,
          })
            .select("totalVolume")
            .lean();

          // If any survey report is missing, record the error for that day
          if (!surveyToday || !surveyYesterday) {
            dailyResults.push({
              date,
              error: "Survey oil report not found for one or both dates",
            });
            continue;
          }

          // Fetch yesterday's operator reports for this dredger
          const operatorReports = await operatorReport
            .find({
              date: yesterdayDateString,
              dredger: d,
              shift: { $in: ["Day", "Night"] },
            })
            .select("oilReport")
            .lean();

          let totalReceived = 0;
          let totalIssued = 0;
          operatorReports.forEach((report) => {
            if (
              Array.isArray(report.oilReport) &&
              report.oilReport.length > 0
            ) {
              totalReceived += report.oilReport[0].received || 0;
              totalIssued += report.oilReport[0].issued || 0;
            }
          });

          consumed =
            surveyToday.totalVolume -
            surveyYesterday.totalVolume +
            (totalReceived - totalIssued);
        } else if (view === "Operator") {
          // For Operator view, fetch operator reports for the given date and sum consumed
          const operatorReports = await operatorReport
            .find({
              date: date,
              dredger: d,
              shift: { $in: ["Day", "Night"] },
            })
            .select("oilReport")
            .lean();

          operatorReports.forEach((report) => {
            if (
              Array.isArray(report.oilReport) &&
              report.oilReport.length > 0
            ) {
              consumed += report.oilReport[0].consumed || 0;
            }
          });
        } else {
          return res.status(400).json({ message: "Invalid view provided" });
        }

        dredgerTotal += consumed;
        dailyResults.push({ date, consumed });
      }

      overallCumulative += dredgerTotal;
      results.push({
        dredger: d,
        totalConsumed: dredgerTotal,
        daily: dailyResults,
      });
    }

    return res.status(200).json({ results, cumulative: overallCumulative });
  } catch (error) {
    console.error("Error calculating consumed oil for given range:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export {
  fetchProductionDetailsForGivenDate,
  fetchProductionDetailsForGivenRange,
  serveyOilConsumedForGivenDate,
  surveyOilConsumedForGivenRange,
};
