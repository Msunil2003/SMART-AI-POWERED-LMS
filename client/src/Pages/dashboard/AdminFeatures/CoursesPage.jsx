import { useEffect, useState } from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import HomeLayout from "../../../layouts/HomeLayout";
import { deleteCourse, getAllCourse } from "../../../Redux/slices/CourseSlice";
import { getLectures } from "../../../Redux/slices/lectureSlice";

const CoursesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { role } = useSelector((state) => state.auth);
  const courses = useSelector((state) => state.course.courseData);
  const lecturesByCourse = useSelector((state) => state.lecture.lecturesByCourse);

  const [visibleCourses, setVisibleCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch all courses on load
  useEffect(() => {
    dispatch(getAllCourse());
  }, [dispatch]);

  // Show all courses (both ADMIN and INSTRUCTOR can see all)
  useEffect(() => {
    if (courses) {
      setVisibleCourses(courses);
    }
  }, [courses]);

  // Fetch lectures for visible courses
  useEffect(() => {
    visibleCourses.forEach((course) =>
      dispatch(getLectures(course._id)).unwrap().catch(() => {})
    );
  }, [visibleCourses, dispatch]);

  // Delete modal handlers
  const handleDeleteClick = (course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedCourse) return;
    try {
      await dispatch(deleteCourse(selectedCourse._id)).unwrap();
      setShowModal(false);
      setSelectedCourse(null);
      dispatch(getAllCourse());
    } catch {
      // error already handled in slice
    }
  };

  const cancelDelete = () => {
    setShowModal(false);
    setSelectedCourse(null);
  };

  return (
    <HomeLayout>
      <div className="p-6 flex flex-col gap-6">
        {/* Back Button */}
        <div className="self-start">
          <Link to={`/${role.toLowerCase()}/dashboard`}>
            <button className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 transition">
              ← Back to Dashboard
            </button>
          </Link>
        </div>

        {/* Header + Create Button */}
        <div className="flex flex-col lg:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-500">Course Overview</h1>
          {(role === "ADMIN" || role === "INSTRUCTOR") && (
            <Link to="/course/create">
              <button className="btn btn-success text-white font-semibold mt-4 lg:mt-0">
                Create New Course
              </button>
            </Link>
          )}
        </div>

        {/* Courses Table */}
        <div className="overflow-x-auto">
          <table className="table text-center w-full">
            <thead>
              <tr className="text-white text-lg">
                <th>S No.</th>
                <th>Title</th>
                <th>Category</th>
                <th>Instructor</th>
                <th>Lectures</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleCourses.length > 0 ? (
                visibleCourses.map((course, idx) => {
                  const canEditOrDelete = role === "ADMIN" || role === "INSTRUCTOR";
                  const lectureCount = lecturesByCourse[course._id]?.length || 0;

                  return (
                    <tr key={course._id} className="hover:bg-base-300">
                      <td>{idx + 1}</td>
                      <td>
                        <button
                          onClick={() =>
                            navigate(`/course/${course.title}/${course._id}/lectures`, { state: course })
                          }
                          className="text-blue-300 hover:underline"
                        >
                          {course.title}
                        </button>
                      </td>
                      <td>{course.category || "N/A"}</td>
                      <td>{course.createdBy?.name || "Unknown"}</td>
                      <td>{lectureCount}</td>
                      <td className="flex justify-center gap-3">
                        {canEditOrDelete && (
                          <>
                            <button
                              onClick={() =>
                                navigate(`/course/${course.title}/${course._id}/editCourse`, { state: course })
                              }
                              className="text-blue-500 text-xl"
                            >
                              <FiEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(course)}
                              className="text-red-500 text-xl"
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-white py-4">
                    No courses available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Modal */}
        {showModal && selectedCourse && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-gray-900 rounded-xl shadow-xl w-96 p-6 flex flex-col gap-4 animate-slide-down">
              <h2 className="text-xl font-bold text-white">Confirm Delete</h2>
              <p className="text-gray-300">Are you sure you want to delete this course?</p>
              <div className="text-gray-300">
                <p>
                  <span className="font-semibold">Course Name:</span> {selectedCourse.title}
                </p>
                <p>
                  <span className="font-semibold">Instructor:</span> {selectedCourse.createdBy?.name || "Unknown"}
                </p>
                <p>
                  <span className="font-semibold">Category:</span> {selectedCourse.category || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Lectures:</span> {lecturesByCourse[selectedCourse._id]?.length || 0}
                </p>
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HomeLayout>
  );
};

export default CoursesPage;
