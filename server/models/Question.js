// models/Question.js
import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    path: { type: String, required: true },        // local or cloud path
    filename: { type: String, required: true },
    originalName: { type: String, required: true }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    examSetId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSet", required: true },
    type: { type: String, enum: ["MCQ", "DESCRIPTIVE"], required: true },
    marks: { type: Number, required: true, min: 0.5 },

    prompt: { type: String, required: true },
    media: mediaSchema, // optional

    // MCQ-specific
    options: [{ type: String, trim: true }],
    correctAnswerIndex: { type: Number, min: 0 },

    // Descriptive-specific
    expectedAnswer: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
