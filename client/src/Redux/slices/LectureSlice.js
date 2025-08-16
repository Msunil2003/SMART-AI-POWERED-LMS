import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

import axiosInstance from "../../helpers/axiosInstance";

const initialState = {
  lecturesByCourse: {}, // { [courseId]: [] }
  loading: false,
};

const handleError = (error, rejectWithValue) => {
  const message = error?.response?.data?.message || error.message || "Something went wrong";
  toast.error(message);
  return rejectWithValue(message);
};

// ====================== GET LECTURES ======================
export const getLectures = createAsyncThunk(
  "lecture/get",
  async (courseId, { getState, rejectWithValue }) => {
    if (!courseId) return rejectWithValue("Invalid course ID");
    const toastId = toast.loading("Fetching lectures...", { position: "top-center" });
    try {
      const res = await axiosInstance.get(`/course/${courseId}/lectures`);
      toast.dismiss(toastId);

      if (res.status === 200) {
        const { auth } = getState();
        const userHasAccess = auth?.role === "ADMIN" || auth?.data?.access?.valid;

        const lecturesWithAccess = (res.data.lectures || []).map((lec) => ({
          ...lec,
          userHasAccess,
        }));

        toast.success(res.data.message || "Lectures fetched successfully");
        return { courseId, lectures: lecturesWithAccess };
      }

      toast.error(res.data.message);
      return rejectWithValue(res.data.message);
    } catch (err) {
      toast.dismiss(toastId);
      return handleError(err, rejectWithValue);
    }
  }
);

// ====================== ADD LECTURE ======================
export const addLecture = createAsyncThunk(
  "lecture/add",
  async (data, { rejectWithValue }) => {
    if (!data.cid) return rejectWithValue("Invalid course ID");

    const toastId = toast.loading("Adding lecture...", { position: "top-center" });
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("mode", data.mode);

      if (data.mode === "link") formData.append("videoSrc", data.videoSrc);
      else if (data.lecture) formData.append("lecture", data.lecture);
      else {
        toast.dismiss(toastId);
        toast.error("Lecture file or link is required");
        return rejectWithValue("Lecture file or link is required");
      }

      const res = await axiosInstance.post(`/course/${data.cid}/lectures`, formData);
      toast.dismiss(toastId);

      if (res.status === 200) {
        toast.success(res.data.message || "Lecture added successfully");
        return { courseId: data.cid, lectures: res.data.lectures || [] };
      }

      toast.error(res.data.message);
      return rejectWithValue(res.data.message);
    } catch (err) {
      toast.dismiss(toastId);
      return handleError(err, rejectWithValue);
    }
  }
);

// ====================== UPDATE LECTURE ======================
export const updateLecture = createAsyncThunk(
  "lecture/update",
  async (data, { rejectWithValue }) => {
    if (!data.cid || !data.lectureId) return rejectWithValue("Invalid course or lecture ID");

    const toastId = toast.loading("Updating lecture...", { position: "top-center" });
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("mode", data.mode);

      if (data.mode === "link") formData.append("videoSrc", data.videoSrc);
      else if (data.lecture) formData.append("lecture", data.lecture);

      const res = await axiosInstance.put(
        `/course/lectures/${data.cid}/${data.lectureId}`,
        formData
      );
      toast.dismiss(toastId);

      if (res.status === 200) {
        toast.success(res.data.message || "Lecture updated successfully");
        return { courseId: data.cid, lectures: res.data.lectures || [] };
      }

      toast.error(res.data.message);
      return rejectWithValue(res.data.message);
    } catch (err) {
      toast.dismiss(toastId);
      return handleError(err, rejectWithValue);
    }
  }
);

// ====================== DELETE LECTURE ======================
export const deleteLecture = createAsyncThunk(
  "lecture/delete",
  async (data, { rejectWithValue }) => {
    if (!data.cid || !data.lectureId) return rejectWithValue("Invalid course or lecture ID");

    const toastId = toast.loading("Deleting lecture...", { position: "top-center" });
    try {
      const res = await axiosInstance.delete(`/course/lectures/${data.cid}/${data.lectureId}`);
      toast.dismiss(toastId);

      if (res.status === 200) {
        toast.success(res.data.message || "Lecture deleted successfully");
        return { courseId: data.cid, lectures: res.data.lectures || [] };
      }

      toast.error(res.data.message);
      return rejectWithValue(res.data.message);
    } catch (err) {
      toast.dismiss(toastId);
      return handleError(err, rejectWithValue);
    }
  }
);

// ====================== SLICE ======================
const lectureSlice = createSlice({
  name: "lecture",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Pending
      .addMatcher(
        (action) => action.type.startsWith("lecture/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
        }
      )
      // Fulfilled
      .addMatcher(
        (action) => action.type.startsWith("lecture/") && action.type.endsWith("/fulfilled"),
        (state, action) => {
          state.loading = false;
          state.lecturesByCourse[action.payload.courseId] = action.payload.lectures || [];
        }
      )
      // Rejected
      .addMatcher(
        (action) => action.type.startsWith("lecture/") && action.type.endsWith("/rejected"),
        (state) => {
          state.loading = false;
        }
      );
  },
});

export default lectureSlice.reducer;
