import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import axiosInstance from "../../../helpers/axiosInstance";
import HomeLayout from "../../../layouts/HomeLayout";

function InstructorApprovalPage() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null); // { userId, status }
  const { isLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Fetch pending instructors
  const fetchPendingInstructors = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/user/instructors/pending");
      setInstructors(data?.instructors || []);
    } catch (error) {
      console.error("Failed to fetch instructors:", error);
    } finally {
      setLoading(false);
    }
  };

  // Approve / Reject action (uses backend response directly)
  const updateStatus = async (userId, status) => {
    try {
      const { data } = await axiosInstance.put(`/user/${userId}/status`, { status });

      if (data?.success && data?.instructor) {
        setInstructors((prev) =>
          prev.map((inst) =>
            inst._id === userId ? data.instructor : inst
          )
        );
      }
    } catch (error) {
      console.error("Status update failed:", error);
    } finally {
      setConfirmAction(null);
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (isLoggedIn) {
      fetchPendingInstructors();
    }
  }, [isLoggedIn]);

  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto mt-16 p-6 text-white">
        <h2 className="text-3xl font-bold mb-6 text-center">Instructor Approvals</h2>

        <div className="mb-4 text-right">
          <button
            onClick={() => navigate("/admin/instructors")}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>

        <table className="w-full text-left bg-slate-800 rounded-lg overflow-hidden">
          <thead className="bg-slate-700 text-slate-300">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Approval Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center p-4 text-lg">
                  Loading...
                </td>
              </tr>
            ) : instructors.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center p-4 text-green-400">
                  No pending requests are available for now.
                </td>
              </tr>
            ) : (
              instructors.map((instructor) => (
                <tr key={instructor._id} className="border-t border-slate-600">
                  <td className="p-3">{instructor.name}</td>
                  <td className="p-3">{instructor.email}</td>
                  <td className="p-3">
                    <span
                      className={
                        instructor.approvalStatus === "APPROVED"
                          ? "text-green-400 font-semibold"
                          : instructor.approvalStatus === "REJECTED"
                          ? "text-red-400 font-semibold"
                          : "text-yellow-400 font-semibold"
                      }
                    >
                      {instructor.approvalStatus}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() =>
                        setConfirmAction({ userId: instructor._id, status: "APPROVED" })
                      }
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        setConfirmAction({ userId: instructor._id, status: "REJECTED" })
                      }
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Confirmation Modal */}
        {confirmAction && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-[90%] md:w-[400px] text-center shadow-lg">
              <h3 className="text-xl font-bold mb-4">
                Confirm {confirmAction.status === "APPROVED" ? "Approve" : "Reject"}
              </h3>
              <p className="mb-6">
                Are you sure you want to{" "}
                <span
                  className={
                    confirmAction.status === "APPROVED"
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {confirmAction.status === "APPROVED" ? "approve" : "reject"}
                </span>{" "}
                this instructor?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => updateStatus(confirmAction.userId, confirmAction.status)}
                  className={`px-4 py-2 rounded ${
                    confirmAction.status === "APPROVED"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}

export default InstructorApprovalPage;
