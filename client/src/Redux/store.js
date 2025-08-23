import { configureStore } from '@reduxjs/toolkit'

import AuthSlice from './slices/AuthSlice'
import CourseSlice from './slices/CourseSlice'
import examReducer from "./slices/examSlice" // ✅ import exam slice
import LectureSlice from './slices/LectureSlice'
import RazorpaySlice from './slices/RazorpaySlice'
import StatSlice from './slices/StatSlice'
import userReducer from './slices/userSlice' 

const store = configureStore({
    reducer: {
        auth: AuthSlice,
        course: CourseSlice,
        razorpay: RazorpaySlice,
        lecture: LectureSlice,
        stat: StatSlice,
        user: userReducer,
        exam: examReducer // ✅ add exam slice here
    },
    devTools: true
})

export default store
