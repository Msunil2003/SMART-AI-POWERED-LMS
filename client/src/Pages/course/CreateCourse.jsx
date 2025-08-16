import { useEffect, useState } from 'react';
import { FcAddImage } from 'react-icons/fc';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import HomeLayout from '../../layouts/HomeLayout';
import { createCourse } from '../../Redux/slices/CourseSlice';

function CreateCourse() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [userInput, setUserInput] = useState({
    title: '',
    description: '',
    category: '',
    createdBy: '',
    createdByName: '',
    thumbnail: null,
    previewImage: ''
  });

  // Helper to get user's full name
  const getUserName = (u) => {
    if (!u) return '';
    if (typeof u.name === 'string') return u.name;
    if (typeof u.fullName === 'string') return u.fullName;
    if (u.name && typeof u.name.name === 'string') return u.name.name;
    return '';
  };

  // On mount, populate createdBy and name from profile
  useEffect(() => {
    if (user) {
      const u = user.user || user;
      setUserInput(prev => ({
        ...prev,
        createdBy: u._id || '',
        createdByName: getUserName(u)
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInput(prev => ({ ...prev, [name]: value }));
  };

  const handleImage = (e) => {
    const uploadImage = e.target.files[0];
    if (!uploadImage) return;

    const fileReader = new FileReader();
    fileReader.readAsDataURL(uploadImage);
    fileReader.onload = () => {
      setUserInput(prev => ({
        ...prev,
        previewImage: fileReader.result,
        thumbnail: uploadImage
      }));
    };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const { title, description, category, createdBy, createdByName, thumbnail } = userInput;

    if (!title || !description || !category || !createdBy || !thumbnail) {
      toast.error('Please fill all fields and add a thumbnail');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('createdBy', JSON.stringify({ id: createdBy, name: createdByName }));
    formData.append('thumbnail', thumbnail);

    try {
      const resultAction = await dispatch(createCourse(formData));

      if (createCourse.fulfilled.match(resultAction)) {
        toast.success('Course created successfully');
        navigate('/admin/dashboard/courses'); // redirect to Courses page
      } else if (createCourse.rejected.match(resultAction)) {
        toast.error(resultAction.error?.message || 'Failed to create course');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create course');
    }
  };

  return (
    <HomeLayout>
      <form onSubmit={onSubmit} className="flex flex-col lg:flex-row lg:px-20 py-12">
        {/* Left: Thumbnail */}
        <div className="lg:w-1/2 w-full px-12 flex flex-col gap-4 lg:py-12 py-0">
          {userInput.previewImage ? (
            <img
              src={userInput.previewImage}
              alt="thumbnail"
              className="rounded-xl w-full h-96 object-cover"
            />
          ) : (
            <div className="w-full h-96 flex justify-center items-center border-2 border-slate-500 rounded-lg">
              <FcAddImage size={'10rem'} />
            </div>
          )}
          <div className="flex flex-col gap-3">
            <label htmlFor="thumbnail" className="font-semibold text-white text-xl">Course Thumbnail</label>
            <input
              type="file"
              id="thumbnail"
              name="thumbnail"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleImage}
              className="file-input file-input-bordered file-input-accent w-full text-white"
            />
          </div>
        </div>

        {/* Right: Course Details */}
        <div className="lg:w-1/2 w-full px-12 py-9 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label htmlFor="title" className="font-semibold text-white text-xl">Course Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={userInput.title}
              onChange={handleChange}
              placeholder="Type here"
              className="input input-bordered input-accent w-full text-white"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label htmlFor="createdByName" className="font-semibold text-white text-xl">Course Instructor</label>
            <input
              type="text"
              id="createdByName"
              name="createdByName"
              value={userInput.createdByName || 'Unknown'}
              readOnly
              className="input input-bordered input-accent w-full text-white bg-gray-600 cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label htmlFor="category" className="font-semibold text-white text-xl">Course Domain</label>
            <input
              type="text"
              id="category"
              name="category"
              value={userInput.category}
              onChange={handleChange}
              placeholder="Type here"
              className="input input-bordered input-accent w-full text-white"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label htmlFor="description" className="font-semibold text-white text-xl">Course Description</label>
            <textarea
              id="description"
              name="description"
              value={userInput.description}
              onChange={handleChange}
              placeholder="Type here"
              className="textarea textarea-accent resize-y min-h-16 w-full text-white"
            />
          </div>

          <button type="submit" className="btn btn-primary">Create</button>
        </div>
      </form>
    </HomeLayout>
  );
}

export default CreateCourse;
