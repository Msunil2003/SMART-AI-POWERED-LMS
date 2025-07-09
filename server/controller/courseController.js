import Course from '../models/courseModel.js';
import createError from '../utils/error.js';
import fs from 'fs/promises';
import { myCache } from '../app.js';

// === GET ALL COURSES ===
export const getAllCourses = async (req, res, next) => {
  try {
    let courses;
    if (myCache.has("courses")) {
      courses = JSON.parse(myCache.get("courses"));
    } else {
      courses = await Course.find({}).select('-lectures');
      if (!courses) return next(createError(404, "No courses found"));
      myCache.set("courses", JSON.stringify(courses));
    }
    res.status(200).json({ success: true, message: "All courses", courses });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// === CREATE COURSE ===
export const createCourse = async (req, res, next) => {
  try {
    const { title, description, category, createdBy } = req.body;

    if (!title || !description || !category || !createdBy || !req.file) {
      return res.status(400).json({
        success: false,
        message: "All fields including a thumbnail image are required.",
      });
    }

    const serverUrl = `${req.protocol}://${req.get("host")}`;

    const newCourse = new Course({
      title,
      description,
      category,
      createdBy,
      thumbnail: {
        public_id: req.file.filename,
        secure_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      },
    });

    await newCourse.save();
    myCache.del("courses");

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      newCourse,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// === UPDATE COURSE ===
export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) return next(createError(404, "No course found"));

    course.title = req.body.title || course.title;
    course.description = req.body.description || course.description;
    course.category = req.body.category || course.category;
    course.createdBy = req.body.createdBy || course.createdBy;

    if (req.file) {
      const serverUrl = `${req.protocol}://${req.get("host")}`;
      course.thumbnail.public_id = req.file.filename;
      course.thumbnail.secure_url = `${serverUrl}/uploads/${req.file.filename}`;
    }

    await course.save();
    myCache.del("courses");

    res.status(200).json({ success: true, message: "Course updated successfully", course });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// === DELETE COURSE ===
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);
    if (!course) return next(createError(404, "No course found"));

    myCache.del("courses");
    res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// === GET LECTURES ===
export const getLectures = async (req, res, next) => {
  try {
    const { id } = req.params;
    let lectures;

    if (myCache.has("lectures")) {
      lectures = JSON.parse(myCache.get("lectures"));
    } else {
      const course = await Course.findById(id);
      if (!course) return next(createError(404, "No course found"));
      lectures = course.lectures;
      myCache.set("lectures", JSON.stringify(lectures));
    }

    res.status(200).json({
      success: true,
      message: "Lectures fetched successfully",
      lectures,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// === ADD LECTURE ===
export const addLecturesToCourse = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title || !description || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and lecture video file are required.",
      });
    }

    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return next(createError(404, "No course found"));

    const serverUrl = `${req.protocol}://${req.get("host")}`;

    const lectureData = {
      title,
      description,
      lecture: {
        public_id: req.file.filename,
        secure_url: `${serverUrl}/uploads/${req.file.filename}`,
      },
    };

    course.lectures.push(lectureData);
    course.numberOfLectures = course.lectures.length;

    await course.save();
    myCache.del("lectures");

    res.status(200).json({
      success: true,
      message: "Lecture added successfully",
      lectures: course.lectures,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// === UPDATE LECTURE ===
export const updateLectures = async (req, res, next) => {
  try {
    const { id, lectureId } = req.params;
    const course = await Course.findById(id);
    if (!course) return next(createError(404, "No course found"));

    const lectureToUpdate = course.lectures.find(l => l._id.toString() === lectureId);
    if (!lectureToUpdate) return next(createError(404, "No lecture found"));

    lectureToUpdate.title = req.body.title || lectureToUpdate.title;
    lectureToUpdate.description = req.body.description || lectureToUpdate.description;

    if (req.file) {
      const serverUrl = `${req.protocol}://${req.get("host")}`;
      lectureToUpdate.lecture.public_id = req.file.filename;
      lectureToUpdate.lecture.secure_url = `${serverUrl}/uploads/${req.file.filename}`;
    }

    await course.save();
    myCache.del("lectures");

    res.status(200).json({
      success: true,
      message: "Lecture updated successfully",
      course: course.lectures,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// === DELETE LECTURE ===
export const deleteLectures = async (req, res, next) => {
  try {
    const { id, lectureId } = req.params;
    const course = await Course.findById(id);
    if (!course) return next(createError(404, "No course found"));

    const index = course.lectures.findIndex(l => l._id.toString() === lectureId);
    if (index === -1) return next(createError(404, "No lecture found"));

    course.lectures.splice(index, 1);
    course.numberOfLectures = course.lectures.length;

    await course.save();
    myCache.del("lectures");

    res.status(200).json({
      success: true,
      message: "Lecture deleted successfully",
      lectures: course.lectures,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};
