/* eslint-disable no-unused-vars */
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import HomeLayout from '../../../layouts/HomeLayout';

function InstructorOnboardingHome() {
  const user = useSelector((state) => state.auth.user);

  return (
    <HomeLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 gap-12">
        <div className="w-full max-w-6xl px-4 flex justify-start">
          <Link
            to="/admin/dashboard"
            className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md shadow hover:bg-slate-300 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-slate-500">
          Instructor Onboarding 👋
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl px-4">
          <FeatureCard
            to="/admin/instructors/invite"
            icon="✉️"
            title="Invite Instructor"
            color="from-teal-400 to-cyan-500"
          />
          <FeatureCard
            to="/admin/instructors/approvals"
            icon="⏳"
            title="Pending Approvals"
            color="from-purple-500 to-indigo-600"
          />
          <FeatureCard
            to="/admin/instructors/active"
            icon="✅"
            title="Active Instructors"
            color="from-green-500 to-lime-500"
          />
          <FeatureCard
            to="/admin/instructors/analytics"
            icon="📊"
            title="Instructor Analytics"
            color="from-yellow-400 to-orange-500"
          />
          <FeatureCard
            to="/admin/instructors/courses"
            icon="📘"
            title="Manage Instructor Courses"
            color="from-blue-400 to-sky-500"
          />
          <FeatureCard
            to="/admin/instructors/flagged"
            icon="🚩"
            title="Flagged Instructors"
            color="from-red-400 to-rose-500"
          />
          <FeatureCard
            to="/admin/instructors/suspend"
            icon="🚫"
            title="Suspend Instructor"
            color="from-gray-500 to-zinc-600"
          />
          <FeatureCard
            to="/admin/instructors/announce"
            icon="📢"
            title="Send Announcement"
            color="from-pink-500 to-fuchsia-600"
          />
        </div>
      </div>
    </HomeLayout>
  );
}

const FeatureCard = ({ to, icon, title, color }) => (
  <Link
    to={to}
    className={`bg-gradient-to-br ${color} rounded-xl text-white p-8 flex flex-col items-center justify-center text-center shadow-lg 
    transform transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95`}
  >
    <span className="text-5xl mb-4">{icon}</span>
    <p className="text-lg md:text-xl font-semibold">{title}</p>
  </Link>
);

export default InstructorOnboardingHome;
