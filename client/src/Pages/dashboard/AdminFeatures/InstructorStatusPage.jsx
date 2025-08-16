import { useEffect, useState } from "react";

import axiosInstance from "../../../helpers/axiosInstance"; // adjust path as needed
import HomeLayout from "../../../layouts/HomeLayout";

function InstructorStatusPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile with approvalStatus, name, email
  const fetchProfile = async () => {
    try {
      const { data } = await axiosInstance.get("/user/myprofile");
      setUser(data.user);
    } catch (error) {
      console.error("Failed to fetch user profile:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Define stages for tracker
  const stages = [
    { id: 1, name: "Instructor Invite" },
    { id: 2, name: "Instructor Signup" },
    { id: 3, name: "Admin Approval" },
  ];

  // Determine current stage based on approvalStatus
  // We consider Invite & Signup done, waiting on Admin Approval
  // (since user is on this page, first two are completed)
  let currentStage = 3;
  if (!user) currentStage = 0;

  if (user?.approvalStatus?.toUpperCase() === "APPROVED") {
    currentStage = 4; // all done
  }

  return (
    <HomeLayout>
      <div className="max-w-3xl mx-auto mt-16 p-6 bg-slate-900 text-white rounded-lg shadow-md">
        {loading ? (
          <p className="text-center text-lg">Loading your status...</p>
        ) : user ? (
          <>
            <h1 className="text-3xl font-semibold mb-6 text-center">
              Instructor Registration Status
            </h1>

            <p className="mb-6 text-lg">
              Dear <span className="font-bold">{user.name}</span>,
            </p>
            <p className="mb-6">
              Your registration as an Instructor with the email{" "}
              <span className="font-mono bg-gray-700 px-2 py-1 rounded">{user.email}</span> is
              currently in status:{" "}
              <span
                className={`font-semibold ${
                  user.approvalStatus.toUpperCase() === "PENDING"
                    ? "text-yellow-400"
                    : user.approvalStatus.toUpperCase() === "APPROVED"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {user.approvalStatus}
              </span>
              .
            </p>
            {user.approvalStatus.toUpperCase() === "PENDING" && (
              <p className="mb-6">
                Please wait for the admin to review and approve your Instructor account. You
                will be notified once the approval process is complete.
              </p>
            )}
            {user.approvalStatus.toUpperCase() === "REJECTED" && (
              <p className="mb-6 text-red-400 font-semibold">
                Unfortunately, your registration was rejected. Please contact support for details.
              </p>
            )}

            {/* Tracker UI */}
            <div className="mt-10">
              <ol className="flex justify-between">
                {stages.map((stage, idx) => {
                  const stageNumber = idx + 1;
                  const isCompleted = stageNumber < currentStage;
                  const isCurrent = stageNumber === currentStage;
                  return (
                    <li key={stage.id} className="flex-1 text-center relative">
                      <div
                        className={`mx-auto mb-2 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          isCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : isCurrent
                            ? "border-yellow-400 text-yellow-400"
                            : "border-gray-500 text-gray-500"
                        }`}
                      >
                        {isCompleted ? "✓" : stageNumber}
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          isCompleted
                            ? "text-green-500"
                            : isCurrent
                            ? "text-yellow-400"
                            : "text-gray-500"
                        }`}
                      >
                        {stage.name}
                      </p>

                      {/* Lines between steps */}
                      {idx < stages.length - 1 && (
                        <div
                          className={`absolute top-5 right-[-50%] w-full h-1 ${
                            isCompleted ? "bg-green-500" : "bg-gray-600"
                          }`}
                          style={{ zIndex: -1 }}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </>
        ) : (
          <p className="text-center text-red-400">Failed to load user information.</p>
        )}
      </div>
    </HomeLayout>
  );
}

export default InstructorStatusPage;
