import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { verifyUserPayment } from '../../Redux/slices/RazorpaySlice';

function CheckoutResponse() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const payment_id = query.get("razorpay_payment_id");
    const order_id = query.get("razorpay_order_id");
    const signature = query.get("razorpay_signature");

    const verifyPayment = async () => {
      try {
        if (payment_id && order_id && signature) {
          const res = await dispatch(
            verifyUserPayment({ payment_id, order_id, razorpay_signature: signature })
          );

          if (res?.payload?.success) {
            navigate('/course/all-access/checkout/success');
          } else {
            navigate('/course/all-access/checkout/fail');
          }
        } else {
          navigate('/course/all-access/checkout/fail');
        }
      } catch (error) {
        console.error("Verification error:", error);
        navigate('/course/all-access/checkout/fail');
      }
    };

    verifyPayment();
  }, [dispatch, location.search, navigate]);

  return (
    <h1 className="text-center text-xl mt-10 text-yellow-600 font-semibold">
      Verifying your payment...
    </h1>
  );
}

export default CheckoutResponse;
