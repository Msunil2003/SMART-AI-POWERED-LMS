// models/examRequestModel.js
import mongoose from "mongoose";

const examRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    examCode: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const ExamRequest = mongoose.model("ExamRequest", examRequestSchema);
export default ExamRequest;
