/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiEdit,
  FiList,
  FiPlus,
  FiRefreshCcw,
  FiUserCheck,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

// ------------------ API Endpoints ------------------
const API = {
  myCourses: "http://localhost:5000/api/v1/exam/instructor/my-courses",
  courseSets: (courseId) => `http://localhost:5000/api/v1/exam/course/${courseId}/sets`,
  createSet: "http://localhost:5000/api/v1/exam/sets",
  markReady: (setId) => `http://localhost:5000/api/v1/exam/sets/${setId}/ready`,
  assignedStudents: (setId) => `http://localhost:5000/api/v1/exam/sets/${setId}/assignments`,
  enrolledWithApproved: (courseId) =>
    `http://localhost:5000/api/v1/exam/course/${courseId}/enrolled-with-approved`,
  assignSelected: (setId) => `http://localhost:5000/api/v1/exam/sets/${setId}/assign`,
  assignRandom: (setId) => `http://localhost:5000/api/v1/exam/sets/${setId}/assign-random`,
};

export default function InstructorExamConfig() {
  const navigate = useNavigate();

  // ------------------ Courses ------------------
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // ------------------ Sets ------------------
  const [sets, setSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [assignedCounts, setAssignedCounts] = useState(new Map());
  const [enrolledCount, setEnrolledCount] = useState(0);

  // ------------------ Create Set Form ------------------
  const [setLabel, setSetLabel] = useState("");
  const [examName, setExamName] = useState("");
  const [examTypes, setExamTypes] = useState({ mcq: true, descriptive: false });
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [busyCreate, setBusyCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const labels = useMemo(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), []);

  // ------------------ Assign Modal ------------------
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningSet, setAssigningSet] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [busyAssign, setBusyAssign] = useState(false);

  // ------------------ Banner ------------------
  const [banner, setBanner] = useState(null); // { type, message }
  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [banner]);

  // ------------------ Fetch Courses ------------------
  useEffect(() => {
    (async function fetchCourses() {
      try {
        setLoadingCourses(true);
        const res = await axios.get(API.myCourses, { withCredentials: true });
        setCourses(res?.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setBanner({ type: "error", message: "Failed to load your courses." });
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, []);

  // ------------------ Load Sets + Enrolled ------------------
  useEffect(() => {
    if (!selectedCourse) {
      setSets([]);
      setAssignedCounts(new Map());
      setEnrolledCount(0);
      return;
    }
    loadSetsForCourse(selectedCourse._id);
    loadEnrolledStudents(selectedCourse._id);
  }, [selectedCourse]);

  async function loadSetsForCourse(courseId) {
    try {
      setLoadingSets(true);
      const res = await axios.get(API.courseSets(courseId), { withCredentials: true });
      const list = res?.data?.data || [];
      setSets(list);

      const counts = await Promise.all(
        list.map(async (s) => {
          try {
            const ar = await axios.get(API.assignedStudents(s._id), { withCredentials: true });
            return [s._id, (ar?.data?.data || []).length];
          } catch {
            return [s._id, 0];
          }
        })
      );
      setAssignedCounts(new Map(counts));
    } catch (err) {
      console.error("Failed to load sets:", err);
      setBanner({ type: "error", message: "Failed to load exam sets." });
    } finally {
      setLoadingSets(false);
    }
  }

  async function loadEnrolledStudents(courseId) {
    try {
      const res = await axios.get(API.enrolledWithApproved(courseId), { withCredentials: true });
      const studentsArr = res?.data?.data || [];
      setEnrolledCount(studentsArr.length);
    } catch (err) {
      console.error("Failed to load enrolled students:", err);
      setEnrolledCount(0);
      setBanner({ type: "error", message: "Failed to load enrolled students." });
    }
  }

  // ------------------ Create Set ------------------
  function resetCreateForm() {
    setSetLabel("");
    setExamName("");
    setExamTypes({ mcq: true, descriptive: false });
    setStartAt("");
    setEndAt("");
    setDurationMinutes(60);
    setCreateError("");
  }

  async function handleCreateSet(e) {
    e.preventDefault();
    setCreateError("");
    if (!selectedCourse) return setCreateError("Select a course first.");
    if (!setLabel || !examName || (!examTypes.mcq && !examTypes.descriptive)) {
      return setCreateError("Please provide label, name and at least one type.");
    }
    try {
      setBusyCreate(true);
      const payload = {
        courseId: selectedCourse._id,
        setLabel,
        name: examName,
        types: [
          ...(examTypes.mcq ? ["MCQ"] : []),
          ...(examTypes.descriptive ? ["DESCRIPTIVE"] : []),
        ],
        startAt,
        endAt,
        durationMinutes,
        isReady: false,
      };
      const res = await axios.post(API.createSet, payload, { withCredentials: true });
      if (res?.data?.success) {
        setBanner({ type: "success", message: "Set created." });
        resetCreateForm();
        await loadSetsForCourse(selectedCourse._id);
      } else {
        setCreateError(res?.data?.message || "Failed to create set.");
      }
    } catch (err) {
      console.error("Create set error:", err);
      setCreateError("Server error creating set.");
    } finally {
      setBusyCreate(false);
    }
  }

  // ------------------ Assign Modal Logic ------------------
  async function openAssignModal(setObj) {
  if (!selectedCourse) return;
  setAssigningSet(setObj);
  setSelectedStudents(new Set());

  try {
    const enrolledRes = await axios.get(
      API.enrolledWithApproved(selectedCourse._id),
      { withCredentials: true }
    );
    const enrolledArr = enrolledRes?.data?.data || [];

    const assignedRes = await axios.get(
      API.assignedStudents(setObj._id),
      { withCredentials: true }
    );
    const assignedArr = assignedRes?.data?.data || [];

    const currentSetIds = new Set(
      assignedArr.map((a) => String(a.studentId || a._id || a))
    );

    const merged = enrolledArr.map((s) => {
      const assignedData = assignedArr.find(
        (a) => String(a.studentId) === String(s.id || s.studentId)
      );

      const isCurrentSet = s.assignedSetLabels?.includes(setObj.setLabel);
      const assignedInOtherSet = s.assignedInOtherSet && !isCurrentSet;

      return {
        _id: s.id || s.studentId || Math.random().toString(36).substr(2, 9),
        name: s.name || s.studentName,
        email: s.email || s.studentEmail,
        approved: s.approved ?? true,
        assigned: currentSetIds.has(s.id || s.studentId),
        currentSet: isCurrentSet,
        assignedInOtherSet,
        assignedSetLabels: s.assignedSetLabels || [],
        enrolledAt: s.enrolledAt,
        examCode: assignedData?.examCode || s.examCode,
        setLabel: assignedData?.setLabel || setObj.setLabel, // <-- ADD THIS LINE
      };
    });

    setStudents(merged);
    setAssignedCounts((prev) => new Map(prev).set(setObj._id, currentSetIds.size));
  } catch (err) {
    console.error("openAssignModal error:", err);
    setStudents([]);
    setBanner({ type: "error", message: "Failed to load students for assignment." });
  }

  setShowAssignModal(true);
}

  function toggleSelectStudent(id) {
    const st = students.find((s) => String(s._id) === id);
    if (!st || !st.approved || st.assigned || st.assignedInOtherSet) return; // <-- block others
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ------------------ Assignment Functions ------------------
  async function assignToSelected() {
    if (!assigningSet) return;
    if (selectedStudents.size === 0) {
      setBanner({ type: "info", message: "Select at least one student to assign." });
      return;
    }
    try {
      setBusyAssign(true);
      setBanner({ type: "info", message: "Assigning students..." });
      const payload = { studentIds: Array.from(selectedStudents).map((id) => id.toString()) };
      const res = await axios.post(
        `http://localhost:5000/api/v1/exam/sets/${assigningSet._id}/assigned`,
        payload,
        { withCredentials: true }
      );
      if (res?.data?.success) {
        const assignedStudentIds = res.data.data.map((a) => String(a.student));
        setStudents((prev) =>
          prev.map((s) =>
            assignedStudentIds.includes(String(s._id)) ? { ...s, assigned: true } : s
          )
        );
        setAssignedCounts((m) => {
          const copy = new Map(m);
          const prevCount = copy.get(assigningSet._id) || 0;
          copy.set(assigningSet._id, prevCount + assignedStudentIds.length);
          return copy;
        });
        setSelectedStudents(new Set());
        setBanner({ type: "success", message: "Students assigned successfully!" });
      } else {
        setBanner({ type: "error", message: res?.data?.message || "Assignment failed." });
      }
    } catch (err) {
      console.error("assignToSelected error:", err);
      setBanner({ type: "error", message: "Server error while assigning students." });
    } finally {
      setBusyAssign(false);
    }
  }

  async function assignRandomToAll() {
    if (!assigningSet) return;
    try {
      setBusyAssign(true);
      const res = await axios.post(API.assignRandom(assigningSet._id), {}, { withCredentials: true });
      if (res?.data?.success) {
        const assignedRes = await axios.get(API.assignedStudents(assigningSet._id), {
          withCredentials: true,
        });
        const assignedArr = assignedRes?.data?.data || [];
        const assignedSet = new Set(assignedArr.map((a) => String(a._id || a)));
        setStudents((prev) =>
          prev.map((s) => ({ ...s, assigned: assignedSet.has(String(s._id)) }))
        );
        setAssignedCounts((m) => new Map(m).set(assigningSet._id, assignedSet.size));
        setSelectedStudents(new Set());
        setBanner({ type: "success", message: "Random assignment completed." });
      } else {
        setBanner({ type: "error", message: res?.data?.message || "Random assign failed." });
      }
    } catch (err) {
      console.error("assignRandomToAll error:", err);
      setBanner({ type: "error", message: "Server error while random assigning." });
    } finally {
      setBusyAssign(false);
    }
  }

  async function markSetReady(setId) {
    try {
      await axios.patch(API.markReady(setId), {}, { withCredentials: true });
      await loadSetsForCourse(selectedCourse._id);
      setBanner({ type: "success", message: "Set marked as READY." });
    } catch (err) {
      console.error("markSetReady error:", err);
      setBanner({ type: "error", message: "Failed to mark set ready." });
    }
  }

  // ------------------ Banner UI ------------------
  function Banner({ type = "info", message }) {
    if (!message) return null;
    const color =
      type === "success"
        ? "bg-green-50 text-green-700 border-green-200"
        : type === "error"
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-blue-50 text-blue-700 border-blue-200";
    return (
      <div className={`border rounded-lg px-4 py-3 ${color} flex items-start gap-2`}>
        <FiCheckCircle className="mt-0.5" />
        <div className="text-sm">{message}</div>
      </div>
    );
  }

  // ------------------ Render ------------------
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.h1
        className="text-3xl font-bold mb-4 tracking-tight"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Exam Configuration — Dashboard
      </motion.h1>
      {banner?.message && (
        <div className="mb-4">
          <Banner type={banner.type} message={banner.message} />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses Panel */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border p-4 lg:col-span-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Your Courses</h2>
            <span className="text-sm text-gray-500">
              {loadingCourses ? "Loading..." : courses.length}
            </span>
          </div>
          <ul className="space-y-2">
            {loadingCourses ? (
              <>
                <li className="h-10 bg-gray-100 animate-pulse rounded" />
                <li className="h-10 bg-gray-100 animate-pulse rounded" />
              </>
            ) : courses.length === 0 ? (
              <div className="text-sm text-gray-500">No courses yet</div>
            ) : (
              courses.map((c) => (
                <li
                  key={String(c._id || c.id)}
                  onClick={() => setSelectedCourse(c)}
                  className={`cursor-pointer p-3 rounded-xl border transition ${
                    selectedCourse?._id === c._id ? "bg-indigo-50 border-indigo-200" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-gray-500">
                        Created by {c.createdBy?.name || "You"}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{String(c._id || c.id).slice(-4)}</div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </motion.div>

        {/* Create Set + Sets List */}
        <motion.div className="space-y-6 lg:col-span-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Create Set Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500">Selected Course</div>
                <div className="text-xl font-semibold">{selectedCourse ? selectedCourse.title : "Choose a course"}</div>
                {selectedCourse && <div className="text-xs text-gray-400 mt-1">Course ID: {selectedCourse._id}</div>}
              </div>
              <button
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700"
                onClick={() => selectedCourse && loadSetsForCourse(selectedCourse._id)}
              >
                <FiRefreshCcw className="text-sm" /> Refresh
              </button>
            </div>
            <form onSubmit={handleCreateSet} className="space-y-4">
              {createError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {createError}
                </div>
              )}
              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Set Label</label>
                  <select
                    value={setLabel}
                    onChange={(e) => setSetLabel(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Pick a label</option>
                    {labels.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">Exam Name</label>
                  <input
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g. Midterm - Set A"
                  />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={examTypes.mcq} onChange={() => setExamTypes((s) => ({ ...s, mcq: !s.mcq }))} /> MCQ
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={examTypes.descriptive} onChange={() => setExamTypes((s) => ({ ...s, descriptive: !s.descriptive }))} /> Descriptive
                </label>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start (local)</label>
                  <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End (local)</label>
                  <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (mins)</label>
                  <input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={resetCreateForm} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Reset</button>
                <button
                  disabled={!selectedCourse || busyCreate}
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60"
                >
                  <FiPlus /> {busyCreate ? "Creating..." : "Create Set"}
                </button>
              </div>
            </form>
          </div>

          {/* Sets List */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Sets for this course</h3>
              <div className="text-sm text-gray-500">
                Enrolled: <span className="font-medium">{enrolledCount}</span>
              </div>
            </div>

            {loadingSets ? (
              <div className="space-y-2">
                <div className="h-16 bg-gray-100 animate-pulse rounded-xl" />
                <div className="h-16 bg-gray-100 animate-pulse rounded-xl" />
              </div>
            ) : sets.length === 0 ? (
              <div className="text-sm text-gray-500">No sets created yet</div>
            ) : (
              <ul className="space-y-3">
                {sets.map((s) => {
                  const isReady = !!s.isReady;
                  const count = assignedCounts.get(s._id) || 0;
                  return (
                    <li
                      key={String(s._id || s.setLabel)}
                      className="p-4 border rounded-xl flex items-center justify-between hover:shadow-sm transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-medium truncate">{s.name || `Set ${s.setLabel}`}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isReady ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {isReady ? "READY" : "DRAFT"}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Set {s.setLabel}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">Assigned {count}/{enrolledCount}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Types: {(s.types || []).join(", ") || "—"} • Duration: {s.durationMinutes || 0} mins</div>
                        {s.startAt && s.endAt && (
                          <div className="text-xs text-gray-400 mt-1">{new Date(s.startAt).toLocaleString()} → {new Date(s.endAt).toLocaleString()}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!isReady ? (
                          <>
                            <button onClick={() => navigate(`/instructor/dashboard/exams/${s._id}/builder`)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                              <FiList /> Complete Questions
                            </button>
                            <button onClick={() => markSetReady(s._id)} className="px-3 py-2 border rounded-lg hover:bg-gray-50">Mark Ready</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => navigate(`/instructor/dashboard/exams/${s._id}/builder`)} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                              <FiEdit /> Edit Questions
                            </button>
                            <button onClick={() => openAssignModal(s)} className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200">
                              <FiUserCheck /> Assign
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.div>
      </div>

   {/* Assign Modal */}
<AnimatePresence>
  {showAssignModal && assigningSet && (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 18, opacity: 0 }}
        className="relative bg-white w-11/12 md:w-2/3 lg:w-1/2 rounded-2xl shadow-xl border flex flex-col max-h-[85vh]"
      >
        {/* header */}
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <div className="text-base text-gray-500">Assign Exam</div>
            <h4 className="text-lg font-semibold">
              {assigningSet.name || `Set ${assigningSet.setLabel}`} — Set {assigningSet.setLabel}
            </h4>
          </div>
          <div className="text-xs text-gray-500">
            Selected: <span className="font-semibold">{selectedStudents.size}</span>
          </div>
        </div>

        {/* body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={assignRandomToAll}
              disabled={busyAssign}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              Assign Random to All
            </button>
          </div>
          <div className="border rounded-xl max-h-72 overflow-y-auto p-3 relative">
            {students.length === 0 ? (
              <div className="text-sm text-gray-500">No students enrolled</div>
            ) : (
              <ul className="space-y-2">
  {students.map((st) => {
    const isSelected = selectedStudents.has(st._id);
    const rowClasses = st.assigned
      ? "bg-green-50 text-green-700 opacity-90 cursor-not-allowed pointer-events-none"
      : st.assignedInOtherSet
      ? "bg-amber-50 text-amber-700 opacity-90 cursor-not-allowed pointer-events-none"
      : isSelected
      ? "bg-indigo-50"
      : "hover:bg-gray-50";

    return (
      <li
        key={String(st._id)}
        className={`relative flex items-center justify-between p-3 rounded-lg transition ${rowClasses}`}
      >
        <div className="min-w-0">
          <div className="font-medium truncate">{st.name}</div>
          <div className="text-xs text-gray-500 truncate">{st.email}</div>
          {st.enrolledAt && (
            <div className="text-xs text-gray-400 truncate">
              Enrolled: {new Date(st.enrolledAt).toLocaleString()}
            </div>
          )}
          {st.examCode && (
            <div className="text-xs text-gray-400 truncate">
              Exam Code: {st.examCode}
            </div>
          )}
          {st.assignedInOtherSet && (
            <div className="text-xs text-amber-600 truncate">
              Already assigned in Set {st.assignedSetLabels.join(", ")}
            </div>
          )}
          {!st.approved && !st.assignedInOtherSet && (
            <div className="text-xs text-amber-600 truncate">
              Exam request is pending
            </div>
          )}
        </div>

        {st.assigned ? (
          <span className="text-xs font-medium px-2 py-1 bg-green-200 text-green-800 rounded">
            Assigned
          </span>
        ) : st.assignedInOtherSet ? (
          <span className="text-xs font-medium px-2 py-1 bg-amber-200 text-amber-800 rounded">
            Blocked
          </span>
        ) : (
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={isSelected}
            onChange={() => toggleSelectStudent(st._id)}
            disabled={!st.approved}
          />
        )}
      </li>
    );
  })}
</ul>

            )}
          </div>
        </div>

        {/* footer */}
        <div className="p-5 border-t flex justify-end gap-3">
          <button
            onClick={() => {
              setShowAssignModal(false);
              setAssigningSet(null);
              setSelectedStudents(new Set());
            }}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={assignToSelected}
            disabled={busyAssign || selectedStudents.size === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
          >
            {busyAssign ? "Assigning..." : "Assign to Selected"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

    </div>
  );
}
