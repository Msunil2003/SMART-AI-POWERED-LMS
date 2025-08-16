import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import HomeLayout from '../../layouts/HomeLayout';

function CourseDescription() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { role, user } = useSelector((state) => state.auth);

  // ✅ Check if user has access: Admins or users with valid purchase
  const hasAccess = role === 'ADMIN' || user?.access?.valid === true;

  // Safe destructuring with fallbacks
  const courseTitle = state?.title || 'Untitled Course';
  const courseId = state?._id || '';
  const courseThumbnail = state?.thumbnail?.secure_url || '/default-thumbnail.png';
  const courseCategory = state?.category || 'N/A';
  const courseInstructor = state?.createdBy?.name || 'Unknown';

  // Get lectures from Redux store dynamically
  const lectures = useSelector(
    (store) => store.lecture.lecturesByCourse[courseId] || []
  );

  // Calculate number of lectures dynamically
  const courseLectures = lectures.length;

  const courseDescription = state?.description || 'No description available';

  return (
    <HomeLayout>
      <div className="flex flex-col lg:flex-row lg:px-20 py-12 gap-10">
        {/* Left: Thumbnail & Info */}
        <div className="lg:w-1/2 w-full px-12 flex flex-col gap-7">
          <img
            src={courseThumbnail}
            alt={courseTitle}
            className="rounded-xl w-full h-96 object-cover"
          />

          <p className="font-semibold lg:text-2xl text-xl text-yellow-400 capitalize">
            Category:
            <span className="text-xl text-blue-500"> {courseCategory}</span>
          </p>

          <p className="font-semibold lg:text-2xl text-xl text-yellow-400 capitalize">
            Instructor:
            <span className="text-xl text-blue-500"> {courseInstructor}</span>
          </p>

          <p className="font-semibold lg:text-2xl text-xl text-yellow-400 capitalize">
            Number of lectures:
            <span className="text-xl text-blue-500"> {courseLectures}</span>
          </p>

          {/* Access button */}
          {hasAccess ? (
            <button
              className="btn btn-primary capitalize"
              onClick={() =>
                navigate(`/course/${courseTitle}/${courseId}/lectures`, { state })
              }
            >
              Go to Lectures
            </button>
          ) : (
            <button
              className="btn btn-primary capitalize"
              onClick={() =>
                navigate(`/course/${courseTitle}/checkout`, { state })
              }
            >
              Buy Course
            </button>
          )}
        </div>

        {/* Right: Course Description */}
        <div className="lg:w-1/2 w-full px-12 py-12 flex flex-col gap-4">
          <h1 className="font-bold text-yellow-500 lg:text-4xl text-xl capitalize">
            {courseTitle}
          </h1>
          <p className="font-semibold lg:text-2xl text-xl text-amber-500 capitalize">
            Course Description:
          </p>
          <p className="font-semibold lg:text-xl text-xs text-white normal-case tracking-wider">
            {courseDescription}
          </p>
        </div>
      </div>
    </HomeLayout>
  );
}

export default CourseDescription;
