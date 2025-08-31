import mongoose from "mongoose";

const examSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
examId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamRequest", required: true },

  examCode: { type: String, required: true },
  ipAddress: String,
  deviceInfo: String,
  faceSnapshot: String, // base64 or URL
  startTime: { type: Date, default: Date.now },
  status: { type: String, enum: ["pendingVerification", "verified", "started"], default: "pendingVerification" },
});

export default mongoose.model("ExamSession", examSessionSchema);
