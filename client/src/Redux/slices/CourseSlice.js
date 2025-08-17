import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';

import axiosInstance from '../../helpers/axiosInstance';

// Initial state
const initialState = {
  courseData: [],
  loading: false,
  error: null,
};

// Normalize courses for frontend consistency
const normalizeCourses = (courses) => {
  return (courses || []).map((course) => {
    const id = course._id || course.id || 'unknown';
    const createdBy = typeof course.createdBy === 'string'
      ? { _id: course.createdBy, name: 'Unknown' }
      : course.createdBy || {};
    return {
      ...course,
      _id: id,
      createdById: createdBy._id || 'unknown',
      createdByName: createdBy.name || 'Unknown',
      numberOfLectures: course.numberOfLectures || 0,
      thumbnailUrl: course.thumbnail?.secure_url || '/default-thumbnail.png',
    };
  });
};

// === GET ALL COURSES ===
export const getAllCourse = createAsyncThunk(
  'courses/getAll',
  async (_, { rejectWithValue }) => {
    try {
      toast.loading("Loading courses...", { position: 'top-center' });
      const response = await axiosInstance.get('/course');
      toast.dismiss();
      toast.success(response.data.message);
      return normalizeCourses(response.data?.courses);
    } catch (error) {
      toast.dismiss();
      toast.error(error?.response?.data?.message || error.message);
      return rejectWithValue(error.message);
    }
  }
);

// export const getInstructorCourses = createAsyncThunk(
//   "courses/getInstructorCourses",
//   async (_, { rejectWithValue }) => {
//     try {
//       toast.loading("Loading your courses...", { position: "top-center" });

//       const response = await axiosInstance.get("/course/instructor/my-courses");

//       console.log("Instructor Courses API Response:", response.data);

//       toast.dismiss();
//       toast.success(response.data.message || "Courses fetched successfully");

//       const courses = response.data.courses || [];

//       const normalized = normalizeCourses(courses);
//       console.log("Normalized courses:", normalized);

//       return normalized;
//     } catch (error) {
//       toast.dismiss();
//       toast.error(error?.response?.data?.message || error.message);
//       return rejectWithValue(
//         error?.response?.data?.message ||
//           error.message ||
//           "Failed to fetch instructor courses"
//       );
//     }
//   }
// );





// === CREATE COURSE ===
export const createCourse = createAsyncThunk(
  '/course/create',
  async (data, { rejectWithValue }) => {
    try {
      toast.loading("Creating course...", { position: 'top-center' });
      const response = await axiosInstance.post('/course/newcourse', data);
      toast.dismiss();

      if (response.status === 201) {
        toast.success(response.data.message);
        return normalizeCourses([response.data.newCourse])[0];
      } else {
        toast.error(response.data.message);
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error?.response?.data?.message || error.message);
      return rejectWithValue(error.message);
    }
  }
);

// === UPDATE COURSE ===
export const updateCourse = createAsyncThunk(
  '/course/update',
  async (data, { rejectWithValue }) => {
    try {
      toast.loading("Updating course...", { position: 'top-center' });
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("createdBy", data.createdBy);
      if (data.thumbnail) formData.append("thumbnail", data.thumbnail);

      const response = await axiosInstance.put(`/course/${data.id}`, formData);
      toast.dismiss();

      if (response.status === 200) {
        toast.success(response.data.message);
        return normalizeCourses([response.data.course])[0];
      } else {
        toast.error(response.data.message);
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error?.response?.data?.message || error.message);
      return rejectWithValue(error.message);
    }
  }
);

// === DELETE COURSE ===
export const deleteCourse = createAsyncThunk(
  '/course/delete',
  async (id, { rejectWithValue }) => {
    try {
      toast.loading("Deleting course...", { position: 'top-center' });
      const response = await axiosInstance.delete(`/course/${id}`);
      toast.dismiss();

      if (response.status === 200) {
        toast.success(response.data.message);
        return id;
      } else {
        toast.error(response.data.message);
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error?.response?.data?.message || error.message);
      return rejectWithValue(error.message);
    }
  }
);

// Course slice
const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // GET ALL COURSES
      .addCase(getAllCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCourse.fulfilled, (state, action) => {
        state.courseData = action.payload || [];
        state.loading = false;
      })
      .addCase(getAllCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch courses';
      })

      // // GET INSTRUCTOR COURSES
      // .addCase(getInstructorCourses.pending, (state) => {
      //   state.loading = true;
      //   state.error = null;
      // })
      // .addCase(getInstructorCourses.fulfilled, (state, action) => {
      //   state.courseData = action.payload || [];
      //   state.loading = false;
      // })
      // .addCase(getInstructorCourses.rejected, (state, action) => {
      //   state.loading = false;
      //   state.error = action.payload || 'Failed to fetch instructor courses';
      // })

      // CREATE COURSE
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.courseData.push(action.payload);
        state.loading = false;
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create course';
      })

      // UPDATE COURSE
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        const index = state.courseData.findIndex(c => c._id === action.payload._id);
        if (index !== -1) state.courseData[index] = action.payload;
        state.loading = false;
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update course';
      })

      // DELETE COURSE
      .addCase(deleteCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.courseData = state.courseData.filter(c => c._id !== action.payload);
        state.loading = false;
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete course';
      });
  }
});

export default courseSlice.reducer;
