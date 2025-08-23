/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { fetchExamStatus, submitExamRequest, verifyExamCode } from "../../Redux/slices/examSlice";

function ExamRegistration() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: courseId } = useParams();

  const { loading, requestSubmitted, approvalStatus } = useSelector((state) => state.exam);
  const user = useSelector((state) => state.auth.user?.user || state.auth.user);

  const [examCode, setExamCode] = useState("");

  // Fetch exam status on mount to pre-populate tracker
  useEffect(() => {
    if (user?._id && courseId) {
      dispatch(fetchExamStatus(courseId));
    }
  }, [user?._id, courseId, dispatch]);

  // Poll backend while request is pending
  useEffect(() => {
    if (!requestSubmitted || approvalStatus !== "pending") return;

    const interval = setInterval(() => {
      dispatch(fetchExamStatus(courseId));
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [requestSubmitted, approvalStatus, courseId, dispatch]);

  // Handle exam request submission
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!courseId) return toast.error("Course ID is missing!");
    dispatch(submitExamRequest(courseId));
  };

  // Handle exam code verification
  const handleExamCodeSubmit = (e) => {
    e.preventDefault();
    if (!examCode || examCode.length !== 6) return toast.error("Enter the 6-digit exam code sent to your email");

    dispatch(verifyExamCode({ courseId, examCode })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        navigate(`/exam/start/${examCode}`);
      }
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-lg font-semibold animate-pulse">Loading your information...</p>
      </div>
    );
  }

  // Tracker stages
  const stages = [
    { label: "Requested", description: "Waiting for submission", status: requestSubmitted ? "completed" : "pending" },
    {
      label: "Instructor Approval",
      description: "Instructor is reviewing your request",
      status:
        requestSubmitted && approvalStatus === "pending"
          ? "current"
          : ["approved", "rejected"].includes(approvalStatus)
          ? "completed"
          : "pending",
    },
    { label: "Exam Access", description: "Enter your exam code to start", status: approvalStatus === "approved" ? "current" : "pending" },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-6">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Exam Registration</h2>

        {/* Stage Tracker */}
        {requestSubmitted && approvalStatus !== "approved" && (
          <div className="flex justify-between mb-10 px-4">
            {stages.map((stage, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center relative">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 text-xl font-bold z-10 shadow-lg transition-all duration-500 ${
                    stage.status === "completed"
                      ? "bg-green-500 text-white"
                      : stage.status === "current"
                      ? "bg-yellow-500 text-white animate-pulse"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {stage.status === "completed" ? "✔" : idx + 1}
                </div>
                <span className="text-sm font-semibold text-center">{stage.label}</span>
                <p className="text-xs text-gray-400 text-center mt-1">{stage.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Request Form */}
        {!requestSubmitted && (
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <input type="text" value={user.name} readOnly className="w-full p-3 rounded-lg bg-gray-700 text-gray-300 cursor-not-allowed" />
            <input type="email" value={user.email} readOnly className="w-full p-3 rounded-lg bg-gray-700 text-gray-300 cursor-not-allowed" />
            <button type="submit" disabled={loading} className={`w-full py-3 rounded-lg font-semibold transition ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"}`}>
              {loading ? "Submitting..." : "Request Exam Access"}
            </button>
          </form>
        )}

        {/* Exam code input after approval */}
        {requestSubmitted && approvalStatus === "approved" && (
          <form onSubmit={handleExamCodeSubmit} className="space-y-4 mt-4">
            <p className="text-gray-300 mb-2">Your request has been approved! Enter the 6-digit exam code:</p>
            <input
              type="text"
              maxLength={6}
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
              placeholder="- - - - - -"
              className="w-full text-center text-2xl tracking-widest p-3 rounded-lg bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <button type="submit" className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 font-semibold transition">
              Start Exam
            </button>
          </form>
        )}

        {/* Rejected message */}
        {requestSubmitted && approvalStatus === "rejected" && (
          <p className="text-red-400 mt-4">Your exam request was rejected. Contact the instructor for more info.</p>
        )}
      </div>
    </div>
  );
}

export default ExamRegistration;
