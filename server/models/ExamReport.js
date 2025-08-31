import mongoose from "mongoose";

const examReportSchema = new mongoose.Schema(
  {
    examSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSession", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    violations: [{ type: mongoose.Schema.Types.ObjectId, ref: "ViolationLog" }],
    proctorLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProctorLog" }],

    riskScore: { type: Number, default: 0 }, // AI score (0–100)
    status: { type: String, enum: ["clear", "suspicious", "cheating"], default: "clear" },

    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("ExamReport", examReportSchema);
