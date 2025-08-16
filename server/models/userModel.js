import { Schema, model } from "mongoose";
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    minLength: [3, 'Name must be at least 3 characters'],
    maxLength: [15, 'Name should be less than 15 characters'],
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [
      /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: 8,
    match: [
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      'Password must contain at least one uppercase, one lowercase, one digit, and one special character'
    ],
    select: false
  },
  avatar: {
    public_id: { type: String },
    secure_url: { type: String }
  },

  role: {
    type: String,
    enum: ['USER', 'ADMIN', 'INSTRUCTOR'],
    default: 'USER'
  },

  // 🧑‍🏫 Instructor-specific fields
  invitedByAdmin: {
    type: Boolean,
    default: false
  },
  invitationStatus: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  },
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'APPROVED' // normal users are auto-approved
  },
  instructorCourses: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Course'
    }
  ],

  // 🚫 Banning info
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  },
  banMessage: {
    type: String,
    default: ''
  },

  // 🔐 Password reset
  forgotPasswordToken: String,
  forgotPasswordExpiry: Date,

  // 🧾 Optional - for subscription flow if needed again
  subscription: {
    id: String,
    status: String
  },

  // ✅ One-time purchase access
  access: {
    valid: { type: Boolean, default: false },
    purchasedAt: { type: Date, default: null }
  }

}, { timestamps: true });

// 🔐 Pre-save password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔐 Instance methods
userSchema.methods = {
  generateToken() {
    return JWT.sign(
      {
        id: this._id,
        email: this.email,
        role: this.role,
        access: this.access,
        subscription: this.subscription
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  },

  generateResetToken() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000;
    return resetToken;
  }
};

const User = model('User', userSchema);
export default User;
