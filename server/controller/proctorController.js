import ProctorSession from "../models/ProctorSession.js"; // we'll create this model
import ExamSession from "../models/ExamSession.js";
import User from "../models/userModel.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

// ================= CREATE PROCTOR SESSION =================
export const createProctorSession = async (req, res) => {
  try {
    const { examSessionId } = req.body;

    if (!examSessionId)
      return res.status(400).json({ message: "examSessionId is required" });

    const examSession = await ExamSession.findById(examSessionId);
    if (!examSession)
      return res.status(404).json({ message: "Exam session not found" });

    // Instructor can only start session for own students / courses
    if (
      req.user.role === "INSTRUCTOR" &&
      examSession.examId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const session = await ProctorSession.create({
      examSession: examSessionId,
      instructor: req.user._id,
      status: "ongoing",
      aiLogs: [],
      manualLogs: [],
      startedAt: new Date(),
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= END PROCTOR SESSION =================
export const endProctorSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ProctorSession.findById(sessionId);

    if (!session)
      return res.status(404).json({ message: "Proctor session not found" });

    session.status = "ended";
    session.endedAt = new Date();
    await session.save();

    res.json({ success: true, message: "Proctor session ended", session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= LOG MANUAL PROCTOR ACTION =================
export const logProctorAction = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action, note } = req.body;

    const session = await ProctorSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    session.manualLogs.push({
      action,
      note,
      loggedBy: req.user._id,
      timestamp: new Date(),
    });

    await session.save();
    res.json({ success: true, message: "Action logged", session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= LOG AI DETECTED VIOLATION =================
export const logViolation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { type, description } = req.body; // e.g., "face-not-detected", "multiple-persons"
    const snapshot = req.file ? req.file.buffer.toString("base64") : null;

    const session = await ProctorSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    session.aiLogs.push({
      type,
      description,
      snapshot,
      detectedAt: new Date(),
    });

    await session.save();
    res.json({ success: true, message: "Violation logged", session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET ALL PROCTOR SESSIONS =================
export const getProctorSessions = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "INSTRUCTOR") {
      query.instructor = req.user._id;
    }

    const sessions = await ProctorSession.find(query)
      .populate("examSession")
      .populate("instructor", "name email");

    res.json({ success: true, sessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET EXAM REPORT =================
export const getExamReport = async (req, res) => {
  try {
    const { examSessionId } = req.params;

    const session = await ProctorSession.findOne({
      examSession: examSessionId,
    })
      .populate("examSession")
      .populate("instructor", "name email");

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.json({ success: true, report: session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET STUDENT VIOLATIONS =================
export const getStudentViolations = async (req, res) => {
  try {
    const { studentId } = req.params;

    const sessions = await ProctorSession.find()
      .populate({
        path: "examSession",
        match: { studentId: mongoose.Types.ObjectId(studentId) },
      })
      .populate("instructor", "name email");

    const violations = sessions
      .filter((s) => s.examSession)
      .map((s) => s.aiLogs)
      .flat();

    res.json({ success: true, violations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
