import mongoose, { Schema } from 'mongoose';

const employeeSchema = new Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  businessUnit: { type: String },
  department: { type: String },
  designation: { type: String },
  dateOfJoining: { type: Date },
  reportingHead: { type: String },
  purpose: {type : String}
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
