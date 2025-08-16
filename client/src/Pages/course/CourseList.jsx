import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import HomeLayout from '../../layouts/HomeLayout';
import { getAllCourse } from '../../Redux/slices/CourseSlice';
import CourseCard from './CourseCard';

function CourseList() {
  const dispatch = useDispatch();
  const { courseData, loading } = useSelector(state => state.course);

  useEffect(() => {
    dispatch(getAllCourse());
  }, [dispatch]);

  return (
    <HomeLayout>
      <div className="flex flex-col lg:h-screen lg:pt-10 md:pt-10 pt-20 lg:px-20 px-4 gap-14">
        <h1 className="font-bold lg:text-4xl md:text-4xl text-2xl font-serif text-white text-center">
          Explore all courses made by <span className="text-yellow-400">Industry Experts</span>
        </h1>

        {loading && <p className="text-white text-center">Loading courses...</p>}

        <div className="flex flex-wrap mb-10 gap-14 w-full px-8 justify-center">
          {courseData?.length > 0 ? (
            courseData.map(course => <CourseCard key={course._id} data={course} />)
          ) : (
            !loading && <p className="text-white text-center">No courses available.</p>
          )}
        </div>
      </div>
    </HomeLayout>
  );
}

export default CourseList;
