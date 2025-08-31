import mongoose from "mongoose";

const proctorLogSchema = new mongoose.Schema(
  {
    proctorSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ProctorSession", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["warn", "terminate", "note"], required: true },
    message: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("ProctorLog", proctorLogSchema);
