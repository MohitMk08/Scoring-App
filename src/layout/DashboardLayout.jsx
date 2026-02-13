import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import toast from "react-hot-toast";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import { FaTimes } from "react-icons/fa";
import { FaAlignJustify } from "react-icons/fa";
import logo from "../assets/volleylogo-dark.png";

export default function DashboardLayout({ children, currentUser, role }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success("Logged out successfully");
            navigate("/Login");
        } catch (error) {
            toast.error("Logout failed");
        }
    };

    const closeSidebar = () => setSidebarOpen(false);
    const closeProfile = () => setProfileOpen(false);

    return (
        <div className="flex min-h-screen bg-gray-100 overflow-hidden">

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl border-r transform transition-transform duration-300
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                sm:translate-x-0 sm:static sm:flex sm:flex-col`}
            >
                {/* Logo */}
                <div className="border-b flex justify-between items-center p-4">
                    <Link to="/" onClick={closeSidebar}>
                        <img src={logo} alt="App Logo" className="h-20 w-auto" />
                    </Link>
                    <button
                        className="sm:hidden text-red-600 text-xxl"
                        onClick={closeSidebar}
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col space-y-1 p-3">
                    <NavLink to="/" className={navClass} onClick={closeSidebar}>Home</NavLink>
                    <NavLink to="/players" className={navClass} onClick={closeSidebar}>Players</NavLink>
                    <NavLink to="/teams" className={navClass} onClick={closeSidebar}>Create Team</NavLink>
                    <NavLink to="/teamlistpage" className={navClass} onClick={closeSidebar}>Team List</NavLink>
                    <NavLink to="/matches/create" className={navClass} onClick={closeSidebar}>Matches</NavLink>
                    <NavLink to="/match-history" className={navClass} onClick={closeSidebar}>Match History</NavLink>
                    <NavLink to="/tournaments/create" className={navClass} onClick={closeSidebar}>Create Tournament</NavLink>
                    <NavLink to="/tournaments" className={navClass} onClick={closeSidebar}>Tournaments</NavLink>
                </nav>

            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-4 sm:p-6">

                {/* Top Bar (mobile + desktop) */}
                <div className="flex items-center justify-between p-4 bg-white shadow-md sm:shadow-none">
                    {/* Hamburger for mobile */}
                    <button
                        className="sm:hidden text-2xl font-bold text-blue-600"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <FaAlignJustify />
                    </button>

                    <h2 className="text-lg font-bold text-blue-600 tracking-wide truncate">
                        VolleyScorer
                    </h2>

                    {/* Profile dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-2 bg-gray-200 px-3 py-1 rounded-full hover:bg-gray-300 transition"
                        >
                            <FiUser />
                            <span className="hidden sm:block text-sm">
                                {currentUser?.displayName || currentUser?.email?.split("@")[0]}
                            </span>
                        </button>

                        {profileOpen && (
                            <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-64 bg-white shadow-lg rounded-lg p-3 z-50">
                                <p className="text-sm font-semibold truncate">
                                    {currentUser?.displayName || currentUser?.email}
                                </p>
                                <p className="text-xs text-gray-500 mb-2">Role: {role || "Player"}</p>

                                <button
                                    onClick={() => {
                                        closeProfile();
                                        navigate("/profile");
                                    }}
                                    className="block w-full text-left text-sm py-1 hover:text-blue-600"
                                >
                                    My Profile
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left text-sm py-1 text-red-500 hover:text-red-700"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 min-w-0 py-6 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

const navClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg transition-all duration-200 font-medium ${isActive
        ? "bg-blue-600 text-white shadow"
        : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
    }`;
