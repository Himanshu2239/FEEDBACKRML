// import mongoose from "mongoose";

// // WorkLog Schema
// const operatorWorkLogSchema = new mongoose.Schema({
//     date: { type: String, required: true },
//     shift: { type: String, required: true },
//     dredger: { type: String, required: true },
//     forward: { type: Number, required: true },
//     swing: { type: Number, required: true },
//     depth: { type: Number, required: true },
//     meReading: { type: Number, required: true },
//     aeReading: { type: Number, required: true },
//     dgReading: { type: Number, required: true },
//     entries: [
//       {
//         startTime: { type: String, required: true },
//         endTime: { type: String, required: true },
//         description: { type: String },
//         workType: { type: String, default: 'Dredging' },
//         duration: { type: String },
//       },
//     ],
//   },
//   {
//     timestamps: true,
//   }
// );
  
//   // OperatorWorkLog Model
//   const OperatorWorkLog = mongoose.model('OperatorWorkLog', operatorWorkLogSchema);

//   export default OperatorWorkLog;


import mongoose from "mongoose";

const workEntrySchema = new mongoose.Schema({
  startTime: String,
  endTime: String,
  description: String,
  workType: String,
  duration: String,
});

const oilReportSchema = new mongoose.Schema({
  name: String,
  OB: Number,
  received: Number,
  issued: Number,
  consumed: Number,
  balance: Number,
  remarks: String,
});

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Added userID
  date: { type: String, required: true },
  shift: { type: String, required: true },
  dredger: { type: String, required: true },
  workLog: {
    forward: Number,
    swing: Number,
    depth: Number,
    meReading: Number,
    aeReading: Number,
    dgReading: Number,
    entries: [workEntrySchema],
  },
  oilReport: [oilReportSchema],
},
{
  timestamps:true,
});

const operatorReport = mongoose.model("operatorReport", reportSchema);

export default operatorReport;
