import { useEffect } from 'react';
import { FaUsers } from 'react-icons/fa';
import { FcSalesPerformance } from 'react-icons/fc';
import { GiMoneyStack } from 'react-icons/gi';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import HomeLayout from '../../../layouts/HomeLayout';
import { getPaymentsRecord } from '../../../Redux/slices/RazorpaySlice';
import { getStats } from '../../../Redux/slices/StatSlice';

const WidgetsPage = () => {
  const dispatch = useDispatch();

  const { allUserCount } = useSelector((state) => state.stat);
  const { paidUserCount, totalRevenue, allPayments } = useSelector((state) => state.razorpay);

  useEffect(() => {
    dispatch(getStats());
    dispatch(getPaymentsRecord());
  }, [dispatch]);

  return (
    <HomeLayout>
      <div className="flex flex-col items-center gap-10 p-6">
        {/* 🔙 Back to Dashboard */}
        <div className="self-start">
          <Link to="/admin/dashboard">
            <button className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 transition">
              ← Back to Dashboard
            </button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-slate-500 text-center w-full">
          📈 LMS Stats (One-Time Payments)
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          <Widget
            icon={<FaUsers />}
            label="Registered Users"
            value={allUserCount ?? 0}
            color="text-yellow-500"
          />
          <Widget
            icon={<FaUsers />}
            label="Paid Users"
            value={paidUserCount ?? 0}
            color="text-green-500"
          />
          <Widget
            icon={<FcSalesPerformance />}
            label="Purchases Made"
            value={allPayments?.length ?? 0}
            color="text-blue-500"
          />
          <Widget
            icon={<GiMoneyStack />}
            label="Total Revenue (₹)"
            value={`₹${totalRevenue ?? 0}`}
            color="text-green-700"
          />
        </div>
      </div>
    </HomeLayout>
  );
};

const Widget = ({ icon, label, value, color }) => (
  <div className="bg-base-200 p-6 rounded-xl shadow hover:shadow-xl transition-all duration-300 transform hover:scale-105">
    <div className="flex items-center gap-4">
      <span className={`text-4xl ${color}`}>{icon}</span>
      <div>
        <p className="text-lg text-gray-400">{label}</p>
        <h2 className="text-2xl font-bold text-white">{value}</h2>
      </div>
    </div>
  </div>
);

export default WidgetsPage;
