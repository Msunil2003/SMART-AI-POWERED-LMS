import Chart, {
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js/auto';
import { useEffect } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import HomeLayout from '../../../layouts/HomeLayout';
import { getPaymentsRecord } from '../../../Redux/slices/RazorpaySlice';
import { getStats } from '../../../Redux/slices/StatSlice';

Chart.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Title, Tooltip);

const AnalyticsPage = () => {
  const dispatch = useDispatch();

  // ✅ Get from correct slices
  const { allUserCount } = useSelector((state) => state.stat);
  const {
    monthlySalesRecord,
    paidUserCount,
    purchasesMade
  } = useSelector((state) => state.razorpay);

  useEffect(() => {
    dispatch(getStats());
    dispatch(getPaymentsRecord());
  }, [dispatch]);

  const userData = {
    labels: ['Registered Users', 'Paid Users'],
    datasets: [
      {
        label: 'User Breakdown',
        data: [allUserCount || 0, paidUserCount || 0],
        backgroundColor: ['#facc15', '#4ade80'],
        borderWidth: 1,
      },
    ],
  };

  const salesData = {
    labels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ],
    datasets: [
      {
        label: 'Monthly Purchases',
        data: monthlySalesRecord || Array(12).fill(0),
        borderColor: 'rgb(99, 102, 241)', // Indigo
        borderWidth: 2,
        tension: 0.3,
        fill: false,
      },
    ],
  };

  return (
    <HomeLayout>
      <div className="flex flex-col gap-10 p-6">
        <div>
          <Link to="/admin/dashboard">
            <button className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 transition duration-200">
              ← Back to Dashboard
            </button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-slate-600 text-center">
          📊 Analytics Overview (One-Time Payments)
        </h1>

        <div className="flex flex-col lg:flex-row justify-between gap-10">
          <div className="w-full lg:w-[30%]">
            <Pie data={userData} />
            <div className="mt-4 text-center text-gray-500">
              <p>📌 Purchases Made: <strong>{purchasesMade || 0}</strong></p>
              <p>🧑‍💼 Paid Users: <strong>{paidUserCount || 0}</strong></p>
            </div>
          </div>
          <div className="w-full lg:w-[70%]">
            <Line data={salesData} />
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default AnalyticsPage;
