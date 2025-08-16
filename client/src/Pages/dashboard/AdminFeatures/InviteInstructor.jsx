/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useState } from "react";
import { toast } from "react-toastify";

const InviteInstructor = () => {
  const [inviteMode, setInviteMode] = useState("single"); // "single" or "bulk"
  const [email, setEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    try {
      setLoading(true);

      let emailList = [];

      if (inviteMode === "single") {
        if (!email.trim()) {
          toast.error("Please enter an email address.");
          setLoading(false);
          return;
        }
        emailList = [email.trim()];
      } else {
        if (!bulkEmails.trim()) {
          toast.error("Please enter at least one email.");
          setLoading(false);
          return;
        }
        emailList = bulkEmails
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e.length > 0);
      }
await axios.post(
  `${import.meta.env.VITE_BASE_URL}/user/invite-instructor`,
  { emails: emailList },
  { withCredentials: true }
);


      toast.success(
        `Invitation sent to ${emailList.length} instructor${
          emailList.length > 1 ? "s" : ""
        }.`
      );
      setEmail("");
      setBulkEmails("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send invites.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Invite Instructor</h2>

      {/* Mode Toggle */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setInviteMode("single")}
          className={`px-4 py-2 rounded ${
            inviteMode === "single"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Single Invite
        </button>
        <button
          onClick={() => setInviteMode("bulk")}
          className={`px-4 py-2 rounded ${
            inviteMode === "bulk"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Bulk Invite
        </button>
      </div>

      {/* Input Fields */}
      {inviteMode === "single" ? (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Instructor Email
          </label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="instructor@example.com"
          />
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Instructor Emails (comma-separated)
          </label>
          <textarea
            className="w-full border rounded px-3 py-2 h-28"
            value={bulkEmails}
            onChange={(e) => setBulkEmails(e.target.value)}
            placeholder="instructor1@example.com, instructor2@example.com"
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleInvite}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Invitation"}
      </button>
    </div>
  );
};

export default InviteInstructor;
