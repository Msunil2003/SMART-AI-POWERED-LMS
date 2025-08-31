/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FiMic } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

function ExamStart() {
  const { examCode } = useParams();
  const decodedExamCode = decodeURIComponent(examCode);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [examStatus, setExamStatus] = useState({
    registered: false,
    verified: false,
    pendingVerification: false,
  });
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [micLevel, setMicLevel] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [examDetails, setExamDetails] = useState(null);
  const [startExamMode, setStartExamMode] = useState(false);

  const steps = [
    { id: 1, label: "Camera" },
    { id: 2, label: "Photo" },
    { id: 3, label: "Screen Share" },
    { id: 4, label: "Submit" },
  ];

  // ================= Check session on load =================
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/v1/exam/session-status",
          {
            params: { examCode: decodedExamCode },
            withCredentials: true,
          }
        );

        const data = res.data.data;

        if (data.alreadyRegistered) {
          const verified = data.status === "verified";
          setExamStatus({
            registered: true,
            verified,
            pendingVerification: !verified,
          });

          if (!verified) {
            setRegistrationMessage(
              "✅ Your exam session is successfully registered. Please wait until it redirects to the exam details page."
            );
          }

          toast[verified ? "success" : "info"](
            verified
              ? "✅ You are already verified for proctoring."
              : "ℹ️ You are registered. Pending verification."
          );
        } else {
          setExamStatus({ registered: false, verified: false, pendingVerification: false });
        }
      } catch (err) {
        console.error("Session check error:", err);
        toast.error("Error checking exam registration.");
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [decodedExamCode]);

  // ================= Fetch exam details =================
  useEffect(() => {
    const fetchExamDetails = async () => {
      if (!examStatus.registered) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/v1/exam/details/${decodedExamCode}`,
          { withCredentials: true }
        );
        setExamDetails(res.data.data);
      } catch (err) {
        console.error("Error fetching exam details:", err);
      }
    };
    fetchExamDetails();
  }, [examStatus.registered]);
// ================= Camera + mic setup =================
const startCamera = async () => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: true,
    });
    setStream(mediaStream);
    if (videoRef.current) videoRef.current.srcObject = mediaStream;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(mediaStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    dataArrayRef.current = dataArray;

    const updateMicLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setMicLevel(avg / 255);
      animationRef.current = requestAnimationFrame(updateMicLevel);
    };
    updateMicLevel();
  } catch (err) {
    toast.error("Unable to access webcam or microphone!");
  }
};

// ================= Stop camera + mic =================
const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    setStream(null);
  }
  if (animationRef.current) cancelAnimationFrame(animationRef.current);
  if (audioContextRef.current) audioContextRef.current.close();
  audioContextRef.current = null;
};

// ================= Effect to manage camera =================
useEffect(() => {
  // Wait until we know registration status
  if (loading) return;

  // If registration message is shown → stop camera/mic
  if (registrationMessage || examStatus.registered && !examStatus.verified) {
    stopCamera();
    return;
  }

  // Start camera only if user is not verified and no registration message
  if (!examStatus.registered || startExamMode) {
    startCamera();
  }

  return () => {
    stopCamera();
  };
}, [examStatus.registered, examStatus.verified, startExamMode, registrationMessage, loading]);

  // ================= Capture photo =================
  const captureSnapshot = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedPhoto(canvas.toDataURL("image/png"));
    setCurrentStep(2);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setCurrentStep(1);
    startCamera();
  };

  // ================= Screen share validation =================
  const requestScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const track = displayStream.getVideoTracks()[0];
      const settings = track.getSettings();

      if (!settings.displaySurface || settings.displaySurface !== "monitor") {
        toast.error("Please share your entire screen, not just a tab/window.");
        displayStream.getTracks().forEach((t) => t.stop());
        return false;
      }

      displayStream.getTracks().forEach((t) => t.stop());
      setCurrentStep(3);
      return true;
    } catch (err) {
      toast.error("Screen sharing is required.");
      return false;
    }
  };

  // ================= Submit registration =================
  const handleSubmit = async () => {
    try {
      const screenOk = await requestScreenShare();
      if (!screenOk) return;

      const blob = await (await fetch(capturedPhoto)).blob();
      const formData = new FormData();
      formData.append("faceSnapshot", blob, "photo.png");
      formData.append("examCode", decodedExamCode);

      const ipAddress = await fetch("https://api.ipify.org?format=json")
        .then((res) => res.json())
        .then((data) => data.ip);
      formData.append("ipAddress", ipAddress);
      formData.append("deviceInfo", navigator.userAgent);

      const res = await axios.post(
        "http://localhost:5000/api/v1/exam/start-session",
        formData,
        { withCredentials: true }
      );

      if (res.data.success) {
        setExamStatus({ registered: true, verified: false, pendingVerification: true });
        setRegistrationMessage(
          "✅ Your exam session is successfully registered. Please wait until your instructor starts the exam."
        );
        setCurrentStep(4);
        toast.info("Exam registration submitted. Pending verification.");
      } else {
        toast.error(res.data.message || "Exam registration failed.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Error submitting exam registration.");
    }
  };

  // ================= Start exam and verify face =================
  const handleStartExam = async () => {
    setStartExamMode(true);
    setCurrentStep(1);
  };

  const verifyFaceAndStartExam = async () => {
    try {
      const blob = await (await fetch(capturedPhoto)).blob();
      const formData = new FormData();
      formData.append("currentSnapshot", blob, "current.png");
      formData.append("examCode", decodedExamCode);

      const res = await axios.post(
        "http://localhost:5000/api/v1/exam/verify-face",
        formData,
        { withCredentials: true }
      );

      if (res.data.verified) {
        toast.success("✅ Face verified. You can start the exam.");
        setExamStatus({ ...examStatus, verified: true, pendingVerification: false });
      } else {
        toast.error("Face verification failed. Try again.");
        setCapturedPhoto(null);
        setCurrentStep(1);
      }
    } catch (err) {
      console.error("Face verification error:", err);
      toast.error("Error verifying face.");
    }
  };

  // ================= Render logic =================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-700 text-center px-4">
          Checking your exam registration...
        </h1>
      </div>
    );
  }

  // Already registered but not verified → show message
  if (registrationMessage && !examStatus.verified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 p-6">
        <h1 className="text-2xl font-bold text-yellow-700 text-center">
          {registrationMessage}
        </h1>
      </div>
    );
  }

  // Verified → show Start Exam
  if (examStatus.verified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-6">
        <h1 className="text-2xl font-bold text-green-700 text-center">
          ✅ You are verified for proctoring.
        </h1>
        {examDetails && !startExamMode && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold text-gray-700 text-center">
              Exam: {examDetails.title}
            </h2>
            <button
              onClick={handleStartExam}
              className="mt-6 px-10 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition shadow-md"
            >
              Start Exam
            </button>
          </div>
        )}
      </div>
    );
  }

  // ================= Pre-proctoring wizard for new users =================
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-50 p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Exam Code: {decodedExamCode}
      </h1>

      {/* Wizard Steps */}
      <div className="flex w-full max-w-xl justify-between items-center mb-6">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex-1 flex flex-col items-center relative">
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg z-10 transition ${
                currentStep === step.id
                  ? "bg-indigo-600 text-white scale-110 shadow-xl"
                  : currentStep > step.id
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
              animate={{ scale: currentStep === step.id ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              {currentStep > step.id ? "✓" : step.id}
            </motion.div>
            <span className="mt-2 text-sm font-medium text-center">{step.label}</span>
            {idx < steps.length - 1 && (
              <div className="absolute top-5 left-1/2 w-full h-1 z-0">
                <motion.div
                  className="h-1 bg-indigo-400 rounded"
                  initial={{ width: 0 }}
                  animate={{
                    width: currentStep > step.id ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.5 }}
                ></motion.div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Webcam + Mic */}
      {!examStatus.verified && !registrationMessage && (
        <div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-4 border-indigo-500 bg-black">
          <AnimatePresence>
            {!capturedPhoto && (
              <motion.video
                key="video"
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-96 object-cover"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
              ></motion.video>
            )}
          </AnimatePresence>

          {!capturedPhoto && (
            <div className="absolute bottom-4 left-4 flex items-center bg-black/50 px-3 py-1 rounded-full">
              <FiMic className="text-green-400 mr-2" size={24} />
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-4 bg-green-400 rounded-sm"
                    style={{
                      height: `${Math.min(micLevel * 40 + i * 4, 40)}px`,
                    }}
                  ></div>
                ))}
              </div>
              <span className="ml-2 text-white font-semibold">Mic Active</span>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden"></canvas>

      {/* Capture / Preview */}
      {!examStatus.verified && !registrationMessage && (
        <AnimatePresence>
          {!capturedPhoto ? (
            <motion.button
              key="capture"
              onClick={captureSnapshot}
              className="mt-4 px-10 py-3 bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 transition shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              Capture Photo
            </motion.button>
          ) : startExamMode ? (
            <motion.button
              key="verify"
              onClick={verifyFaceAndStartExam}
              className="mt-4 px-10 py-3 bg-green-600 text-white rounded-full font-semibold text-lg hover:bg-green-700 transition shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              Verify Face & Start Exam
            </motion.button>
          ) : (
            <motion.div
              key="preview"
              className="flex flex-col items-center mt-6 space-y-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <img
                src={capturedPhoto}
                alt="Captured Preview"
                className="w-[500px] h-[375px] object-cover border-4 border-green-500 rounded-2xl shadow-xl"
              />
              <div className="flex space-x-4">
                <button
                  onClick={handleSubmit}
                  className="px-10 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition shadow-md"
                >
                  Submit
                </button>
                <button
                  onClick={retakePhoto}
                  className="px-8 py-3 bg-gray-500 text-white rounded-full font-semibold hover:bg-gray-600 transition shadow-md"
                >
                  Retake Photo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default ExamStart;
