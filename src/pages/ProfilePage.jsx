import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiUser, FiMail, FiLogOut, FiCamera, FiX } from "react-icons/fi";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { storage } from "../firebase";

function Profile() {
    const navigate = useNavigate();
    const { currentUser, role, loading, logout } = useAuth();
    const [uploading, setUploading] = useState(false);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        try {
            setUploading(true);

            const imageRef = ref(storage, `profilePictures/${currentUser.uid}`);
            await uploadBytes(imageRef, file);

            const photoURL = await getDownloadURL(imageRef);

            await updateProfile(currentUser, { photoURL });

            // Force re-render without full reload
            window.location.reload();
        } catch (error) {
            console.error("Image upload error:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex justify-center items-center px-4 py-8">
            <div className="bg-white shadow-lg rounded-2xl p-6 sm:p-8 w-full max-w-md relative">

                {/* Close Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-black"
                >
                    <FiX size={20} />
                </button>

                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                    My Profile
                </h2>

                {/* Profile Picture */}
                <div className="flex justify-center mb-6 relative">
                    <div className="relative">
                        {currentUser?.photoURL ? (
                            <img
                                src={currentUser.photoURL}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border"
                            />
                        ) : (
                            <div className="bg-blue-100 text-blue-600 p-6 rounded-full">
                                <FiUser size={40} />
                            </div>
                        )}

                        <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer">
                            <FiCamera size={14} />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
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
                        {loading ? "Loading..." : role || "Player"}
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

                {uploading && (
                    <p className="text-center text-sm text-gray-500 mt-3">
                        Uploading...
                    </p>
                )}
            </div>
        </div>
    );
}

export default Profile;
