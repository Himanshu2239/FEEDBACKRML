import mongoose from 'mongoose';

const TankSchema = new mongoose.Schema({
  tankName: { type: String, required: true },
  height: { type: Number, required: true },
  volume: { type: Number, required: true },
});

const OilReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Added userID
  date: { type: String, required: true }, // Storing date as string for simplicity
  time: {type: String},
  dredger: { type: String, required: true },
  tanks: [TankSchema],
  totalVolume: { type: Number, required: true },
  totalVolumeOperator: { type: Number, required: true },
  remark: {type: String}
}, { timestamps: true });

const SurveyOilReport = mongoose.model('SurveyOilReport', OilReportSchema);

export default SurveyOilReport;
