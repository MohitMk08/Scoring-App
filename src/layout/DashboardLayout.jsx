import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import toast from "react-hot-toast";
import { NavLink, Link, useNavigate } from "react-router-dom";

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    return (
        <div className="flex min-h-screen bg-gray-100">

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl border-r transform transition-transform duration-300
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                sm:translate-x-0 sm:static sm:flex sm:flex-col`}
            >
                {/* Logo */}
                <div className="p-5 border-b flex justify-between items-center bg-linear-to-r from-blue-600 to-blue-500">
                    <Link to="/players">
                        <h2 className="text-xl font-bold text-white tracking-wide">
                            VolleyScorer
                        </h2>
                    </Link>

                    <button
                        className="sm:hidden text-white text-xl"
                        onClick={() => setSidebarOpen(false)}
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col space-y-1 p-3">
                    <NavLink to="/" className={navClass}>Home</NavLink>
                    <NavLink to="/players" className={navClass}>Players</NavLink>
                    <NavLink to="/teams" className={navClass}>Create Team</NavLink>
                    <NavLink to="/teamlistpage" className={navClass}>Team List</NavLink>
                    <NavLink to="/matches/create" className={navClass}>Matches</NavLink>
                    <NavLink to="/match-history" className={navClass}>Match History</NavLink>
                    <NavLink to="/tournaments/create" className={navClass}>Create Tournament</NavLink>
                    <NavLink to="/tournaments" className={navClass}>Tournaments</NavLink>
                </nav>

                {/* Desktop Logout */}
                <div className="hidden sm:block p-4 border-t bg-gray-50">
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition shadow-sm"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">

                {/* Mobile Top Bar */}
                <div className="sm:hidden flex items-center justify-between p-4 bg-white shadow-md">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-2xl font-bold text-blue-600"
                    >
                        ☰
                    </button>

                    <h2 className="text-lg font-bold text-blue-600 tracking-wide">
                        VolleyScorer
                    </h2>

                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition"
                    >
                        Logout
                    </button>
                </div>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-y-auto">
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
