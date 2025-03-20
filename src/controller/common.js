import operatorReport from "../models/operator.model.js";
import SurveyWorkLog from "../models/survey.model.js";
import SurveyOilReport from "../models/surveyOilReport.model.js";

const getAdminAllData = async (req, res) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  try {
    let { date, dredger, startDate, endDate } = req.body;
    // console.log("date and dredger", date, dredger, startDate, endDate);
    const dredgerOptions = ["K7", "K9", "K14", "K15"];
    let matchFilter = {};

    if (dredger) {
      if (dredger !== "All") matchFilter.dredger = dredger;
    }

    if (!date) {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const latestSurvey = await SurveyWorkLog.findOne({
        date: { $gte: tenDaysAgo.toISOString().split("T")[0] },
      })
        .sort({ date: -1 })
        .limit(1);

      // if (!latestSurvey) {
      //   return res.status(404).json({ success: false, message: "No data found in the last 10 days" });
      // }
      if (!latestSurvey) {
        return res.status(200).json({
          success: true,
          message: "No data found",
          dredger: dredger || "All",
          surveyProduction: 0,
          operatorProduction: 0,
          productionHours: "00:00",
          surveyProductionPerHour: "0.00",
          operatorProductionPerHour: "0.00",
          operatorOilConsumed: 0,
          monthlyData: {
            surveyProduction: 0,
            operatorProduction: 0,
            productionHours: "00:00",
            surveyProductionPerHour: "0.00",
            operatorProductionPerHour: "0.00",
            operatorOilConsumed: 0,
          },
        });
      }

      date = latestSurvey.date;
    }

    if (date && dredger) {
      matchFilter.date = date;
      if (dredger !== "All") matchFilter.dredger = dredger;
    }
    // if (startDate && endDate && dredger) {
    //   matchFilter.date = { $gte: startDate, $lte: endDate };
    //   if (dredger !== "All") matchFilter.dredger = dredger;
    // }

    // console.log("mathfilter", matchFilter);

    const surveyData = await SurveyWorkLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$date",
          totalSurveyProduction: {
            $sum: { $multiply: ["$forward", "$width", "$depth"] },
          },
        },
      },
    ]);

    // console.log("surveyData", surveyData);

    const operatorData = await operatorReport.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$date",
          totalOperatorProduction: {
            $sum: {
              $multiply: [
                "$workLog.forward",
                "$workLog.swing",
                "$workLog.depth",
              ],
            },
          },
        },
      },
    ]);

    const productionHoursData = await operatorReport.aggregate([
      { $match: matchFilter },
      { $unwind: "$workLog.entries" },
      { $match: { "workLog.entries.workType": "Dredging" } },
      {
        $group: {
          _id: "$date",
          totalProductionMinutes: {
            $sum: { $toInt: "$workLog.entries.duration" },
          },
          // totalProductionMinutes: {
          //     $sum: {
          //       $toInt: {
          //         $replaceAll: { input: "$workLog.entries.duration", find: " min", replacement: "" }
          //       }
          //     }
          //   },
        },
      },
    ]);

    // console.log("data", operatorData, productionHoursData)
    // console.log("ProductionHr",productionHoursData[0].totalProductionMinutes)

    function convertMinutesToHHMM(minutes) {
      const hours = Math.floor(minutes / 60); // Get whole hours
      const mins = minutes % 60; // Get remaining minutes
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    }

    let productionHours =
      productionHoursData.length > 0
        ? productionHoursData[0].totalProductionMinutes / 60
        : 0;
    let productionInHourMinutes =
      productionHoursData.length > 0
        ? convertMinutesToHHMM(
            parseInt(productionHoursData[0].totalProductionMinutes)
          )
        : 0;
    let surveyProduction =
      surveyData.length > 0 ? surveyData[0].totalSurveyProduction : 0;
    let operatorProduction =
      operatorData.length > 0 ? operatorData[0].totalOperatorProduction : 0;
    let surveyProductionPerHour =
      productionHours > 0 ? surveyProduction / productionHours : 0;
    let operatorProductionPerHour =
      productionHours > 0 ? operatorProduction / productionHours : 0;

    const operatorOilData = await operatorReport.aggregate([
      { $match: matchFilter },
      { $unwind: "$oilReport" },
      { $match: { "oilReport.name": "H.S.D" } },
      {
        $group: {
          _id: "$date",
          totalHSDConsumed: { $sum: "$oilReport.consumed" },
        },
      },
    ]);

    // console.log("operatorOilData", operatorOilData)

    let operatorOilConsumed =
      operatorOilData.length > 0 ? operatorOilData[0].totalHSDConsumed : 0;

    // survey Oil Data

    let startOfMonth;
    let startDateForMonth;

    if (!startDate && !endDate) {
      startOfMonth = new Date(date);
      startOfMonth.setDate(1);
      startDateForMonth = startOfMonth.toISOString().split("T")[0];
      endDate = date;
    } else if (startDate && endDate) {
      startDateForMonth = startDate;
    }

    const matchFilterForMonthdata = {
      date: { $gte: startDateForMonth, $lte: endDate },
    };

    // If a dredger is selected, filter by dredger name

    if (dredger) {
      if (dredger !== "All") matchFilterForMonthdata["dredger"] = dredger;
    }

    console.log("matchFilterForMonthdata", matchFilterForMonthdata);
    // const startOfMonth = new Date(date);
    // startOfMonth.setDate(1);
    // const startDateForMonth = startOfMonth.toISOString().split("T")[0];

    const monthlyData = await operatorReport.aggregate([
      // { $match: { date: { $gte: startDateForMonth, $lte: date } } },
      { $match: matchFilterForMonthdata },
      { $unwind: "$workLog.entries" },
      { $match: { "workLog.entries.workType": "Dredging" } },
      {
        $group: {
          _id: null,
          totalProductionMinutes: {
            $sum: { $toInt: "$workLog.entries.duration" },
          },
        },
      },
    ]);

    // console.log("HourMonthdata", monthlyData)

    const monthlySurveyData = await SurveyWorkLog.aggregate([
      // { $match: { date: { $gte: startDateForMonth, $lte: date } } },
      { $match: matchFilterForMonthdata },
      {
        $group: {
          _id: null,
          totalSurveyProduction: {
            $sum: { $multiply: ["$forward", "$width", "$depth"] },
          },
        },
      },
    ]);

    // console.log("monthlySurveyData", monthlySurveyData)

    const monthlyOperatorData = await operatorReport.aggregate([
      // { $match: { date: { $gte: startDateForMonth, $lte: date } } },
      { $match: matchFilterForMonthdata },
      {
        $group: {
          _id: null,
          totalOperatorProduction: {
            $sum: {
              $multiply: [
                "$workLog.forward",
                "$workLog.swing",
                "$workLog.depth",
              ],
            },
          },
        },
      },
    ]);

    const monthlyOperatorOilData = await operatorReport.aggregate([
      // { $match: { date: { $gte: startDateForMonth, $lte: date } } },
      { $match: matchFilterForMonthdata },
      { $unwind: "$oilReport" },
      { $match: { "oilReport.name": "H.S.D" } },
      {
        $group: {
          _id: null,
          totalMonthlyHSDConsumed: { $sum: "$oilReport.consumed" },
        },
      },
    ]);

    // console.log("monthlyOperatorData", monthlyOperatorData)

    let monthlyProductionHours =
      monthlyData.length > 0 ? monthlyData[0].totalProductionMinutes / 60 : 0;
    let monthlyProductionHourMinutes =
      monthlyData.length > 0
        ? convertMinutesToHHMM(monthlyData[0].totalProductionMinutes)
        : 0;
    let monthlySurveyProduction =
      monthlySurveyData.length > 0
        ? monthlySurveyData[0].totalSurveyProduction
        : 0;
    let monthlyOperatorProduction =
      monthlyOperatorData.length > 0
        ? monthlyOperatorData[0].totalOperatorProduction
        : 0;
    let monthlySurveyProductionPerHour =
      monthlyProductionHours > 0
        ? monthlySurveyProduction / monthlyProductionHours
        : 0;
    let monthlyOperatorProductionPerHour =
      monthlyProductionHours > 0
        ? monthlyOperatorProduction / monthlyProductionHours
        : 0;
    let monthlyOperatorOilConsumed =
      monthlyOperatorOilData.length > 0
        ? monthlyOperatorOilData[0].totalMonthlyHSDConsumed
        : 0;

    res.status(200).json({
      success: true,
      date,
      dredger: dredger || "All",
      surveyProduction,
      operatorProduction,
      productionHours: productionInHourMinutes,
      surveyProductionPerHour: surveyProductionPerHour.toFixed(2),
      operatorProductionPerHour: operatorProductionPerHour.toFixed(2),
      operatorOilConsumed,
      // surveyOilConsumed,
      monthlyData: {
        surveyProduction: monthlySurveyProduction,
        operatorProduction: monthlyOperatorProduction,
        productionHours: monthlyProductionHourMinutes,
        surveyProductionPerHour: monthlySurveyProductionPerHour.toFixed(2),
        operatorProductionPerHour: monthlyOperatorProductionPerHour.toFixed(2),
        operatorOilConsumed: monthlyOperatorOilConsumed,
      },
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ success: false, message: error });
  }
};

const getDredgerTotalProduction = async (req, res) => {
  try {
    const totalProduction = await SurveyWorkLog.aggregate([
      {
        $group: {
          _id: "$dredger",
          totalProduction: {
            $sum: { $multiply: ["$forward", "$width", "$depth"] },
          },
        },
      },
    ]);

    const formattedData = totalProduction.reduce((acc, dredger) => {
      acc[dredger._id] = dredger.totalProduction;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      totalProduction: formattedData,
    });
  } catch (error) {
    console.error("Error fetching total production data:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProductionDataDykewise = async (req, res) => {
  try {
    // Aggregation pipeline for dyke-wise production calculation
    const productionData = await SurveyWorkLog.aggregate([
      {
        $group: {
          _id: "$dyke",
          totalProduction: {
            $sum: { $multiply: ["$forward", "$width", "$depth"] },
          },
        },
      },
      { $sort: { _id: 1 } }, // Sort by Dyke name
    ]);

    res.status(200).json({ success: true, data: productionData });
  } catch (error) {
    console.error("Error fetching dyke-wise production:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const getProductionDataBlockWise = async (req, res) => {
  try {
    // Aggregation pipeline for block-wise production calculation
    const productionData = await SurveyWorkLog.aggregate([
      {
        $group: {
          _id: "$block",
          totalProduction: {
            $sum: { $multiply: ["$forward", "$width", "$depth"] },
          },
        },
      },
      { $sort: { _id: 1 } }, // Sort by Block name
    ]);

    res.status(200).json({ success: true, data: productionData });
  } catch (error) {
    console.error("Error fetching block-wise production:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    // year: "numeric",
  }).replace(/ /g, " ");
};



const getDateWiseSurveyProductionData = async (req, res) => {
  try {
    // console.log("hello")
    let { date, startDate, endDate, dredger } = req.body;
    let filter = {};

    let currentDate, endDateObj;

    // Ensure valid date range by swapping if startDate is greater than endDate
    if (startDate && endDate) {
      [startDate, endDate] = new Date(startDate) > new Date(endDate) ? [endDate, startDate] : [startDate, endDate];
      filter.date = { $gte: startDate, $lte: endDate }; // Set date filter for the range
      currentDate = new Date(startDate);
      endDateObj = new Date(endDate)
    } else if (date) {
      // If only a single date is provided, fetch data from the start of the month
      const startOfMonth = `${date.slice(0, 7)}-01`;
      filter.date = { $gte: startOfMonth, $lte: date };
      currentDate = new Date(startOfMonth);
      endDateObj = new Date(date);
      // startDate = new Date()
    }

    // Apply dredger filter if not "All"
    if (dredger && dredger !== "All") filter.dredger = dredger;

    // Fetch filtered work logs sorted by date
    const workLogs = await SurveyWorkLog.find(filter).sort({ date: 1 });
    const productionData = {};


    // Initialize production data with zero values for all dates in the range
    while (currentDate <= endDateObj) {
      const formattedDate = formatDate(currentDate.toISOString().split("T")[0]);
      productionData[formattedDate] = { 
        date: formattedDate, 
        production: 0, 
        dredger: dredger === "All" ? "All" : undefined 
      };
      currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
    }

    // Process work logs to accumulate production values
    
    // console.log("ProductionData", productionData);

    workLogs.forEach(({ date, dredger, forward, width, depth }) => {
      const production = forward * width * depth; // Calculate production volume
      const formattedDate = formatDate(date);
      // const key = dredger === "All" ? formattedDate : `${formattedDate}-${dredger}`;  // Key based on dredger selection
      

      // Initialize entry if not already present
      if (!productionData[formattedDate]) {
        productionData[formattedDate] = { date: formattedDate, production: 0, dredger };
      }
 
      // Accumulate production data
      productionData[formattedDate].production += production;
    });

    // Return formatted response data
    res.status(200).json(Object.values(productionData));
  } catch (error) {
    console.error("Error fetching production data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



const getDateWiseOperatorProductionData = async (req, res) => {
  try {
    let {date, startDate, endDate, dredger } = req.body;

    // console.log("one")
    // console.log("date, startDate, endDate, dredger ", date, startDate, endDate, dredger )

    let filter = {};
    let currentDate, endDateObj;
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        [startDate, endDate] = [endDate, startDate];
        currentDate = new Date(startDate);
        endDateObj = new Date(endDate);
      }
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (date) {
      const startOfMonth = date.slice(0, 7) + "-01";
      filter.date = { $gte: startOfMonth, $lte: date };
      console.log("startOfMonth", startOfMonth)
      currentDate = new Date(startOfMonth);
      endDateObj = new Date(date)
    }

    if (dredger && dredger !== "All") {
      filter.dredger = dredger; // Filter for a specific dredger
    }

    const operatorData = await operatorReport.find(filter).sort({ date: 1 });
    let responseData = [];
    const productionData = {};
 

    while (currentDate <= endDateObj) {
      console.log("date", currentDate, endDate);
      const formattedDate = formatDate(currentDate.toISOString().split("T")[0]);
      productionData[formattedDate] = { date: formattedDate, production: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // console.log("operatorProduction1", productionData);

    operatorData.forEach(log => {
      // console.log("log", log)
      const production = log.workLog.forward * log.workLog.swing * log.workLog.depth;
      // console.log("log.workLog.forward * log.workLog.swing * log.workLog.depth", log.workLog.forward * log.workLog.swing * log.workLog.depth)
      const formattedDate = formatDate(log.date);
      
      if (!productionData[formattedDate]) {
        productionData[formattedDate] = { date: formattedDate, production: 0 };
      }
      productionData[formattedDate].production += production;
    });

    console.log("operatorProduction", productionData);

    responseData = Object.values(productionData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching production data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


const getDateWiseOperatorOilConsumption = async (req, res) => {
  try {
    let { date, startDate, endDate, dredger } = req.body;
    let filter = {};
    let currentDate, endDateObj;
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        [startDate, endDate] = [endDate, startDate];
      }
      filter.date = { $gte: startDate, $lte: endDate };
      currentDate = new Date(startDate);
      endDateObj = new Date(endDate);
    } else if (date) {
      const startOfMonth = date.slice(0, 7) + "-01";
      filter.date = { $gte: startOfMonth, $lte: date };
      currentDate = new Date(startOfMonth);
      endDateObj = new Date(date)
    }

    if (dredger && dredger !== "All") {
      filter.dredger = dredger;
    }

    const oilData = await operatorReport.find(filter).sort({ date: 1 });
    let responseData = [];
    const oilConsumptionData = {};

    while (currentDate <= endDateObj) {
      const formattedDate = formatDate(currentDate.toISOString().split("T")[0]);
      oilConsumptionData[formattedDate] = { date: formattedDate, consumed: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    oilData.forEach(log => {
      const formattedDate = formatDate(log.date);
      if (!oilConsumptionData[formattedDate]) {
        oilConsumptionData[formattedDate] = { date: formattedDate, consumed: 0 };
      }

      log.oilReport.forEach(oil => {
        oilConsumptionData[formattedDate].consumed += oil.consumed || 0;
      });
    });

    responseData = Object.values(oilConsumptionData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching oil consumption data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};





export {
  getAdminAllData,
  getDredgerTotalProduction,
  getProductionDataDykewise,
  getProductionDataBlockWise,
  getDateWiseSurveyProductionData,
  getDateWiseOperatorProductionData,
  getDateWiseOperatorOilConsumption
};
