// models/ExamSet.js
import mongoose from "mongoose";

const examSetSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true }, // e.g. "Midterm - Set A"
    setLabel: { type: String, required: true }, // "A", "B", "C"
    types: [{ type: String, enum: ["MCQ", "DESCRIPTIVE"] }], // array of types
    startAt: { type: Date },
    endAt: { type: Date },
    durationMinutes: { type: Number, default: 60 },
    createdAt: { type: Date, default: Date.now },

    // Reference instead of embedding
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

    // NEW FIELDS
    isReady: { type: Boolean, default: false }, // ✅ readiness flag
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ✅ assigned students
  },
  { timestamps: true }
);

export default mongoose.model("ExamSet", examSetSchema);
