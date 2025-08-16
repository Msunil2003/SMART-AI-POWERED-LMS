/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { BsCloudUpload } from 'react-icons/bs';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import axiosInstance from '../../helpers/axiosInstance';
import HomeLayout from '../../layouts/HomeLayout';
import { editProfile, getProfile, loadUser } from '../../Redux/slices/AuthSlice';

function Profile() {
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.auth.user);

  const [data, setData] = useState({
    previewImage: '',
    name: '',
    email: '',
    phone: '',
    avatar: undefined,
    userId: '',
    role: 'USER',
    access: false,
  });

  const [isEditing, setIsEditing] = useState(false);

  // Populate form with user data from Redux
  useEffect(() => {
    if (!userData) {
      dispatch(loadUser()); // fetch user if not in Redux
      return;
    }

    const u = userData.user || userData; // handle nested or flat structure

    setData({
      previewImage: u?.avatar?.secure_url || '',
      name: u?.name || '',
      email: u?.email || '',
      phone: u?.phone || '',
      avatar: undefined,
      userId: u?._id || '',
      role: u?.role?.toUpperCase() || 'USER',
      access: u?.subscription?.access || false,
    });
  }, [userData, dispatch]);

  const handleImageChange = (e) => {
    const uploadImg = e.target.files[0];
    if (!uploadImg) return;

    const fileReader = new FileReader();
    fileReader.readAsDataURL(uploadImg);
    fileReader.onload = () => {
      setData((prev) => ({
        ...prev,
        previewImage: fileReader.result,
        avatar: uploadImg,
      }));
    };
  };

  const handleUserInput = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelSubscription = async () => {
    try {
      const res = await axiosInstance.post('/payment/cancel');
      toast.success(res.data.message);
      dispatch(getProfile());
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cancellation failed');
    }
  };

  const onFormSubmit = async (e) => {
    e.preventDefault();

    if (!data.name) return toast.error('Name cannot be empty!');
    if (!data.phone || data.phone.length < 10)
      return toast.error('Enter a valid phone number!');

    const formData = new FormData();
    formData.append('fullName', data.name);
    formData.append('phone', data.phone);
    formData.append('userId', data.userId);
    if (data.avatar) formData.append('avatar', data.avatar);

    const res = await dispatch(editProfile(formData));
    if (res?.payload?.success) {
      setIsEditing(false);
      dispatch(getProfile());
      toast.success('Profile updated successfully');
    } else {
      toast.error(res?.payload?.message || 'Profile update failed');
    }
  };

  if (!userData) {
    return (
      <HomeLayout>
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-lg font-semibold">Loading profile...</p>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="min-h-[90vh] flex items-center justify-center p-4">
        <form
          noValidate
          onSubmit={onFormSubmit}
          className="flex flex-col justify-center gap-4 rounded-lg p-4 text-white w-full max-w-[500px] bg-gray-800 shadow-md"
        >
          <h1 className="text-center text-2xl font-bold">Your Profile</h1>

          {/* Profile Image */}
          <label htmlFor="image_uploads" className="cursor-pointer">
            {data.previewImage ? (
              <img
                src={data.previewImage}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover mx-auto"
              />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto bg-gray-700 flex items-center justify-center">
                <BsCloudUpload className="text-3xl text-white" />
              </div>
            )}
          </label>
          {isEditing && (
            <input
              className="hidden"
              type="file"
              name="image_uploads"
              id="image_uploads"
              accept=".jpg, .jpeg, .png"
              onChange={handleImageChange}
            />
          )}

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm">
              Name:
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter name"
              className={`bg-gray-700 px-4 py-2 rounded ${
                !isEditing ? 'cursor-not-allowed text-gray-400' : ''
              }`}
              value={data.name}
              onChange={handleUserInput}
              readOnly={!isEditing}
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-sm">
              Phone:
            </label>
            <input
              type="text"
              name="phone"
              id="phone"
              placeholder="Enter phone number"
              className={`bg-gray-700 px-4 py-2 rounded ${
                !isEditing ? 'cursor-not-allowed text-gray-400' : ''
              }`}
              value={data.phone}
              onChange={handleUserInput}
              readOnly={!isEditing}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm">
              Email:
            </label>
            <input
              readOnly
              type="email"
              name="email"
              id="email"
              className="bg-gray-600 px-4 py-2 rounded text-gray-300 cursor-not-allowed"
              value={data.email}
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-2">
            <label htmlFor="role" className="text-sm">
              Role:
            </label>
            <input
              readOnly
              type="text"
              name="role"
              id="role"
              className="bg-gray-600 px-4 py-2 rounded text-gray-300 cursor-not-allowed"
              value={data.role}
            />
          </div>

          {/* Cancel Subscription */}
          {data.role === 'USER' && data.access && (
            <button
              type="button"
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-semibold mt-2"
              onClick={handleCancelSubscription}
            >
              Cancel Subscription
            </button>
          )}

          {/* Edit / Save Buttons */}
          {!isEditing ? (
            <button
              type="button"
              className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded font-semibold mt-4"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-semibold mt-4"
            >
              Save Changes
            </button>
          )}
        </form>
      </div>
    </HomeLayout>
  );
}

export default Profile;
