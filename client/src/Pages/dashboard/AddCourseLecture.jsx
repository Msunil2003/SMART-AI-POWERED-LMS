/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { RiVideoAddFill } from 'react-icons/ri';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { addLecture } from '../../Redux/slices/LectureSlice';

function AddCourseLecture() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id: courseId, name } = useParams();   // no need to decode
    const courseTitle = name;

    useEffect(() => {
        if (!courseId) navigate("/courses");
        document.title = 'Add Lecture - LMS';
    }, [courseId, navigate]);

    const [mode, setMode] = useState("upload"); // 'upload' or 'link'
    const [data, setData] = useState({
        cid: courseId, 
        courseTitle, 
        lecture: undefined,
        title: "",
        description: "",
        videoSrc: "",
        youtubeLink: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const handleVideo = (e) => {
        const video = e.target.files[0];
        if (video) {
            const source = window.URL.createObjectURL(video);
            setData(prev => ({ ...prev, lecture: video, videoSrc: source }));
        }
    };

    const extractYouTubeID = (url) => {
        const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([\w-]{11})/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    };

    const handleYouTubeLink = async () => {
        const videoId = extractYouTubeID(data.youtubeLink);
        if (!videoId) return toast.error("Invalid YouTube link");

        try {
            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (!res.ok) throw new Error("Unable to fetch video details");

            const info = await res.json();
            setData(prev => ({
                ...prev,
                videoSrc: `https://www.youtube.com/embed/${videoId}`,
                title: info.title,
                description: info.author_name
            }));
            toast.success("YouTube info fetched successfully");
        } catch (error) {
            toast.error("Failed to fetch YouTube video info");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!data.cid) return toast.error("Invalid course ID");

        // Validation
        if (mode === 'upload' && (!data.lecture || !data.title || !data.description)) {
            return toast.error("All fields are required for file upload");
        }

        if (mode === 'link' && (!data.youtubeLink || !data.videoSrc || !data.title)) {
            return toast.error("Please provide a valid YouTube link and fetch info");
        }

        const res = await dispatch(addLecture({ ...data, mode }));

        if (res?.payload?.lectures) {
            toast.success("Lecture added successfully");

            // Navigate to the lectures list of this course
            navigate(`/course/${courseTitle}/${courseId}/lectures`);
        } else {
            toast.error("Failed to add lecture");
        }
    };

    return (
        <form 
            onSubmit={handleSubmit} 
            className='flex lg:flex-row md:flex-row flex-col items-center justify-center lg:h-screen md:h-screen w-full lg:px-20 py-6 lg:py-0 md:py-0'
        >
            {/* Video Preview */}
            <div className="lg:w-1/2 md:w-1/2 w-full lg:px-12 md:px-12 px-5">
                <div className='mb-4 flex items-center gap-4'>
                    <FaArrowLeft 
                        className="text-white text-2xl cursor-pointer hover:text-slate-600" 
                        onClick={() => navigate(-1)} 
                    />
                    Go back
                </div>

                {data.videoSrc ? (
                    mode === 'upload' ? (
                        <video key={data.videoSrc} controls className="w-full lg:h-96 border-2 border-slate-500 rounded-md">
                            <source src={data.videoSrc} type="video/mp4" />
                        </video>
                    ) : (
                        <iframe
                            width="100%"
                            height="400"
                            src={data.videoSrc}
                            title="YouTube Video"
                            frameBorder="0"
                            allowFullScreen
                        />
                    )
                ) : (
                    <div className='w-full lg:h-96 flex justify-center items-center border-2 border-slate-500 rounded-lg'>
                        <RiVideoAddFill size={'10rem'} />
                    </div>
                )}
            </div>

            {/* Lecture Form */}
            <div className="lg:w-1/2 w-full lg:px-12 px-5 flex flex-col gap-5">
                <p className="text-white font-bold text-xl">
                    Adding lecture to: <span className="text-yellow-400">{courseTitle}</span>
                </p>

                {/* Mode Toggle */}
                <div className='flex gap-5'>
                    <label className='text-white'>
                        <input type="radio" value="upload" checked={mode === "upload"} onChange={() => setMode("upload")} />
                        &nbsp; Upload Video
                    </label>
                    <label className='text-white'>
                        <input type="radio" value="link" checked={mode === "link"} onChange={() => setMode("link")} />
                        &nbsp; YouTube Link
                    </label>
                </div>

                {mode === "upload" ? (
                    <div className='flex flex-col gap-3'>
                        <label className='font-semibold text-white text-xl'>Course Lecture</label>
                        <input 
                            type="file" 
                            accept='video/mp4' 
                            onChange={handleVideo} 
                            className="file-input file-input-bordered file-input-accent w-full text-white" 
                        />
                    </div>
                ) : (
                    <div className='flex flex-col gap-3'>
                        <label className='font-semibold text-white text-xl'>YouTube Link</label>
                        <input 
                            type="text" 
                            name='youtubeLink' 
                            value={data.youtubeLink} 
                            onChange={handleChange} 
                            placeholder="https://youtu.be/..." 
                            className="input input-bordered input-accent w-full text-white" 
                        />
                        <button type="button" onClick={handleYouTubeLink} className='btn btn-accent mt-2'>
                            Fetch Info
                        </button>
                    </div>
                )}

                <div className='flex flex-col gap-3'>
                    <label className='font-semibold text-white text-xl'>Lecture Title</label>
                    <input 
                        type="text" 
                        name='title' 
                        value={data.title} 
                        onChange={handleChange} 
                        placeholder="Title" 
                        className="input input-bordered input-accent w-full text-white" 
                    />
                </div>

                <div className='flex flex-col gap-3'>
                    <label className='font-semibold text-white text-xl'>Lecture Description</label>
                    <textarea 
                        name='description' 
                        value={data.description} 
                        onChange={handleChange} 
                        placeholder="Description" 
                        className="textarea textarea-accent text-white min-h-16 resize-y">
                    </textarea>
                </div>

                <button type='submit' className='btn btn-primary'>
                    Add Lecture
                </button>
            </div>
        </form>
    );
}

export default AddCourseLecture;
