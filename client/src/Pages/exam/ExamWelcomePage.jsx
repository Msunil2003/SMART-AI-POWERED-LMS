/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import axiosInstance from "../../helpers/AxiosInstance.js";

export default function ExamWelcomePage() {
  const { examCode } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [step, setStep] = useState(1); // 1: Start, 2: Rules, 3: Countdown
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [timeUp, setTimeUp] = useState(false);

  const timerRef = useRef(null);

  // ================= Fetch exam info =================
  useEffect(() => {
    const fetchExamInfo = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/exam/session-details/${examCode}`);
        if (data.success) {
          setSessionData(data.data);
        } else {
          toast.error(data.message || "Failed to fetch exam info.");
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to fetch exam info.");
      } finally {
        setLoading(false);
      }
    };
    if (examCode) fetchExamInfo();
  }, [examCode]);

  // ================= Start Countdown =================
  const startCountdown = () => {
    if (!sessionData) return;

    const examStartTime = new Date(sessionData.exam.startDate).getTime();
    const examDurationMs = sessionData.exam.durationMinutes * 60 * 1000;
    const examEndTime = examStartTime + examDurationMs;
    const now = Date.now();
    let remaining = Math.max(examEndTime - now, 0);

    if (remaining <= 0) {
      setTimeUp(true);
      return;
    }

    setStep(3); // Move to countdown view

    timerRef.current = setInterval(() => {
      remaining -= 1000;
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setTimeUp(true);
      } else {
        const hrs = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setCountdown(
          `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(
            2,
            "0"
          )}`
        );
      }
    }, 1000);
  };

  // ================= Redirect after timeUp =================
  useEffect(() => {
    if (timeUp) {
      const timeout = setTimeout(() => {
        navigate(`/exam/${sessionData.exam.code}`);
      }, 5000); // wait 5 sec before redirect
      return () => clearTimeout(timeout);
    }
  }, [timeUp, navigate, sessionData]);

  if (loading) return <div className="text-center mt-20">Loading exam details...</div>;
  if (!sessionData) return <div className="text-center mt-20">Exam session not found.</div>;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 shadow-md">
        <h1 className="text-3xl font-bold text-center">SMART LMS Online Proctoring</h1>
      </header>

      <main className="flex flex-col items-center p-6 flex-grow">
        <div className="max-w-4xl w-full bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-2xl font-semibold text-center">Welcome, {sessionData.user.name}!</h2>

          {/* Exam & Course Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded shadow-sm">
              <h3 className="font-semibold mb-2">Exam Details</h3>
              <ul className="space-y-1">
                <li><strong>Exam Name:</strong> {sessionData.exam.name}</li>
                <li><strong>Exam Code:</strong> {sessionData.exam.code}</li>
                <li><strong>Exam Types:</strong> {sessionData.exam.types?.join(", ") || "N/A"}</li>
                <li><strong>Set:</strong> {sessionData.exam.setLabel || "N/A"}</li>
                <li><strong>Start Time:</strong> {new Date(sessionData.exam.startDate).toLocaleString()}</li>
                <li><strong>End Time:</strong> {new Date(sessionData.exam.endDate).toLocaleString()}</li>
                <li><strong>Duration:</strong> {sessionData.exam.durationMinutes} mins</li>
              </ul>
            </div>

            <div className="p-4 border rounded shadow-sm">
              <h3 className="font-semibold mb-2">Course Info</h3>
              <ul className="space-y-1">
                <li><strong>Course:</strong> {sessionData.course.name}</li>
                <li><strong>Instructor:</strong> {sessionData.course.creatorName}</li>
              </ul>
            </div>
          </div>

          {/* Step 1: Start Exam */}
          {step === 1 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Start Exam
              </button>
            </div>
          )}

          {/* Step 2: Rules */}
          {step === 2 && (
            <div className="p-4 border rounded shadow-md bg-yellow-50 mt-4">
              <h3 className="font-semibold mb-2 text-center">AI Proctoring Rules</h3>
              <ol className="list-decimal list-inside space-y-1 mb-4">
                <li>Keep your webcam and microphone on at all times during the exam.</li>
                <li>Do not leave your desk or switch tabs/windows.</li>
                <li>Ensure no one else is present in your room during the exam.</li>
                <li>Do not use any mobile phone or electronic device.</li>
                <li>Face must remain visible at all times for AI monitoring.</li>
                <li>Violation of these rules may result in automatic disqualification.</li>
              </ol>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="acceptRules"
                  checked={acceptedRules}
                  onChange={() => setAcceptedRules(!acceptedRules)}
                  className="w-4 h-4"
                />
                <label htmlFor="acceptRules" className="text-gray-700">
                  I have read and accept the rules
                </label>
              </div>
              <button
                disabled={!acceptedRules}
                onClick={startCountdown}
                className={`px-6 py-3 text-white rounded ${
                  acceptedRules ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Submit 
              </button>
            </div>
          )}

          {/* Step 3: Countdown */}
          {step === 3 && !timeUp && (
            <div className="text-center mt-6">
              <p className="text-xl font-semibold">Exam will start soon...</p>
              <p className="text-3xl font-bold mt-2">{countdown}</p>
            </div>
          )}

          {/* Step 4: Time Up Message */}
          {timeUp && (
            <div className="text-center mt-6">
              <p className="text-xl font-semibold text-red-600">
                You are now entering into AI proctoring. Everything is monitored.
              </p>
              <p className="mt-2">You will be redirected to the exam page shortly...</p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white p-4 text-center">
        © {new Date().getFullYear()} SMART LMS. All rights reserved.
      </footer>
    </div>
  );
}
