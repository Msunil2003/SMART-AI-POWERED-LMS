import mongoose from "mongoose";

const violationLogSchema = new mongoose.Schema(
  {
    examSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSession", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    detectedBy: { type: String, enum: ["AI", "Proctor"], default: "AI" },
    type: { 
      type: String, 
      enum: ["no_face", "multiple_faces", "tab_switch", "mobile_detected", "background_noise", "manual_flag"], 
      required: true 
    },
    confidence: { type: Number, default: null }, // probability from AI
    message: { type: String },
    snapshotUrl: { type: String }, // optional: screenshot / webcam image
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("ViolationLog", violationLogSchema);
