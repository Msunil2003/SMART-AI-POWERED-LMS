/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import axiosInstance from '../../../helpers/axiosInstance';
import HomeLayout from '../../../layouts/HomeLayout';
import { getPaymentsRecord } from '../../../Redux/slices/RazorpaySlice';

function PaymentsPage() {
  const dispatch = useDispatch();
  const { allPayments } = useSelector((state) => state.razorpay);

  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    dispatch(getPaymentsRecord());
  }, [dispatch]);

  const handleEmailSend = async (paymentId) => {
    setLoadingId(paymentId);
    try {
      toast.info('Sending receipt email...', { autoClose: 2000 });
      const { data } = await axiosInstance.post(`/payments/send-receipt/${paymentId}`);
      toast.success(data.message || 'Receipt sent successfully');
      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send receipt');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <HomeLayout>
      <div className="p-6 max-w-7xl mx-auto bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 shadow-md rounded-lg">
        <h2 className="text-3xl font-bold text-white mb-6">📋 All Payments</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 border border-gray-700 rounded-lg shadow-sm text-white">
            <thead className="bg-gray-700 text-white text-left">
              <tr>
                <th className="py-3 px-4">User Email</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allPayments.map((payment) => (
                <tr key={payment._id} className="border-t border-gray-700 hover:bg-gray-700 transition-all duration-150">
                  <td className="py-3 px-4">{payment?.user?.email || 'N/A'}</td>
                  <td className="py-3 px-4">{payment.payment_id}</td>
                  <td className="py-3 px-4">{payment.order_id}</td>
                  <td className="py-3 px-4">
                    {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3 px-4">₹{payment.amount || 999}</td>
                  <td className="py-3 px-4 flex flex-wrap items-center gap-2">
                    {/* 🔽 View Receipt */}
                    <a
                      href={`http://localhost:5000/uploads/receipts/${payment.payment_id}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition duration-150 text-sm"
                    >
                      🔽 View
                    </a>

                    {/* ✉️ Email Receipt */}
                    <button
                      onClick={() => handleEmailSend(payment._id)}
                      className={`px-3 py-1 rounded text-sm transition duration-150 ${
                        loadingId === payment._id
                          ? 'bg-gray-500 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      disabled={loadingId === payment._id}
                    >
                      {loadingId === payment._id ? '⏳ Sending...' : '✉️ Email'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {allPayments.length === 0 && (
            <p className="text-center text-slate-400 py-10">No payment records yet.</p>
          )}
        </div>
      </div>
    </HomeLayout>
  );
}

export default PaymentsPage;
