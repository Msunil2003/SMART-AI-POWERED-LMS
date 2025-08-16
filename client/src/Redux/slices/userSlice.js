import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import axiosInstance from "../../helpers/axiosInstance";

// ✅ Get All Users
export const getAllUsers = createAsyncThunk(
  "user/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/user/admin/users");
      return res.data.users;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch users");
    }
  }
);

// ✅ Toggle Ban/Unban User
export const toggleBanUser = createAsyncThunk(
  "user/toggleBan",
  async ({ userId, banReason, banMessage }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch(`/user/admin/users/${userId}/toggle-ban`, {
        userId,
        banReason,
        banMessage,
      });

      return {
        user: res.data.user,
        message: res.data.message || "",
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to toggle ban");
    }
  }
);

const initialState = {
  users: [],
  loadingGetUsers: false,
  loadingToggleBan: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get All Users
      .addCase(getAllUsers.pending, (state) => {
        state.loadingGetUsers = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loadingGetUsers = false;
        state.users = action.payload;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loadingGetUsers = false;
        state.error = action.payload;
      })

      // Toggle Ban User
      .addCase(toggleBanUser.pending, (state) => {
        state.loadingToggleBan = true;
        state.error = null;
      })
      .addCase(toggleBanUser.fulfilled, (state, action) => {
        state.loadingToggleBan = false;
        const updatedUser = action.payload.user;
        const index = state.users.findIndex((u) => u._id === updatedUser._id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
      })
      .addCase(toggleBanUser.rejected, (state, action) => {
        state.loadingToggleBan = false;
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer;
