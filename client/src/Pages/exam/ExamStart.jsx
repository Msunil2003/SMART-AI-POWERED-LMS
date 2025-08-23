import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

function ExamStart() {
  const { examCode } = useParams();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    // Start webcam
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        toast.error("Unable to access webcam/microphone!");
      }
    };
    startCamera();

    return () => {
      // Stop webcam when leaving page
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStartExam = () => {
    toast.info("Exam will start. Face verification & monitoring active.");
    // Future: call API to start session & proctoring
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-700">Exam Code: {examCode}</h1>
      <video
        ref={videoRef}
        autoPlay
        muted
        className="w-full max-w-md rounded-xl shadow-lg border-2 border-indigo-500"
      ></video>
      <button
        onClick={handleStartExam}
        className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
      >
        Start Exam
      </button>
    </div>
  );
}

export default ExamStart;
