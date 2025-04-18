import mongoose from "mongoose";


const FeedbackSchema = new mongoose.Schema({
  slNo: String,
  employeeId: String,
  employeeName: String,
  businessUnit: String,
  department: String,
  designation: String,
  dateOfJoining: String,
  reportingHead: String,
  kra: String,
  kpi1Target: String,
  kpi1Achievement: String,
  kpi2Target: String,
  kpi2Achievement: String,
  kpi3Target: String,
  kpi3Achievement: String,
  kpi4Target: String,
  kpi4Achievement: String,
  kpi5Target: String,
  kpi5Achievement: String,
  overallKpiAchievement: String,
  knowledgeExpertise: String,
  attitudeApproach: String,
  initiativeProactivity: String,
  teamworkCollaboration: String,
  adaptabilityLearning: String,
  communicationSkills: String,
  attendancePunctuality: String,
  areasForImprovement: String,
  // trainingRecommendations: String,
  confirmationStatus: String,
  // rationale: String,
  remarks: String,
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

export const feedbackMaterData = mongoose.model("feedbackMaterData", FeedbackSchema);
