// src/Pages/Signup.jsx

import { useEffect, useState } from "react";
import { BsCloudUpload, BsEnvelope, BsLock, BsPerson } from "react-icons/bs";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import option3 from "../../assets/json/option3.json";
import Particle from "../../components/Particle";
import axiosInstance from "../../helpers/axiosInstance";
import HomeLayout from "../../layouts/HomeLayout";
import { signup } from "../../Redux/slices/AuthSlice";

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    avatar: null,
  });

  const [previewImage, setPreviewImage] = useState("");
  const [inviteToken, setInviteToken] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setInviteToken(token);

      axiosInstance
        .post("/user/verify-invite", { token }) // ✅ corrected path
        .then((res) => {
          if (res.data?.success) {
            setSignUpData((prev) => ({
              ...prev,
              email: res.data.email,
            }));
          }
        })
        .catch(() => {
          alert("Invalid or expired invite link");
          navigate("/login");
        });
    }
  }, []);

  const handleUserInput = (e) => {
    const { name, value } = e.target;
    setSignUpData({ ...signUpData, [name]: value });
  };

  const getImage = (e) => {
    const uploadedImage = e.target.files[0];
    if (uploadedImage) {
      setSignUpData({ ...signUpData, avatar: uploadedImage });

      const fileReader = new FileReader();
      fileReader.readAsDataURL(uploadedImage);
      fileReader.onloadend = () => setPreviewImage(fileReader.result);
    }
  };

  const createAccount = async (e) => {
    e.preventDefault();

    let avatarUrl = "";

    if (signUpData.avatar) {
      const formData = new FormData();
      formData.append("file", signUpData.avatar);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      formData.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

      try {
        const { data } = await axiosInstance.post(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );
        avatarUrl = data.secure_url;
      } catch (err) {
        console.error("Cloudinary Upload Error:", err);
        alert("Avatar upload failed.");
        return;
      }
    }

    const payload = {
      fullName: signUpData.name,
      email: signUpData.email,
      password: signUpData.password,
      avatar: avatarUrl,
      token: inviteToken,
    };

    const res = await dispatch(signup(payload));
    if (res?.payload?.success) {
      navigate("/"); // ✅ Redirect after success
    }
  };

  return (
    <HomeLayout>
      <Particle option={option3} />
      <div className="flex justify-center items-center h-[90vh]">
        <form
          onSubmit={createAccount}
          className="bg-[#191c24] text-white w-[80%] max-w-[500px] p-8 rounded-xl shadow-md border border-gray-700"
        >
          <h1 className="text-3xl font-bold text-center mb-6">Create Account</h1>

          {/* Full Name */}
          <div className="mb-4 flex items-center gap-2 bg-gray-800 p-2 rounded">
            <BsPerson />
            <input
              type="text"
              placeholder="Full Name"
              name="name"
              className="bg-transparent outline-none w-full"
              onChange={handleUserInput}
              value={signUpData.name}
              required
            />
          </div>

          {/* Email (readOnly if invited) */}
          <div className="mb-4 flex items-center gap-2 bg-gray-800 p-2 rounded">
            <BsEnvelope />
            <input
              type="email"
              placeholder="Email"
              name="email"
              className="bg-transparent outline-none w-full"
              value={signUpData.email}
              onChange={handleUserInput}
              readOnly={!!inviteToken}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4 flex items-center gap-2 bg-gray-800 p-2 rounded">
            <BsLock />
            <input
              type="password"
              placeholder="Password"
              name="password"
              className="bg-transparent outline-none w-full"
              onChange={handleUserInput}
              value={signUpData.password}
              required
            />
          </div>

          {/* Avatar Upload */}
          <div className="mb-4 bg-gray-800 p-2 rounded flex items-center gap-2">
            <label htmlFor="avatar" className="cursor-pointer flex items-center gap-2">
              <BsCloudUpload />
              Upload Avatar
            </label>
            <input type="file" accept="image/*" id="avatar" className="hidden" onChange={getImage} />
          </div>

          {/* Image Preview */}
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-full mx-auto mb-4"
            />
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors py-2 rounded font-semibold"
          >
            Sign Up
          </button>

          <p className="text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </HomeLayout>
  );
}

export default Signup;
