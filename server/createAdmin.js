import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/userModel.js'; // Update path if needed

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const exists = await User.findOne({ email: 'admin.smartlms@gmail.com' });

    if (exists) {
      console.log('⚠️ Admin already exists');
    } else {
      const admin = new User({
        name: 'Admin',
        email: 'admin.smartlms@gmail.com',
        password: 'Admin@123',
        role: 'ADMIN'
      });
      await admin.save();
      console.log('✅ Admin created');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
};

createAdmin();
