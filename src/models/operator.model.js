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
    // meReading: Number,
    // aeReading: Number,
    // dgReading: Number,
    meReading: { type: Number, default: null },
    aeReading: { type: Number, default: null },
    dgReading: { type: Number, default: null },
    lcReading: { type: Number, default: null },
    entries: [workEntrySchema],
  },
  oilReport: [oilReportSchema],
},
{
  timestamps:true,
});

const operatorReport = mongoose.model("operatorReport", reportSchema);

export default operatorReport;
