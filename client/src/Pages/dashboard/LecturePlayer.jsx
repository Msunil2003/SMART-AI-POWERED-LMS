import { useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useDispatch,useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import Footer from "../../components/Footer";
import { getLectures } from "../../Redux/slices/lectureSlice";

function LecturePlayer() {
  const { name: courseTitle, id: courseId, lectureId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { lecturesByCourse } = useSelector((state) => state.lecture);
  const lecture = lecturesByCourse[courseId]?.find((lec) => lec._id === lectureId);

  useEffect(() => {
    if (!lecturesByCourse[courseId]) dispatch(getLectures(courseId));
  }, [courseId, dispatch, lecturesByCourse]);

  useEffect(() => {
    if (!lecture) return;
    document.title = `${lecture.title} - Learning Management System`;
  }, [lecture]);

  useEffect(() => {
    if (lectureId && !lecture) navigate(`/course/${courseTitle}/${courseId}/lectures`);
  }, [lecture, navigate, courseTitle, courseId, lectureId]);

  const splitParagraph = (paragraph) => {
    const sentences = paragraph?.split(".") || [];
    return (
      <ul className="flex flex-col gap-4">
        {sentences.map((sentence, index) =>
          sentence.trim() ? (
            <li key={index} className="capitalize text-white px-4 list-disc">
              {sentence.trim()}.
            </li>
          ) : null
        )}
      </ul>
    );
  };

  if (!lecture) return <p className="text-white p-4">Loading lecture...</p>;

  return (
    <div className="relative min-h-screen">
      <div className="w-full px-4 py-8 lg:px-16">
        <div className="flex items-center gap-4 mb-6">
          <FaArrowLeft
            className="text-black text-2xl cursor-pointer hover:text-slate-600"
            onClick={() => navigate(-1)}
          />
          <h1 className="text-3xl font-bold text-white">{lecture.title}</h1>
        </div>

        <div className="aspect-video w-full border-2 border-slate-500 rounded-md overflow-hidden mb-8">
          {lecture.lecture?.public_id === "youtube" ? (
            <iframe
              key={lecture.lecture?.secure_url}
              src={lecture.lecture?.secure_url}
              title={lecture.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <video
              key={lecture.lecture?.secure_url}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              className="w-full h-full outline-none"
            >
              <source src={lecture.lecture?.secure_url} type="video/mp4" />
            </video>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-white font-bold text-2xl">Overview:</h2>
          {splitParagraph(lecture.description)}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default LecturePlayer;
