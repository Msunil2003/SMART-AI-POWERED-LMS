import { useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import Footer from "../../components/Footer";
import { getLectures } from "../../Redux/slices/LectureSlice";

function CourseLecturesList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: courseId, name } = useParams();

  const courseTitle = name;

  const { lecturesByCourse } = useSelector((state) => state.lecture);
  const { role } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!courseId) {
      navigate("/courses");
      return;
    }
    dispatch(getLectures(courseId));
  }, [courseId, dispatch, navigate]);

  const handleAddLecture = () => {
    navigate(`/course/${courseTitle}/${courseId}/lectures/addlecture`);
  };

  const lectures = lecturesByCourse[courseId] || [];

  return (
    <div className="relative min-h-screen bg-gray-900">
      <div className="lg:w-[70%] mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <FaArrowLeft
              className="text-white text-2xl cursor-pointer hover:text-yellow-400 transition-colors"
              onClick={() => navigate(-1)}
            />
            <h1 className="text-3xl font-bold text-white">{courseTitle}</h1>
          </div>

          {/* Register for Exam button visible only for 'USER' role AND if lectures exist */}
          {role === "USER" && lectures.length > 0 && (
            <button
              onClick={() =>
                navigate(`/exam/${courseId}/register`, { state: { courseTitle } })
              }
              className="btn btn-yellow normal-case text-lg px-6 py-3 hover:bg-yellow-500 transition-colors"
            >
              Register for Exam
            </button>
          )}
        </div>

        {/* Add Lecture button visible only for ADMIN or INSTRUCTOR */}
        {(role === "ADMIN" || role === "INSTRUCTOR") && (
          <button
            onClick={handleAddLecture}
            className="btn btn-yellow mb-6 normal-case text-lg px-6 py-3 hover:bg-yellow-500 transition-colors"
          >
            Add Lecture
          </button>
        )}

        {lectures.length === 0 ? (
          <p className="text-gray-400 text-lg">No lectures added yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {lectures.map((lecture) => (
              <li
                key={lecture._id}
                className="bg-gray-800 rounded-lg shadow-md p-4 flex justify-between items-center hover:bg-gray-700 transition-colors"
              >
                <span
                  className="text-white text-lg font-semibold cursor-pointer hover:text-yellow-400 truncate"
                  onClick={() =>
                    navigate(
                      `/course/${courseTitle}/${courseId}/lectures/${lecture._id}`
                    )
                  }
                >
                  {lecture.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default CourseLecturesList;
