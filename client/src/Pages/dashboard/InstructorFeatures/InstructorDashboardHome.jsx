import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import axiosInstance from "../../../helpers/axiosInstance";
import HomeLayout from "../../../layouts/HomeLayout";

function InstructorDashboardHome() {
  const user = useSelector((state) => state.auth.user);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Fetch pending exam requests count
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const res = await axiosInstance.get("/exam/request/pending"); // Correct endpoint
        if (res.data.success) {
          const requests = res.data.data.requests || res.data.data || [];
          setPendingRequests(requests.length);
        }
      } catch (err) {
        console.error("Error fetching pending exam requests:", err);
      }
    };
    fetchPendingRequests();
  }, []);

  return (
    <HomeLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 gap-12">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-slate-500">
          Welcome, {user?.fullName || "Instructor"} 👋
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl px-4">
          <FeatureCard
            to="/instructor/dashboard/analytics"
            icon="📈"
            title="View Analytics"
            color="from-indigo-500 to-purple-500"
          />
          <FeatureCard
            to="/instructor/dashboard/courses"
            icon="📚"
            title="Manage My Courses"
            color="from-green-400 to-teal-500"
          />
          <FeatureCard
            to="/instructor/dashboard/students"
            icon="👨‍🎓"
            title="Manage Students"
            color="from-blue-500 to-sky-600"
          />
          <FeatureCard
            to="/instructor/dashboard/attendance"
            icon="📝"
            title="Post Attendance"
            color="from-yellow-400 to-orange-500"
          />
          <FeatureCard
            to="/instructor/dashboard/earnings"
            icon="💸"
            title="My Earnings"
            color="from-pink-500 to-rose-500"
          />
          <FeatureCard
            to="/instructor/dashboard/announcements"
            icon="📢"
            title="Announcements"
            color="from-cyan-500 to-blue-600"
          />
          {/* Exam Request Approval Card with badge */}
          <FeatureCard
            to="/instructor/dashboard/exam-requests"
            icon="📝"
            title="Exam Request Approval"
            color="from-purple-500 to-indigo-600"
            badge={pendingRequests}
            pulse={pendingRequests > 0}
          />
        </div>
      </div>
    </HomeLayout>
  );
}

const FeatureCard = ({ to, icon, title, color, badge, pulse }) => (
  <Link
    to={to}
    className={`relative bg-gradient-to-br ${color} rounded-xl text-white p-8 flex flex-col items-center justify-center text-center shadow-lg
      transform transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95
      ${pulse ? "animate-pulse" : ""}`}
  >
    {badge > 0 && (
      <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
        {badge}
      </span>
    )}
    <span className="text-5xl mb-4">{icon}</span>
    <p className="text-lg md:text-xl font-semibold">{title}</p>
  </Link>
);

export default InstructorDashboardHome;
