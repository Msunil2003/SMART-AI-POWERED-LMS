import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

import axiosInstance from '../../helpers/axiosInstance';

// ✅ Backend base URL
const BACKEND_URL = import.meta.env.VITE_BASE_URL;

// -------------------- INITIAL STATE --------------------
const initialState = {
  isLoggedIn: !!localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || '',
  access: JSON.parse(localStorage.getItem('access')) || { valid: false }, // store course access
  loading: false,
  error: null,
  bannedInfo: null,
  redirect: null,
};

// -------------------- UTILS --------------------
const setAuthStorage = (user, token) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('role', user.role || 'USER');
  localStorage.setItem('access', JSON.stringify(user.access || { valid: false }));
};

// -------------------- THUNKS --------------------

// Signup
export const signup = createAsyncThunk(
  'auth/signup',
  async (formDataObj, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append('fullName', formDataObj.name);
      formData.append('email', formDataObj.email);
      formData.append('password', formDataObj.password);
      formData.append('role', 'USER');
      if (formDataObj.avatar) formData.append('avatar', formDataObj.avatar);
      if (formDataObj.token) formData.append('token', formDataObj.token);

      const response = await axios.post(`${BACKEND_URL}/user/signup`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      toast.success('Signup successful!');
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

// Login
export const login = createAsyncThunk(
  '/auth/login',
  async (data, { rejectWithValue }) => {
    try {
      toast.loading('Logging in...');
      const res = await axiosInstance.post('/user/login', data);
      toast.dismiss();

      if (res.status === 200 && res.data?.banned) {
        return {
          banned: true,
          user: res.data.user,
          reason: res.data.reason,
          message: res.data.message,
        };
      }

      const { userData, token } = res.data;
      setAuthStorage(userData, token);

      let redirectPath = '/';
      if (userData.role === 'INSTRUCTOR') {
        if (userData.approvalStatus === 'PENDING') {
          toast.warn('Your instructor account is pending approval.');
          redirectPath = '/instructor/status';
        } else if (userData.approvalStatus === 'APPROVED') {
          toast.success('Login successful! Redirecting to Instructor Dashboard...');
          redirectPath = '/instructor/dashboard/home';
        } else if (userData.approvalStatus === 'REJECTED') {
          toast.error('Your instructor account has been rejected.');
          return rejectWithValue('Instructor account rejected');
        }
      } else {
        toast.success(res.data.message || 'Login successful');
      }

      return { userData, token, redirect: redirectPath };
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || 'Login failed');
      return rejectWithValue(err?.response?.data?.message);
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  '/auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      toast.loading('Logging out...');
      const res = await axiosInstance.get('/user/logout');
      toast.dismiss();
      toast.success(res.data.message);
      return res.data;
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || 'Logout failed');
      return rejectWithValue(err?.response?.data?.message);
    }
  }
);

// Forgot Password
export const forgotPassword = createAsyncThunk(
  '/user/forgotPassword',
  async (data, { rejectWithValue }) => {
    try {
      toast.loading('Sending reset link...');
      const res = await axiosInstance.post('/user/forgot-password', data);
      toast.dismiss();
      toast.success(res.data.message);
      return res.data;
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || 'Something went wrong');
      return rejectWithValue(err?.response?.data?.message);
    }
  }
);

// Reset Password
export const resetPassword = createAsyncThunk(
  '/user/resetPassword',
  async (data, { rejectWithValue }) => {
    try {
      toast.loading('Resetting password...');
      const res = await axiosInstance.post(`/user/reset/${data.resetToken}`, {
        password: data.password,
      });
      toast.dismiss();
      toast.success(res.data.message);
      return res.data;
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || 'Reset failed');
      return rejectWithValue(err?.response?.data?.message);
    }
  }
);

// Change Password
export const changePassword = createAsyncThunk(
  '/user/changePassword',
  async (data, { rejectWithValue }) => {
    try {
      toast.loading('Changing password...');
      const res = await axiosInstance.put('/user/change-password', data);
      toast.dismiss();
      toast.success(res.data.message);
      return res.data;
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || 'Change failed');
      return rejectWithValue(err?.response?.data?.message);
    }
  }
);

// Edit Profile
export const editProfile = createAsyncThunk(
  '/user/editProfile',
  async (data, { rejectWithValue }) => {
    try {
      toast.loading('Updating profile...');
      const res = await axiosInstance.put('/user/update', data);
      toast.dismiss();
      toast.success(res.data.message);
      return res.data;
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || 'Update failed');
      return rejectWithValue(err?.response?.data?.message);
    }
  }
);

// Get Profile
export const getProfile = createAsyncThunk(
  '/user/myprofile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/user/myprofile');
      return res.data; // expected { success: true, user: {...} }
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

// Load User (kept separate)
export const loadUser = createAsyncThunk(
  '/user/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/user/myprofile');
      return res.data; // expected { success: true, user: {...} }
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to load user');
    }
  }
);

// Delete Profile
export const deleteProfile = createAsyncThunk(
  '/user/deleteProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete('/user/delete-profile');
      toast.success(res.data.message);
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
      return rejectWithValue(err?.response?.data?.message);
    }
  }
);

// -------------------- SLICE --------------------
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearBannedInfo: (state) => {
      state.bannedInfo = null;
    },
    setToken: (state, action) => {
      localStorage.setItem('token', action.payload);
      state.token = action.payload;
      state.isLoggedIn = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Signup
      .addCase(signup.fulfilled, (state, action) => {
        const user = action.payload?.user;
        const token = action.payload?.token;
        if (user && token) {
          setAuthStorage(user, token);
          state.user = user;
          state.token = token;
          state.isLoggedIn = true;
          state.role = user.role;
          state.access = user.access || { valid: false };
        } else {
          toast.error('Signup response is missing token or user data.');
        }
      })

      // Login
      .addCase(login.fulfilled, (state, action) => {
        if (action.payload?.banned) {
          state.bannedInfo = {
            user: action.payload.user,
            reason: action.payload.reason,
            message: action.payload.message,
          };
          state.isLoggedIn = false;
          return;
        }
        const user = action.payload.userData;
        const token = action.payload.token;
        const redirect = action.payload.redirect;
        setAuthStorage(user, token);
        state.user = user;
        state.token = token;
        state.isLoggedIn = true;
        state.role = user.role;
        state.access = user.access || { valid: false };
        state.redirect = redirect;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        localStorage.clear();
        state.user = null;
        state.token = null;
        state.isLoggedIn = false;
        state.role = '';
        state.access = { valid: false };
        state.bannedInfo = null;
        state.redirect = null;
      })

      // Get Profile
      .addCase(getProfile.fulfilled, (state, action) => {
        const user = action.payload.user;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('role', user.role);
          localStorage.setItem('access', JSON.stringify(user.access || { valid: false }));
          state.user = user;
          state.role = user.role;
          state.access = user.access || { valid: false };
        }
      })

      // Load User
      .addCase(loadUser.fulfilled, (state, action) => {
        const user = action.payload.user;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('role', user.role);
          localStorage.setItem('access', JSON.stringify(user.access || { valid: false }));
          state.user = user;
          state.role = user.role;
          state.access = user.access || { valid: false };
        }
      })

      // Edit Profile
      .addCase(editProfile.fulfilled, (state, action) => {
        const user = action.payload.user;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          state.user = user;
          state.access = user.access || { valid: false };
        }
      })

      // Delete Profile
      .addCase(deleteProfile.fulfilled, (state) => {
        localStorage.clear();
        state.user = null;
        state.token = null;
        state.isLoggedIn = false;
        state.role = '';
        state.access = { valid: false };
        state.bannedInfo = null;
        state.redirect = null;
      });
  },
});

export const { clearBannedInfo, setToken } = authSlice.actions;
export default authSlice.reducer;
