/* eslint-disable no-unused-vars */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';

import axiosInstance from '../../helpers/axiosInstance';
import { loadUser } from './AuthSlice';

const PURCHASE_AMOUNT = 999;

const initialState = {
  key: '',
  order_id: '',
  allPayments: [],
  finalMonths: {},
  monthlySalesRecord: [],
  paidUserCount: 0,
  purchasesMade: 0,
  totalRevenue: 0,
};

//
// ✅ Get Razorpay Key
//
export const getRazorpayKey = createAsyncThunk('/razorpay/getKey', async () => {
  try {
    const response = await axiosInstance.get('/payments/key');
    return response.data;
  } catch (error) {
    toast.error(error?.response?.data?.message || 'Failed to get Razorpay key');
    throw error;
  }
});

//
// ✅ Create One-Time Purchase Order
//
export const purchaseCourseBundle = createAsyncThunk('/purchaseCourse', async () => {
  try {
    const response = await axiosInstance.post('/payments/buy');
    return response.data;
  } catch (error) {
    toast.error(error?.response?.data?.message || 'Failed to create order');
    throw error;
  }
});

//
// ✅ Verify Razorpay Payment
//
export const verifyUserPayment = createAsyncThunk('/verifyPayment', async (data, thunkAPI) => {
  try {
    toast.loading('Wait! Verifying payment...', { position: 'top-center' });

    const response = await axiosInstance.post('/payments/verify', {
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_order_id: data.razorpay_order_id,
      razorpay_signature: data.razorpay_signature,
    });

    toast.dismiss();
    toast.success(response?.data?.message || 'Payment verified');

    await thunkAPI.dispatch(loadUser());

    return response.data;
  } catch (error) {
    toast.dismiss();
    toast.error(error?.response?.data?.message || 'Payment verification failed');
    throw error;
  }
});

//
// ✅ Cancel Purchase + Refund
//
export const cancelPurchase = createAsyncThunk('/cancelPurchase', async () => {
  try {
    toast.loading('Processing cancellation...', { position: 'top-center' });
    const response = await axiosInstance.post('/payments/cancel');
    toast.dismiss();
    toast.success(response.data?.message || 'Refund processed');
    return response.data;
  } catch (error) {
    toast.dismiss();
    toast.error(error?.response?.data?.message || 'Refund failed');
    throw error;
  }
});

//
// ✅ Admin: Get All Payments + Stats
//
export const getPaymentsRecord = createAsyncThunk('/paymentsRecord', async () => {
  try {
    toast.loading('Getting payment records...', { position: 'top-center' });
    const response = await axiosInstance.get('/payments?count=100');
    toast.dismiss();
    toast.success(response.data?.message || 'Records fetched');
    return response.data;
  } catch (error) {
    toast.dismiss();
    toast.error(error?.response?.data?.message || 'Failed to get payment records');
    throw error;
  }
});

//
// ✅ Razorpay Slice
//
const razorpaySlice = createSlice({
  name: 'razorpay',
  initialState,
  reducers: {
    resetRazorpayState: (state) => {
      state.key = '';
      state.order_id = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRazorpayKey.fulfilled, (state, action) => {
        state.key = action.payload?.key;
      })
      .addCase(purchaseCourseBundle.fulfilled, (state, action) => {
        state.order_id = action.payload?.order?.id;
      })
      .addCase(getPaymentsRecord.fulfilled, (state, action) => {
        state.allPayments = action.payload?.payments || [];
        state.finalMonths = action.payload?.monthlyBreakdown || {};
        state.monthlySalesRecord = action.payload?.monthlySalesRecord || [];
        state.paidUserCount = action.payload?.paidUserCount || 0;
        state.purchasesMade = action.payload?.purchasesMade || 0;
        state.totalRevenue = action.payload?.totalRevenue || 0;
      })
      .addCase(cancelPurchase.fulfilled, (state, action) => {
        // Reflect refund changes in dashboard
        if (state.purchasesMade > 0) state.purchasesMade -= 1;
        if (state.paidUserCount > 0) state.paidUserCount -= 1;
        if (state.totalRevenue >= PURCHASE_AMOUNT) {
          state.totalRevenue -= PURCHASE_AMOUNT;
        }
      });
  },
});

export const { resetRazorpayState } = razorpaySlice.actions;
export default razorpaySlice.reducer;
