import mongoose from "mongoose";

const proctorSessionSchema = new mongoose.Schema(
  {
    examSetId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSet", required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    roomId: { type: String, required: true }, // WebRTC / Socket.IO room
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("ProctorSession", proctorSessionSchema);
