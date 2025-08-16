import "react-toastify/dist/ReactToastify.css";

import Cookies from "js-cookie";
import { useState } from "react";
import { BsEnvelope, BsLock } from "react-icons/bs";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import option2 from "../../assets/json/option2.json";
import Particle from "../../components/Particle";
import HomeLayout from "../../layouts/HomeLayout";
import { forgotPassword, login } from "../../Redux/slices/AuthSlice";

function LogIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = import.meta.env.VITE_TOKEN;

  const [logInData, setLogInData] = useState({ email: "", password: "" });

  const handleUserInput = (e) => {
    const { name, value } = e.target;
    setLogInData((prev) => ({ ...prev, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();

    if (!logInData.email || !logInData.password) {
      toast.warning("Please fill in both email and password.", { position: "top-center" });
      return;
    }

    const { payload } = await dispatch(login(logInData));
    if (!payload) return;

    // -------------------- BANNED USERS --------------------
    if (payload?.banned) {
      navigate("/banned", {
        state: {
          name: payload.user?.name || "User",
          email: payload.user?.email || "",
          subscription: payload.user?.subscription || "Inactive",
          banReason: payload.reason || "Violation of rules",
          banMessage: payload.message || "Please contact support",
        },
      });
      return;
    }

    // -------------------- LOGIN SUCCESS --------------------
    const user = payload.userData;
    if (!user) {
      toast.error(payload?.message || "Login failed. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    // Set auth token cookie
    Cookies.set("authToken", token, { expires: 7 });
    setLogInData({ email: "", password: "" });

    const role = user.role;
    const status = user.approvalStatus?.toUpperCase();

    // -------------------- ROLE-BASED REDIRECTION --------------------
    if (role === "INSTRUCTOR") {
      if (status === "APPROVED") {
        navigate("/instructor/dashboard/home");
        toast.success("Welcome Instructor! Redirecting to Dashboard...");
      } else {
        navigate("/instructor/status");
        toast.warn("Your instructor account is pending approval.");
      }
      return;
    }

    if (role === "ADMIN") {
      navigate("/admin/dashboard/");
      toast.success("Welcome Admin! Redirecting to Dashboard...");
      return;
    }

    // -------------------- NORMAL USERS --------------------
    navigate("/");
    toast.success(payload.message || "Login successful!");
  };

  const onForgotPassword = async () => {
    if (!logInData.email) {
      toast.warning("Please enter your email to reset password.", { position: "top-center" });
      return;
    }

    const { payload } = await dispatch(forgotPassword({ email: logInData.email }));

    if (payload?.success) {
      setLogInData({ email: "", password: "" });
      toast.success("Password reset email sent", { position: "top-center", autoClose: 3000 });
    }
  };

  return (
    <HomeLayout>
      <Particle option={option2} />
      <div className="flex flex-col gap-3 justify-center items-center h-[91vh]">
        <form
          onSubmit={onLogin}
          className="lg:w-[450px] w-[90%] md:w-1/2 h-fit p-7 flex flex-col justify-between gap-7 rounded-md bg-white text-black shadow-md"
        >
          <div>
            <h1 className="text-3xl font-semibold mb-3">Log In</h1>
            <p className="text-slate-400">Please fill this form to login your account</p>
          </div>
          <hr className="border-t-2 border-slate-500" />

          {/* Email */}
          <div className="flex items-center w-full gap-4 border-2 border-yellow-500 px-4 rounded-lg h-14 bg-slate-900">
            <label htmlFor="email" className="text-xl hidden lg:block md:block text-yellow-500">
              <BsEnvelope />
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Enter Email"
              className="py-2 border-0 outline-0 text-xl text-white bg-transparent w-full"
              value={logInData.email}
              onChange={handleUserInput}
            />
          </div>

          {/* Password */}
          <div className="flex items-center w-full gap-4 border-2 border-yellow-500 px-4 rounded-lg h-14 bg-slate-900">
            <label htmlFor="password" className="text-xl hidden lg:block md:block text-yellow-500">
              <BsLock />
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Enter Password"
              className="py-2 border-0 outline-0 text-xl text-white bg-transparent w-full"
              value={logInData.password}
              onChange={handleUserInput}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mx-auto">
            Log In
          </button>

          <p
            onClick={onForgotPassword}
            className="text-right text-slate-500 text-[1rem] cursor-pointer hover:underline"
          >
            Forgot Password?
          </p>
        </form>

        <p className="text-xl text-white">
          Don&apos;t have an account?{" "}
          <Link to={"/signup"} className="text-2xl text-blue-500 hover:underline">
            Signup
          </Link>{" "}
          here
        </p>
      </div>
    </HomeLayout>
  );
}

export default LogIn;
