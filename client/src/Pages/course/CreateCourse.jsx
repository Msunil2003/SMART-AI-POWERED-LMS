import { useState } from 'react';
import { FcAddImage } from 'react-icons/fc'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';

import HomeLayout from '../../layouts/HomeLayout'
import { createCourse } from '../../redux/slices/CourseSlice';

function CreateCourse() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [userInput, setUserInput] = useState({
        title: "",
        description: "",
        category: "",
        createdBy: "",
        thumbnail: null,
        previewImage: ""
    });

    function handleChange(e) {
        const { name, value } = e.target;
        setUserInput((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    function handleImage(e) {
        const uploadImage = e.target.files[0];
        if (!uploadImage) return;

        const fileReader = new FileReader();
        fileReader.readAsDataURL(uploadImage);
        fileReader.onload = () => {
            setUserInput((prev) => ({
                ...prev,
                previewImage: fileReader.result,
                thumbnail: uploadImage
            }));
        };
    }

    async function onSubmit(e) {
        e.preventDefault();

        const { title, description, category, createdBy, thumbnail } = userInput;

        if (!title || !description || !category || !createdBy || !thumbnail) {
            toast.error("Please fill all fields and add a thumbnail");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("category", category);
        formData.append("createdBy", createdBy);
        formData.append("thumbnail", thumbnail);

        const response = await dispatch(createCourse(formData));

        if (response.payload?.success) {
            navigate('/courses');
            setUserInput({
                title: "",
                description: "",
                category: "",
                createdBy: "",
                thumbnail: null,
                previewImage: ""
            });
        }
    }

    return (
        <HomeLayout>
            <form onSubmit={onSubmit} className='flex flex-col lg:flex-row lg:px-20 py-12'>
                {/* Left: Thumbnail Preview */}
                <div className="lg:w-1/2 w-full px-12 flex flex-col gap-4 lg:py-12 py-0">
                    {userInput.previewImage ? (
                        <img
                            src={userInput.previewImage}
                            alt="thumbnail"
                            className="rounded-xl w-full h-96 object-cover"
                        />
                    ) : (
                        <div className='w-full h-96 flex justify-center items-center border-2 border-slate-500 rounded-lg'>
                            <FcAddImage size={'10rem'} />
                        </div>
                    )}
                    <div className='flex flex-col gap-3'>
                        <label htmlFor="thumbnail" className='font-semibold text-white text-xl'>Course Thumbnail</label>
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
                    <div className='flex flex-col gap-3'>
                        <label htmlFor="title" className='font-semibold text-white text-xl'>Course Title</label>
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
                    <div className='flex flex-col gap-3'>
                        <label htmlFor="createdBy" className='font-semibold text-white text-xl'>Course Instructor</label>
                        <input
                            type="text"
                            id="createdBy"
                            name="createdBy"
                            value={userInput.createdBy}
                            onChange={handleChange}
                            placeholder="Type here"
                            className="input input-bordered input-accent w-full text-white"
                        />
                    </div>
                    <div className='flex flex-col gap-3'>
                        <label htmlFor="category" className='font-semibold text-white text-xl'>Course Domain</label>
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
                    <div className='flex flex-col gap-3'>
                        <label htmlFor="description" className='font-semibold text-white text-xl'>Course Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={userInput.description}
                            onChange={handleChange}
                            placeholder="Type here"
                            className="textarea textarea-accent resize-y min-h-16 w-full text-white"
                        />
                    </div>
                    <button type='submit' className='btn btn-primary'>Create</button>
                </div>
            </form>
        </HomeLayout>
    );
}

export default CreateCourse;
