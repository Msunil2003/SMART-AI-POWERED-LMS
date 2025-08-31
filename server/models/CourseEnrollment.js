import mongoose from "mongoose";

const courseEnrollmentSchema = new mongoose.Schema(
  {
    student: {
      id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
      },
      name: { 
        type: String, 
        required: true, 
        trim: true 
      },
      email: { 
        type: String, 
        required: true, 
        trim: true,
        lowercase: true
      },
    },
    course: {
      id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Course", 
        required: true 
      },
      name: { 
        type: String, 
        required: true, 
        trim: true 
      },
      createdBy: {
        id: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "User", 
          required: true 
        },
        name: { 
          type: String, 
          required: true, 
          trim: true 
        },
      },
    },
    enrolledAt: { 
      type: Date, 
      default: Date.now 
    },
  },
  { 
    timestamps: true 
  }
);

// Optional: Index to prevent duplicate enrollment for same user/course
courseEnrollmentSchema.index({ "student.id": 1, "course.id": 1 }, { unique: true });

export default mongoose.model("CourseEnrollment", courseEnrollmentSchema);
