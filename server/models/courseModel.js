import { model, Schema } from 'mongoose';

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      minLength: [8, 'Title must be at least 8 characters'],
      maxLength: [59, 'Title should be less than 60 characters'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minLength: [8, 'Description must be at least 8 characters'],
      maxLength: [200, 'Description should be less than 200 characters'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    thumbnail: {
      public_id: {
        type: String,
        required: true
      },
      secure_url: {
        type: String,
        required: true
      }
    },
    lectures: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        lecture: {
          public_id: { type: String, required: true },
          secure_url: { type: String, required: true }
        }
      }
    ],
    numberOfLectures: {
      type: Number,
      default: 0
    },
    createdBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      }
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    price: {
      type: Number,
      default: 0
    },
    isFree: {
      type: Boolean,
      default: false
    },

    // ✅ NEW FIELD: list of enrolled students
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
);

const Course = model('Course', courseSchema);

export default Course;
