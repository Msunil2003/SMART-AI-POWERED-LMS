/* eslint-disable no-unused-vars */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';

import axiosInstance from '../../helpers/AxiosInstance';

const initialState = {
  allUserCount: 0,
};

export const getStats = createAsyncThunk('stats/get', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/admin/stats/users');
    if (response.status === 200) {
      return response.data;
    } else {
      return rejectWithValue(response.data.message);
    }
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || 'Failed to fetch stats');
  }
});

const statSlice = createSlice({
  name: 'stat',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getStats.fulfilled, (state, action) => {
      state.allUserCount = action.payload.allUserCount || 0;
    });
  }
});

export default statSlice.reducer;
