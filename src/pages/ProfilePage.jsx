import { useAuth } from "../context/AuthContext";
import { FiUser, FiMail, FiLogOut } from "react-icons/fi";

function Profile() {
    const { currentUser, userRole, logout } = useAuth();

    return (
        <div className="flex justify-center px-4 sm:px-6">
            <div className="bg-white shadow-lg rounded-2xl p-6 sm:p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                    My Profile
                </h2>

                {/* User Icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-100 text-blue-600 p-4 rounded-full">
                        <FiUser size={40} />
                    </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 mb-4">
                    <FiMail className="text-slate-500" />
                    <span className="text-slate-700 break-all">
                        {currentUser?.email}
                    </span>
                </div>

                {/* Role */}
                <div className="mb-6">
                    <span className="text-sm text-slate-500">Role:</span>
                    <div className="mt-1 px-3 py-1 inline-block bg-blue-100 text-blue-700 rounded-full text-sm capitalize">
                        {userRole}
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
                >
                    <FiLogOut />
                    Logout
                </button>
            </div>
        </div>
    );
}

export default Profile;
