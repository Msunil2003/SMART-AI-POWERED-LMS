import { FaBook, FaUserGraduate } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

function CourseCard({ data }) {
  const navigate = useNavigate();

  // Get updated lectures from Redux store
  const lectures = useSelector(
    (store) => store.lecture.lecturesByCourse[data._id] || []
  );

  const lectureCount = lectures.length || 0;

  return (
    <div
      onClick={() => navigate('/course/description', { state: { ...data } })}
      className="group relative w-80 bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
    >
      {/* Thumbnail */}
      <div className="h-48 overflow-hidden">
        <img
          src={data.thumbnail?.secure_url || '/default-thumbnail.png'}
          alt={data.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3">
        <h2 className="text-2xl font-bold text-white truncate">{data.title}</h2>

        <p className="text-gray-300 text-sm flex items-center gap-2">
          <FaUserGraduate /> Instructor: <span className="text-yellow-400">{data.createdBy?.name || 'Unknown'}</span>
        </p>

        <p className="text-gray-300 text-sm flex items-center gap-2">
          <FaBook /> Lectures: <span className="text-yellow-400">{lectureCount}</span>
        </p>

        <p className="text-gray-400 text-sm truncate">{data.description || 'No description available'}</p>

        <div className="mt-3 flex justify-start items-center">
          <div className="badge badge-outline capitalize py-2 px-3 border-blue-500 border-2 text-blue-400">
            {data.category || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;
