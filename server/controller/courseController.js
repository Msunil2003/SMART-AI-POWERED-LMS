// controllers/courseController.js
import mongoose from "mongoose";
import Course from '../models/courseModel.js';
import createError from '../utils/error.js';
import { myCache } from '../app.js';

// ===== GET ALL COURSES =====
export const getAllCourses = async (req, res, next) => {
  try {
    let courses;

    if (myCache.has('courses')) {
      courses = JSON.parse(myCache.get('courses'));
    } else {
      courses = await Course.find({}).select('-lectures');
      myCache.set('courses', JSON.stringify(courses));
    }

    res.status(200).json({
      success: true,
      message: 'All courses fetched successfully',
      courses,
    });
  } catch (err) {
    next(createError(500, err.message));
  }
};

// ===== CREATE COURSE =====
export const createCourse = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(createError(401, 'You must be logged in to create a course.'));
    }

    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return next(createError(400, 'Title, description, and category are required.'));
    }

    // Build course object
    const courseData = {
      title,
      description,
      category,
      createdBy: {
        id: req.user._id,   // logged-in user's ID
        name: req.user.name // logged-in user's name
      },
      thumbnail: req.file
        ? { public_id: req.file.filename, secure_url: `/uploads/${req.file.filename}` }
        : null,
      numberOfLectures: 0,
    };

    const newCourse = await Course.create(courseData);

    // Clear instructor cache if any
    const cacheKey = `instructor-courses-${req.user._id}`;
    if (myCache.has(cacheKey)) {
      myCache.del(cacheKey);
    }

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      newCourse,
    });
  } catch (err) {
    next(createError(500, err.message));
  }
};

// ===== UPDATE COURSE =====
export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return next(createError(404, 'No course found'));

    course.title = req.body.title || course.title;
    course.description = req.body.description || course.description;
    course.category = req.body.category || course.category;

    if (req.file) {
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      course.thumbnail.public_id = req.file.filename;
      course.thumbnail.secure_url = `${serverUrl}/uploads/${req.file.filename}`;
    }

    await course.save();
    myCache.del('courses');
    myCache.del(`lectures-${id}`);

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course,
    });
  } catch (err) {
    next(createError(500, err.message));
  }
};

// ===== DELETE COURSE =====
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);
    if (!course) return next(createError(404, 'No course found'));

    myCache.del('courses');
    myCache.del(`lectures-${id}`);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (err) {
    next(createError(500, err.message));
  }
};

// ===== GET LECTURES FOR A COURSE =====
export const getLectures = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `lectures-${id}`;
    let lectures;

    if (myCache.has(cacheKey)) {
      lectures = JSON.parse(myCache.get(cacheKey));
    } else {
      const course = await Course.findById(id).select("lectures");
      if (!course) return next(createError(404, "No course found"));

      lectures = course.lectures || [];
      myCache.set(cacheKey, JSON.stringify(lectures));
    }

    res.status(200).json({
      success: true,
      message: lectures.length === 0 ? "No lectures added yet" : "Lectures fetched successfully",
      lectures,
    });
  } catch (err) {
    next(createError(500, err.message));
  }
};

// ===== ADD LECTURE TO COURSE =====
export const addLecturesToCourse = async (req, res, next) => {
  try {
    const { title, description, videoSrc, mode } = req.body;
    const { id } = req.params;

    if (!title || !description || (mode !== 'link' && !req.file)) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and a video file or link are required',
      });
    }

    const course = await Course.findById(id);
    if (!course) return next(createError(404, 'No course found'));

    const serverUrl = `${req.protocol}://${req.get('host')}`;
    const lectureData = { title, description, lecture: {} };

    if (mode === 'link') {
      lectureData.lecture.public_id = 'youtube';
      lectureData.lecture.secure_url = videoSrc;
    } else {
      lectureData.lecture.public_id = req.file.filename;
      lectureData.lecture.secure_url = `${serverUrl}/uploads/${req.file.filename}`;
    }

    course.lectures.push(lectureData);
    course.numberOfLectures = course.lectures.length;
    await course.save();
    myCache.del(`lectures-${id}`);

    res.status(200).json({
      success: true,
      message: 'Lecture added successfully',
      lectures: course.lectures,
    });
  } catch (err) {
    next(createError(500, err.message));
  }
};

// ===== UPDATE A LECTURE =====
export const updateLectures = async (req, res, next) => {
  try {
    const { id, lectureId } = req.params;
    const course = await Course.findById(id);
    if (!course) return next(createError(404, 'No course found'));

    const lectureToUpdate = course.lectures.find(l => l._id.toString() === lectureId);
    if (!lectureToUpdate) return next(createError(404, 'No lecture found'));

    lectureToUpdate.title = req.body.title || lectureToUpdate.title;
    lectureToUpdate.description = req.body.description || lectureToUpdate.description;

    if (req.file) {
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      lectureToUpdate.lecture.public_id = req.file.filename;
      lectureToUpdate.lecture.secure_url = `${serverUrl}/uploads/${req.file.filename}`;
    } else if (req.body.mode === 'link' && req.body.videoSrc) {
      lectureToUpdate.lecture.public_id = 'youtube';
      lectureToUpdate.lecture.secure_url = req.body.videoSrc;
    }

    await course.save();
    myCache.del(`lectures-${id}`);

    res.status(200).json({
      success: true,
      message: 'Lecture updated successfully',
      lectures: course.lectures,
    });
  } catch (err) {
    next(createError(500, err.message));
  }
};

// ===== DELETE A LECTURE =====
export const deleteLectures = async (req, res, next) => {
  try {
    const { id, lectureId } = req.params;
    const course = await Course.findById(id);
    if (!course) return next(createError(404, 'No course found'));

    const index = course.lectures.findIndex(l => l._id.toString() === lectureId);
    if (index === -1) return next(createError(404, 'No lecture found'));

    course.lectures.splice(index, 1);
    course.numberOfLectures = course.lectures.length;
    await course.save();
    myCache.del(`lectures-${id}`);

    res.status(200).json({
      success: true,
      message: 'Lecture deleted successfully',
      lectures: course.lectures,
    });
  } catch (err) {
    next(createError(500, err.message));
  }
};



// === GET COURSES CREATED BY LOGGED-IN INSTRUCTOR ===
// export const getInstructorCourses = async (req, res, next) => {
//   try {
//     if (!req.user || req.user.role !== "INSTRUCTOR") {
//       return next(
//         createError(403, "Access denied. Only instructors can access their courses.")
//       );
//     }

//     const instructorId = req.user._id.toString();
//     const cacheKey = `instructor-courses-${instructorId}`;
//     let courses;

//     // Serve from cache if available
//     const cachedCourses = myCache.get(cacheKey);
//     if (cachedCourses) {
//       courses = JSON.parse(cachedCourses);
//     } else {
//       // Fetch instructor courses
//       courses = await Course.find({ "createdBy.id": instructorId })
//         .select("-lectures") // exclude heavy lecture data
//         .lean();

//       // Normalize for frontend
//       courses = courses.map((course) => ({
//         _id: course._id.toString(),
//         title: course.title,
//         description: course.description,
//         category: course.category,
//         numberOfLectures: course.numberOfLectures || 0,
//         thumbnail: course.thumbnail || {},
//         createdBy: {
//           id: course.createdBy?.id?.toString() || instructorId,
//           name: course.createdBy?.name || "Unknown",
//         },
//         createdAt: course.createdAt,
//         updatedAt: course.updatedAt,
//       }));

//       // Cache normalized result
//       myCache.set(cacheKey, JSON.stringify(courses));
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Instructor courses fetched successfully",
//       courses,
//     });
//   } catch (error) {
//     return next(createError(500, error.message || "Failed to fetch instructor courses"));
//   }
// };
