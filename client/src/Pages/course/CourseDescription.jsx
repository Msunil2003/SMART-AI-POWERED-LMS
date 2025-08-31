import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import axiosInstance from "../../helpers/axiosInstance";
import HomeLayout from "../../layouts/HomeLayout";

function CourseDescription() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { role, user } = useSelector((state) => state.auth);

  const [enrolled, setEnrolled] = useState(false);
  const [loadingEnroll, setLoadingEnroll] = useState(false);

  const courseTitle = state?.title || "Untitled Course";
  const courseId = state?._id || "";
  const courseThumbnail = state?.thumbnail?.secure_url || "/default-thumbnail.png";
  const courseCategory = state?.category || "N/A";
  const courseInstructor = state?.createdBy?.name || "Unknown";
  const courseDescription = state?.description || "No description available";

  const lectures = useSelector((store) => store.lecture.lecturesByCourse[courseId] || []);
  const courseLectures = lectures.length;

  // Admins or verified subscribers
  const isVerified = role === "ADMIN" || user?.access?.valid === true;

  // Check enrollment status on mount
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user?._id) return;

      try {
        const res = await axiosInstance.get(`/course/enroll/me/course/${courseId}`);
        setEnrolled(res.data.data.length > 0);
      } catch (err) {
        console.error("Enrollment check error:", err);
      }
    };

    checkEnrollment();
  }, [courseId, user?._id]);

  // Enroll handler
  const handleEnroll = async () => {
    if (!user?._id) return toast.error("Please login first");

    try {
      setLoadingEnroll(true);
      const res = await axiosInstance.post(`/course/enroll/me/${courseId}`);
      toast.success(res.data.message || "You have enrolled successfully");
      setEnrolled(true);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Enrollment failed");
    } finally {
      setLoadingEnroll(false);
    }
  };

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
            Category: <span className="text-xl text-blue-500">{courseCategory}</span>
          </p>

          <p className="font-semibold lg:text-2xl text-xl text-yellow-400 capitalize">
            Instructor: <span className="text-xl text-blue-500">{courseInstructor}</span>
          </p>

          <p className="font-semibold lg:text-2xl text-xl text-yellow-400 capitalize">
            Number of lectures: <span className="text-xl text-blue-500">{courseLectures}</span>
          </p>

          {/* Access button */}
          {isVerified ? (
            enrolled ? (
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
                onClick={handleEnroll}
                disabled={loadingEnroll}
              >
                {loadingEnroll ? "Enrolling..." : "Enroll the Course"}
              </button>
            )
          ) : (
            <button
              className="btn btn-primary capitalize"
              onClick={() => navigate(`/course/${courseTitle}/checkout`, { state })}
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
