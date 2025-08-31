/* eslint-disable no-unused-vars */
/* src/pages/ExamQuestionsBuilder.jsx */
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiEdit2, FiPlus, FiSave, FiTrash2, FiUpload, FiX } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

/* ---------- Status Modal ---------- */
const StatusModal = ({ open, onClose, message }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          initial={{ y: 30, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 30, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl p-6 w-96 relative"
        >
          <h3 className="text-lg font-semibold mb-2">Status</h3>
          <p className="text-gray-700">{message}</p>
          <div className="flex justify-end mt-4">
            <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ---------- Type Picker Modal ---------- */
const TypePickModal = ({ open, onClose, onPick }) => {
  const [mcq, setMcq] = useState(true);
  const [desc, setDesc] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ y: 30, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 30, scale: 0.98 }}
            className="bg-white rounded-2xl shadow-xl p-6 w-11/12 md:w-2/3 lg:w-1/2 relative"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Select question types</h3>
              <button onClick={onClose} className="text-gray-500">
                <FiX />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`border rounded-xl p-4 cursor-pointer ${mcq ? "ring-2 ring-indigo-500" : ""}`}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={mcq} onChange={() => setMcq(!mcq)} />
                  <span className="font-medium">Multiple Choice (MCQ)</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Add options and select the correct answer.</p>
              </label>

              <label className={`border rounded-xl p-4 cursor-pointer ${desc ? "ring-2 ring-indigo-500" : ""}`}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={desc} onChange={() => setDesc(!desc)} />
                  <span className="font-medium">Descriptive</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Open-ended answer with expected solution.</p>
              </label>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => onPick({ mcq, desc })}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"
              >
                <FiPlus /> Create
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ---------- Main Exam Builder ---------- */
export default function ExamQuestionsBuilder() {
  const { setId } = useParams();
  const navigate = useNavigate();

  const [showTypeModal, setShowTypeModal] = useState(true);
  const [formQueue, setFormQueue] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/v1/exam/questions/set/${setId}`, {
        withCredentials: true,
      });
      const arr = Array.isArray(res?.data?.data) ? res.data.data : [];
      const loaded = arr.map((q) => ({ type: q.type, key: cryptoRandom(), data: q }));
      setFormQueue(loaded);
    } catch (e) {
      console.error("Fetch questions failed", e);
      setFormQueue([]);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [setId]);

  const addForms = ({ mcq, desc }) => {
    const items = [];
    if (mcq) items.push({ type: "MCQ", key: cryptoRandom() });
    if (desc) items.push({ type: "DESCRIPTIVE", key: cryptoRandom() });
    setFormQueue((prev) => [...prev, ...items]);
    setShowTypeModal(false);
  };

  const removeForm = (key) => setFormQueue((prev) => prev.filter((f) => f.key !== key));

  const handleSaved = (msg) => {
    setStatusMsg(msg);
    setShowStatus(true);
    fetchQuestions();
  };

  const markReady = async () => {
    if (formQueue.length === 0) {
      setStatusMsg("Cannot mark ready: No questions added.");
      setShowStatus(true);
      return;
    }
    try {
      setSubmitting(true);
      const res = await axios.patch(
        `http://localhost:5000/api/v1/exam/sets/${setId}/ready`,
        { ready: true },
        { withCredentials: true }
      );
      if (res.data.success) {
        setStatusMsg("Exam set marked READY. You can now assign it.");
        setShowStatus(true);
        navigate(-1);
      } else {
        setStatusMsg(res.data.message || "Could not mark as ready");
        setShowStatus(true);
      }
    } catch (e) {
      console.error(e);
      setStatusMsg(e?.response?.data?.message || "Server error");
      setShowStatus(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <TypePickModal open={showTypeModal} onClose={() => setShowTypeModal(false)} onPick={addForms} />
      <StatusModal open={showStatus} onClose={() => setShowStatus(false)} message={statusMsg} />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Build Exam Questions</h1>
          <p className="text-sm text-gray-500">
            Add MCQ or Descriptive questions. Upload an image or a video if needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTypeModal(true)} className="px-3 py-2 rounded-lg bg-gray-100">
            + Add Type
          </button>
          <button
            onClick={markReady}
            disabled={submitting || formQueue.length === 0}
            className="px-3 py-2 rounded-lg bg-green-600 text-white flex items-center gap-2"
          >
            <FiCheckCircle /> Mark Set Ready
          </button>
        </div>
      </motion.div>

      <div className="space-y-4">
        {formQueue.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-2xl border-2 border-dashed text-center text-gray-500">
            Click “+ Add Type” to start adding questions.
          </motion.div>
        )}
        {formQueue.map((f) =>
          f.type === "MCQ" ? (
            <MCQCard key={f.key} setId={setId} existing={f.data} onRemove={() => removeForm(f.key)} onSaved={handleSaved} />
          ) : (
            <DescCard key={f.key} setId={setId} existing={f.data} onRemove={() => removeForm(f.key)} onSaved={handleSaved} />
          )
        )}
      </div>
    </div>
  );
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ---------- MCQ Card ---------- */
const MCQCard = ({ setId, existing, onRemove, onSaved }) => {
  const [marks, setMarks] = useState(existing?.marks || 1);
  const [prompt, setPrompt] = useState(existing?.prompt || "");
  const [options, setOptions] = useState(existing?.options || ["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(existing?.correctAnswerIndex ?? 0);
  const [mediaFile, setMediaFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const valid = useMemo(() => {
    const filled = options.filter(Boolean);
    return prompt.trim().length > 3 && filled.length >= 2 && correctIndex >= 0 && correctIndex < options.length && marks > 0;
  }, [prompt, options, correctIndex, marks]);

  const onFile = (e) => setMediaFile(e.target.files?.[0] || null);

  const removeOption = (i) => {
    setOptions((prev) => {
      const newOpts = prev.filter((_, idx) => idx !== i);
      if (correctIndex >= newOpts.length) setCorrectIndex(newOpts.length - 1);
      return newOpts;
    });
  };

  const submit = async () => {
    if (!valid) return;
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("type", "MCQ");
      fd.append("marks", String(marks));
      fd.append("prompt", prompt);
      fd.append("options", JSON.stringify(options));
      fd.append("correctAnswerIndex", String(correctIndex));
      if (mediaFile) fd.append("media", mediaFile);

      const res = existing?._id
        ? await axios.patch(`http://localhost:5000/api/v1/exam/questions/${setId}/${existing._id}`, fd, { withCredentials: true })
        : await axios.post(`http://localhost:5000/api/v1/exam/questions/${setId}`, fd, { withCredentials: true });

      if (res.data.success) onSaved(existing ? "MCQ updated!" : "MCQ saved!");
    } catch (e) {
      console.error(e);
      onSaved(e?.response?.data?.message || "Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteQ = async () => {
    if (!existing?._id) return onRemove();
    try {
      await axios.delete(`http://localhost:5000/api/v1/exam/questions/${setId}/${existing._id}`, { withCredentials: true });
      onSaved("Question deleted!");
    } catch (e) {
      console.error(e);
      onSaved("Delete failed");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl shadow-sm border p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">MCQ Question</h4>
        <div className="flex gap-2">
          <button onClick={deleteQ} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
            <FiTrash2 /> Delete
          </button>
          <button onClick={onRemove} className="text-sm text-gray-500 hover:text-red-600">
            Remove
          </button>
        </div>
      </div>

      {/* Marks and Prompt */}
      <div className="grid md:grid-cols-6 gap-3">
        <div className="md:col-span-1">
          <label className="text-sm text-gray-600">Marks</label>
          <input type="number" min={0.5} step={0.5} value={marks} onChange={(e) => setMarks(parseFloat(e.target.value))} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="md:col-span-5">
          <label className="text-sm text-gray-600">Question Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full border rounded px-3 py-2" rows={2} placeholder="Enter the question text..." />
        </div>
      </div>

      {/* Options */}
      <div className="mt-3">
        <label className="text-sm text-gray-600 block mb-1">Options</label>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                className="flex-1 border rounded px-3 py-2"
                value={opt}
                onChange={(e) => setOptions(options.map((v, i) => (i === idx ? e.target.value : v)))}
                placeholder={`Option ${idx + 1}`}
              />
              <input type="radio" name={`correct-${existing?._id || "new"}`} checked={correctIndex === idx} onChange={() => setCorrectIndex(idx)} title="Correct answer" />
              {options.length > 2 && (
                <button onClick={() => removeOption(idx)} className="px-2 py-1 text-sm rounded bg-gray-100">
                  <FiX />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={() => setOptions([...options, ""])} className="mt-2 px-3 py-1 rounded bg-gray-100">
          + Add option
        </button>
      </div>

      {/* Media */}
      <div className="mt-3">
        <label className="text-sm text-gray-600 block mb-1">Attach image/video (optional)</label>
        <label className="flex items-center gap-2 px-3 py-2 border rounded cursor-pointer w-fit">
          <FiUpload />
          <span>Choose file</span>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
        </label>
        {mediaFile && (
          <div className="mt-1">
            {mediaFile.type.startsWith("image/") ? (
              <img src={URL.createObjectURL(mediaFile)} alt="preview" className="w-40 h-40 object-contain rounded" />
            ) : (
              <video src={URL.createObjectURL(mediaFile)} controls className="w-64 h-40 rounded" />
            )}
            <button onClick={() => setMediaFile(null)} className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FiX /> Remove file
            </button>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="mt-4 flex justify-end">
        <button onClick={submit} disabled={!valid || submitting} className="px-4 py-2 rounded bg-indigo-600 text-white flex items-center gap-2">
          <FiSave /> {existing ? "Update Question" : "Save Question"}
        </button>
      </div>
    </motion.div>
  );
};

/* ---------- Descriptive Card ---------- */
const DescCard = ({ setId, existing, onRemove, onSaved }) => {
  const [marks, setMarks] = useState(existing?.marks || 1);
  const [prompt, setPrompt] = useState(existing?.prompt || "");
  const [expected, setExpected] = useState(existing?.expectedAnswer || "");
  const [mediaFile, setMediaFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const valid = useMemo(() => prompt.trim().length > 3 && expected.trim().length > 0 && marks > 0, [prompt, expected, marks]);
  const onFile = (e) => setMediaFile(e.target.files?.[0] || null);

  const submit = async () => {
    if (!valid) return;
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("type", "DESCRIPTIVE");
      fd.append("marks", String(marks));
      fd.append("prompt", prompt);
      fd.append("expectedAnswer", expected);
      if (mediaFile) fd.append("media", mediaFile);

      const res = existing?._id
        ? await axios.patch(`http://localhost:5000/api/v1/exam/questions/${setId}/${existing._id}`, fd, { withCredentials: true })
        : await axios.post(`http://localhost:5000/api/v1/exam/questions/${setId}`, fd, { withCredentials: true });

      if (res.data.success) onSaved(existing ? "Descriptive updated!" : "Descriptive saved!");
    } catch (e) {
      console.error(e);
      onSaved(e?.response?.data?.message || "Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteQ = async () => {
    if (!existing?._id) return onRemove();
    try {
      await axios.delete(`http://localhost:5000/api/v1/exam/questions/${setId}/${existing._id}`, { withCredentials: true });
      onSaved("Question deleted!");
    } catch (e) {
      console.error(e);
      onSaved("Delete failed");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl shadow-sm border p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Descriptive Question</h4>
        <div className="flex gap-2">
          <button onClick={deleteQ} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
            <FiTrash2 /> Delete
          </button>
          <button onClick={onRemove} className="text-sm text-gray-500 hover:text-red-600">
            Remove
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-6 gap-3">
        <div className="md:col-span-1">
          <label className="text-sm text-gray-600">Marks</label>
          <input type="number" min={0.5} step={0.5} value={marks} onChange={(e) => setMarks(parseFloat(e.target.value))} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="md:col-span-5">
          <label className="text-sm text-gray-600">Question Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full border rounded px-3 py-2" rows={2} placeholder="Enter the question text..." />
        </div>
      </div>

      <div className="mt-3">
        <label className="text-sm text-gray-600 block mb-1">Expected Answer</label>
        <textarea value={expected} onChange={(e) => setExpected(e.target.value)} className="w-full border rounded px-3 py-2" rows={2} placeholder="Enter the expected solution..." />
      </div>

      <div className="mt-3">
        <label className="text-sm text-gray-600 block mb-1">Attach image/video (optional)</label>
        <label className="flex items-center gap-2 px-3 py-2 border rounded cursor-pointer w-fit">
          <FiUpload />
          <span>Choose file</span>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
        </label>
        {mediaFile && (
          <div className="mt-1">
            {mediaFile.type.startsWith("image/") ? (
              <img src={URL.createObjectURL(mediaFile)} alt="preview" className="w-40 h-40 object-contain rounded" />
            ) : (
              <video src={URL.createObjectURL(mediaFile)} controls className="w-64 h-40 rounded" />
            )}
            <button onClick={() => setMediaFile(null)} className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FiX /> Remove file
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button onClick={submit} disabled={!valid || submitting} className="px-4 py-2 rounded bg-indigo-600 text-white flex items-center gap-2">
          <FiSave /> {existing ? "Update Question" : "Save Question"}
        </button>
      </div>
    </motion.div>
  );
};
