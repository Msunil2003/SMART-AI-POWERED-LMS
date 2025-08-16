import { configureStore } from '@reduxjs/toolkit'

import AuthSlice from './slices/AuthSlice'
import CourseSlice from './slices/CourseSlice'
import LectureSlice from './slices/lectureSlice'
import RazorpaySlice from './slices/RazorpaySlice'
import StatSlice from './slices/StatSlice'
import userReducer from './slices/userSlice' // 👈 make sure this path is correct

const store = configureStore({
    reducer: {
        auth: AuthSlice,
        course: CourseSlice,
        razorpay: RazorpaySlice,
        lecture: LectureSlice,
        stat: StatSlice,
        user: userReducer // ✅ include this here
    },
    devTools: true
})

export default store
