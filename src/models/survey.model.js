// import mongoose from "mongoose";

// const SurveyWorkLogSchema = new mongoose.Schema({
//   date: { type: String, required: true },
//   dredger: { type: String, required: true },
//   dayNight: { type: String, required: true },
//   forward: { type: Number, required: true },
//   width: { type: Number, required: true },
//   depth: { type: Number, required: true },
//   dyke: { type: String, required: true },
//   block: { type: String, required: true },
// },
// {
//   timestamps: true
// }
// );

// const SurveyWorkLog = mongoose.model("SurveyWorkLog", SurveyWorkLogSchema);

// export default SurveyWorkLog;


import mongoose from "mongoose";

// Enum Options
const shiftOptions = ["Day", "Night"];
const dredgerOptions = ["K7", "K9", "K14", "K15"];
const dykeOptions = Array.from({ length: 16 }, (_, i) => `Dyke ${i + 1}`);
const blockOptions = ["Block A", "Block B", "Block C"];

// Survey Work Log Schema
const SurveyWorkLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Added userID
    date: { type: String, required: true },
    dredger: { type: String, enum: dredgerOptions, required: true },
    shift: { type: String, enum: shiftOptions, required: true },
    forward: { type: Number, required: true },
    width: { type: Number, required: true },
    depth: { type: Number, required: true },
    dyke: { type: String, enum: dykeOptions, required: true },
    block: { type: String, enum: blockOptions, required: true },
  },
  {
    timestamps: true,
  }
);

const SurveyWorkLog = mongoose.model("SurveyWorkLog", SurveyWorkLogSchema);

export default SurveyWorkLog;

