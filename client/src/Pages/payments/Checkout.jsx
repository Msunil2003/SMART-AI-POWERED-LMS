import { useEffect, useRef } from 'react';
import { BsCurrencyRupee } from 'react-icons/bs';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import HomeLayout from '../../layouts/HomeLayout';
import { loadUser } from '../../Redux/slices/AuthSlice';
import {
  getRazorpayKey,
  purchaseCourseBundle,
  verifyUserPayment
} from '../../Redux/slices/RazorpaySlice';

function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state } = useLocation();
  const hasFetched = useRef(false); // ✅ prevent multiple order creations

  const razorpay = useSelector((state) => state.razorpay);
  const userdata = useSelector((state) => state.auth?.data);

  // ✅ Handle payment via Razorpay
  async function handleOneTimePayment() {
    if (!razorpay?.key || !razorpay?.order_id) {
      toast.error("Payment setup failed. Please refresh the page.");
      return;
    }

    if (!window.Razorpay) {
      toast.error("Razorpay SDK not loaded");
      return;
    }

    const options = {
      key: razorpay.key,
      amount: 99900, // ₹999 in paise
      currency: "INR",
      name: "Smart LMS",
      description: "1 Year Full Access Bundle",
      order_id: razorpay.order_id,
      prefill: {
        email: userdata?.email || '',
        name: userdata?.name || ''
      },
      theme: {
        color: "#1A73E8"
      },
      handler: async function (response) {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

        try {
          const res = await dispatch(verifyUserPayment({
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
          })).unwrap(); // ✅ throws error if failed

          await dispatch(loadUser());

          if (res?.success) {
            navigate(`/course/${state?.title}/checkout/success`, { state });
          } else {
            navigate(`/course/${state?.title}/checkout/fail`, { state });
          }
        } catch (err) {
          console.error("❌ Payment verification failed", err);
          navigate(`/course/${state?.title}/checkout/fail`, { state });
        }
      },
      modal: {
        ondismiss: () => {
          navigate(`/course/${state?.title}/checkout/fail`, { state });
        }
      }
    };

    const paymentObj = new window.Razorpay(options);
    paymentObj.open();
  }

  // ✅ Fetch key and order ID on mount
  async function onLoad() {
    await dispatch(getRazorpayKey());
    await dispatch(purchaseCourseBundle());
  }

  useEffect(() => {
    if (!state) {
      navigate("/courses");
    } else if (!hasFetched.current) {
      hasFetched.current = true;
      document.title = 'Checkout - Smart LMS';
      onLoad();
    }
  }, []);

  return (
    <HomeLayout>
      <div className='lg:h-screen flex justify-center items-center mb-6 lg:mb-0'>
        <div className='lg:w-1/3 w-11/12 m-auto bg-white rounded-lg shadow-lg flex flex-col gap-4 justify-center items-center pb-4'>
          <h1 className='bg-yellow-500 text-black font-bold text-3xl w-full text-center py-3 rounded-t-lg'>
            One-Time Course Access
          </h1>

          <p className='px-4 text-xl tracking-wider text-slate-500 text-center'>
            This one-time payment gives you access to all current and future courses for
            <span className='text-2xl text-blue-500 font-bold'> 1 year.</span>
          </p>

          <p className='text-slate-500 text-xl font-semibold px-4 text-center'>
            Includes all current + future launches.
          </p>

          <p className='flex gap-1 items-center text-xl justify-center text-green-500'>
            <BsCurrencyRupee /> <span className='text-3xl font-bold'>999</span> only
          </p>

          <p className='text-red-500 text-center text-sm'>
            100% refund if cancelled within 14 days
          </p>

          <button
            className='btn btn-primary w-[90%]'
            onClick={handleOneTimePayment}
          >
            Pay Now
          </button>
        </div>
      </div>
    </HomeLayout>
  );
}

export default Checkout;
