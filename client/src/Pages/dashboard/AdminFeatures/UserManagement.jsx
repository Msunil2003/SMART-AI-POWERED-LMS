import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import HomeLayout from '../../../layouts/HomeLayout';
import { getAllUsers, toggleBanUser } from '../../../Redux/slices/userSlice';

const UserManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, loading } = useSelector((state) => state.user);

  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banMessage, setBanMessage] = useState('');

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  const refreshUsers = async () => {
    try {
      await dispatch(getAllUsers()).unwrap();
    } catch (error) {
      toast.error("Error refreshing user data.");
    }
  };

  const handleRestrictClick = (user) => {
    setSelectedUser(user);
    setBanReason('');
    setBanMessage('');
    setShowBanModal(true);
  };

  const handleBanSubmit = async () => {
    if (!banReason || !banMessage) {
      toast.warning("Please fill both reason and message.");
      return;
    }

    try {
      const res = await dispatch(toggleBanUser({
        userId: selectedUser._id,
        banReason,
        banMessage
      })).unwrap();

      if (res?.message) {
        toast.success(res.message);
        setShowBanModal(false);
        setSelectedUser(null);
        await refreshUsers();
      } else {
        toast.error("Restriction failed. Try again.");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    }
  };

  const handleRevokeClick = async (userId) => {
    try {
      const res = await dispatch(toggleBanUser({ userId })).unwrap();

      if (res?.message) {
        toast.success(res.message);
        await refreshUsers();
      } else {
        toast.error("Failed to revoke restriction.");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    }
  };

  return (
    <HomeLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-slate-500 mb-6 text-center">User Management</h1>

        {loading ? (
          <p className="text-center text-lg font-semibold text-gray-500">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-center">
              <thead>
                <tr className="text-white text-lg bg-gray-700">
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  ?.filter((user) => user.role?.toLowerCase().trim() !== 'admin') // ✅ Handles "ADMIN", " Admin ", etc.
                  .map((user, idx) => (
                    <tr key={user._id} className="hover:bg-base-300">
                      <td>{idx + 1}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td className={`font-semibold ${user.isBanned ? 'text-red-500' : 'text-green-600'}`}>
                        {user.isBanned ? 'Restricted' : 'Active'}
                      </td>
                      <td className="flex gap-2 justify-center">
                        <button
                          onClick={() => navigate(`/admin/users/${user._id}`)}
                          className="btn btn-sm btn-info"
                        >
                          View
                        </button>
                        {user.isBanned ? (
                          <button
                            onClick={() => handleRevokeClick(user._id)}
                            className="btn btn-sm btn-success"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestrictClick(user)}
                            className="btn btn-sm btn-error"
                          >
                            Restrict
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Restrict Modal */}
        {showBanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg w-[90%] max-w-lg">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Restrict User</h2>
              <p className="mb-2 font-medium text-gray-700">Name: {selectedUser?.name}</p>
              <p className="mb-4 font-medium text-gray-700">Email: {selectedUser?.email}</p>

              <label className="block mb-2 font-medium">Reason</label>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-4"
              />

              <label className="block mb-2 font-medium">Message</label>
              <textarea
                value={banMessage}
                onChange={(e) => setBanMessage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-4"
              />

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowBanModal(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanSubmit}
                  className="btn btn-error btn-sm"
                >
                  Confirm Restriction
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HomeLayout>
  );
};

export default UserManagement;
