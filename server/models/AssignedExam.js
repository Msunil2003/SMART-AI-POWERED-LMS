// models/AssignedExam.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const assignedExamSchema = new Schema(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    examCode: {
      type: String,
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    courseTitle: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // instructor who created the exam
    },
    examName: {
      type: String,
      required: true,
    },
    setLabel: {
      type: String,
      enum: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
    },
    types: [
      {
        type: String,
        enum: ["MCQ", "DESCRIPTIVE"],
        required: true,
      },
    ],
    startAt: Date,
    endAt: Date,
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["assigned", "started", "completed"],
      default: "assigned",
    },
  
  },
  {
    timestamps: true,
  }
);

export default model("AssignedExam", assignedExamSchema);
