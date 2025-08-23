/* eslint-disable no-unused-vars */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

import axiosInstance from "../../helpers/axiosInstance";

// ================= THUNKS =================

// Submit exam request
export const submitExamRequest = createAsyncThunk(
  "exam/submitRequest",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/exam/request", { courseId });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit request");
    }
  }
);

// Fetch exam request status
export const fetchExamStatus = createAsyncThunk(
  "exam/fetchStatus",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/exam/request/status?courseId=${courseId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch status");
    }
  }
);

// Verify exam code
export const verifyExamCode = createAsyncThunk(
  "exam/verifyCode",
  async ({ courseId, examCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/exam/verify-code", { courseId, examCode });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Incorrect exam code");
    }
  }
);

// ================= SLICE =================
const initialState = {
  loading: false,
  requestSubmitted: false,
  approvalStatus: "pending", // "pending" | "approved" | "rejected"
  verificationStatus: null, // "success" | "failed"
  error: null,
  examCode: null,
};

const examSlice = createSlice({
  name: "exam",
  initialState,
  reducers: {
    resetExamState: (state) => {
      state.loading = false;
      state.requestSubmitted = false;
      state.approvalStatus = "pending";
      state.verificationStatus = null;
      state.error = null;
      state.examCode = null;
    },
  },
  extraReducers: (builder) => {
    // ===== Submit Exam Request =====
    builder.addCase(submitExamRequest.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(submitExamRequest.fulfilled, (state) => {
      state.loading = false;
      state.requestSubmitted = true;
      state.approvalStatus = "pending";
      toast.success("Exam request submitted!");
    });
    builder.addCase(submitExamRequest.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      toast.error(action.payload);
    });

    // ===== Fetch Exam Status =====
    builder.addCase(fetchExamStatus.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchExamStatus.fulfilled, (state, action) => {
      state.loading = false;
      // Backend response path: data.data.status
      const requestData = action.payload?.data?.data;
      if (requestData) {
        state.requestSubmitted = true;
        state.approvalStatus = requestData.status?.toLowerCase() || "pending";
        if (state.approvalStatus === "approved") {
          state.examCode = requestData.examCode || null;
        }
      } else {
        state.requestSubmitted = false;
        state.approvalStatus = "pending";
      }
    });
    builder.addCase(fetchExamStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      toast.error(action.payload);
    });

    // ===== Verify Exam Code =====
    builder.addCase(verifyExamCode.pending, (state) => {
      state.loading = true;
      state.verificationStatus = null;
    });
    builder.addCase(verifyExamCode.fulfilled, (state, action) => {
      state.loading = false;
      state.verificationStatus = "success";
      toast.success("Exam code verified!");
    });
    builder.addCase(verifyExamCode.rejected, (state, action) => {
      state.loading = false;
      state.verificationStatus = "failed";
      state.error = action.payload;
      toast.error(action.payload || "Incorrect exam code");
    });
  },
});

export const { resetExamState } = examSlice.actions;
export default examSlice.reducer;
