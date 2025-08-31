/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import axiosInstance from "../../helpers/axiosInstance";
import HomeLayout from "../../layouts/HomeLayout";

function ExamRequests() {
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true); // global fetch loader
  const [requests, setRequests] = useState([]);
  const [actionLoading, setActionLoading] = useState(null); // store requestId when approving/rejecting

  // Fetch pending exam requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const endpoint =
        user?.role === "ADMIN"
          ? "/exam/request/pending-admin"
          : "/exam/request/pending";

      const res = await axiosInstance.get(endpoint);
      if (res.data.success) {
        const fetchedRequests = res.data.data.requests || res.data.data || [];
        setRequests(fetchedRequests);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load exam requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const handleAction = async (requestId, action) => {
    setActionLoading(requestId); // set loader for this request card
    try {
      const baseEndpoint =
        user?.role === "ADMIN"
          ? `/exam/request/${action}-admin/${requestId}`
          : `/exam/request/${action}/${requestId}`;

      const res = await axiosInstance.put(baseEndpoint);
      if (res.data.success) {
        toast.success(`Request ${action}ed successfully`);
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null); // remove loader
    }
  };

  return (
    <HomeLayout>
      <div className="min-h-[70vh] p-6">
        <h1 className="text-3xl font-bold mb-6 text-slate-600">
          Pending Exam Requests
        </h1>

        {loading ? (
          <p className="text-gray-500 animate-pulse">
            Loading pending requests...
          </p>
        ) : requests.length === 0 ? (
          <p className="text-gray-500">No pending exam requests.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => (
              <div
                key={req._id}
                className="bg-gray-800 rounded-xl p-6 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {req.user?.name}
                  </h2>
                  <p className="text-gray-300">{req.user?.email}</p>
                  <p className="text-gray-400 mt-2">
                    Course:{" "}
                    <span className="font-medium">
                      {req.course?.title || "N/A"}
                    </span>
                  </p>
                  <p className="text-gray-400 mt-1">
                    Requested at:{" "}
                    {new Date(req.createdAt).toLocaleString()}
                  </p>
                  <p className="text-gray-400 mt-1">
                    Created by:{" "}
                    <span className="font-medium">
                      {req.course?.createdBy?.name || "N/A"}
                    </span>
                  </p>
                </div>

                <div className="flex mt-4 gap-2">
                  <button
                    onClick={() => handleAction(req._id, "approve")}
                    disabled={actionLoading === req._id}
                    className={`flex-1 py-2 rounded-lg font-semibold transition ${
                      actionLoading === req._id
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                  >
                    {actionLoading === req._id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleAction(req._id, "reject")}
                    disabled={actionLoading === req._id}
                    className={`flex-1 py-2 rounded-lg font-semibold transition ${
                      actionLoading === req._id
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {actionLoading === req._id ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </HomeLayout>
  );
}

export default ExamRequests;
