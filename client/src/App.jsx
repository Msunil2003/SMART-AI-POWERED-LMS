import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import About from './Pages/About';
import LogIn from './Pages/auth/LogIn';
import RequiredAuth from './Pages/auth/RequiredAuth';
import SignUp from './Pages/auth/SignUp';
import UnprotectedRoute from './Pages/auth/UnprotectedRoute';
import Contact from './Pages/Contact';
import CourseDescription from './Pages/course/CourseDescription';
import CourseList from './Pages/course/CourseList';
import CreateCourse from './Pages/course/CreateCourse';
import EditCourse from './Pages/course/EditCourse';
import AddCourseLecture from './Pages/dashboard/AddCourseLecture';
import AdminDashboardHome from './Pages/dashboard/AdminFeatures/AdminDashboard';
import AnalyticsPage from './Pages/dashboard/AdminFeatures/AnalyticsPage';
import CoursesPage from './Pages/dashboard/AdminFeatures/CoursesPage';
import PendingApporval from './Pages/dashboard/AdminFeatures/InstructorApprovalPage.jsx';
import InstructorsOnboarding from './Pages/dashboard/AdminFeatures/InstructorOnboarding.jsx';
import InstructorStatusPage from './Pages/dashboard/AdminFeatures/InstructorStatusPage.jsx';
import InviteInstructor from "./Pages/dashboard/AdminFeatures/InviteInstructor";
import PaymentsPage from './Pages/dashboard/AdminFeatures/PaymentsPage.jsx';
import UserManagemet from './Pages/dashboard/AdminFeatures/UserManagement';
import WidgetsPage from './Pages/dashboard/AdminFeatures/WidgetsPage';
import CourseLecturesList from './Pages/dashboard/CourseLecturesList.jsx';
import EditCourseLecture from './Pages/dashboard/EditCourseLecture';
import InstructorCoursesPage from "./Pages/dashboard/InstructorFeatures/InstructorCoursesPage.jsx";
import InstructorDashboard from './Pages/dashboard/InstructorFeatures/InstructorDashboardHome.jsx';
import LecturePlayer from './Pages/dashboard/LecturePlayer.jsx';
import HomePage from './Pages/HomePage';
import NotFound from './Pages/NotFound';
import ChangePassword from './Pages/password/ChangePassword';
import ResetPassword from './Pages/password/ResetPassword';
import Checkout from './Pages/payments/Checkout';
import CheckoutFail from './Pages/payments/CheckoutFail';
import CheckoutResponse from './Pages/payments/CheckoutResponse.jsx';
import CheckoutSuccess from './Pages/payments/CheckoutSuccess';
import BannedUserPage from './Pages/user/BannedUserPage';
import Profile from './Pages/user/Profile';

function App() {
  const location = useLocation();

  useEffect(() => {
    const titles = {
      '/': 'Learning Management System',
      '/about': 'About - Learning Management System',
      '/contact': 'Contact - Learning Management System',
      '/signup': 'Sign Up - Learning Management System',
      '/login': 'Log In - Learning Management System',
      '/courses': 'All Courses - Learning Management System',
      '/course/description': 'Course Description - LMS',
      '/course/create': 'Create Course - LMS',
      '/admin/dashboard': 'Admin Dashboard - LMS',
      '/profile': 'Profile - LMS',
      '/profile/changePassword': 'Change Password - LMS',
    };
    document.title = titles[location.pathname] || 'Learning Management System';
  }, [location.pathname]);

  return (
    <Routes>
      {/* Default */}
      <Route path="*" element={<NotFound />} />
      <Route path="/" element={<HomePage />} />

      {/* ✅ Unauthenticated Routes */}
      <Route element={<UnprotectedRoute />}>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/instructor/signup" element={<SignUp />} /> 
        <Route path="/login" element={<LogIn />} />
      </Route>

      <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/courses" element={<CourseList />} />
      <Route path="/course/description" element={<CourseDescription />} />
      <Route path="/instructor/status" element={<InstructorStatusPage />} />
      <Route path="/banned" element={<BannedUserPage />} />

      {/* ✅ Instructor Routes */}
      <Route element={<RequiredAuth allowedRole={['INSTRUCTOR']} />}>
        <Route path="/instructor/dashboard/home" element={<InstructorDashboard />} />
        <Route path="/instructor/dashboard/courses" element={<CoursesPage />} />
        <Route path="/course/create" element={<CreateCourse />} />
        <Route path="/course/:name/:id/editCourse" element={<EditCourse />} />
        <Route 
  path="/instructor/courses" 
  element={<InstructorCoursesPage />} 
/>
        
      </Route>

      {/* ✅ Admin Routes */}
      <Route element={<RequiredAuth allowedRole={['ADMIN']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboardHome />} />
        <Route path="/admin/dashboard/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/dashboard/widgets" element={<WidgetsPage />} />
        <Route path="/admin/dashboard/courses" element={<CoursesPage />} />
        <Route path="/admin/users" element={<UserManagemet />} />
        <Route path="/admin/payments" element={<PaymentsPage />} />
        <Route path="/admin/instructors" element={<InstructorsOnboarding />} />
        <Route path="/admin/instructors/invite" element={<InviteInstructor />} />
        <Route path="/admin/instructors/approvals" element={<PendingApporval />} />
      </Route>

      {/* ✅ Shared USER/ADMIN/INSTRUCTOR Routes */}
      <Route element={<RequiredAuth allowedRole={['ADMIN', 'USER', 'INSTRUCTOR']} />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/changePassword" element={<ChangePassword />} />
        <Route path="/course/:name/checkout" element={<Checkout />} />
        <Route path="/course/:name/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/course/:name/checkout/fail" element={<CheckoutFail />} />
        <Route path="/course/all-access/checkout/response" element={<CheckoutResponse />} />
        <Route path="/course/:name/:id/lectures" element={<CourseLecturesList />} />
        <Route path="/course/:name/:id/lectures/:lectureId" element={<LecturePlayer />} />
      </Route>

      {/* ✅ Shared Admin + Instructor Routes */}
      <Route element={<RequiredAuth allowedRole={['ADMIN', 'INSTRUCTOR']} />}>
        <Route path="/course/:name/:id/lectures/addlecture" element={<AddCourseLecture />} />
        <Route path="/course/:name/:id/lectures/editlecture" element={<EditCourseLecture />} />
      </Route>
    </Routes>
  );
}

export default App;
