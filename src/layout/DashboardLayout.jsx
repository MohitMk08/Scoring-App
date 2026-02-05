import { useState } from "react";
import { NavLink, Link } from "react-router-dom";

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-md transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0`}
            >
                {/* Sidebar header */}
                <div className="p-4 flex justify-between items-center border-b">
                    <Link to="/">
                        {/* <img src={logo} className="App-logo" alt="logo" /> */}
                        <h2 className="text-lg font-bold text-blue-600">VolleyScorer</h2>
                    </Link>

                    <button
                        className="sm:hidden text-xl"
                        onClick={() => setSidebarOpen(false)}
                    >
                        ✕
                    </button>
                </div>

                {/* Sidebar links */}
                <nav className="flex flex-col mt-4 space-y-2">
                    <NavLink
                        to="/players"
                        className={({ isActive }) =>
                            `px-4 py-2 rounded ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50"
                            }`
                        }
                    >
                        Players
                    </NavLink>
                    <NavLink
                        to="/teams"
                        className={({ isActive }) =>
                            `px-4 py-2 rounded ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50"
                            }`
                        }
                    >
                        Create Team
                    </NavLink>
                    <NavLink
                        to="/teamlistpage"
                        className={({ isActive }) =>
                            `px-4 py-2 rounded ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50"
                            }`
                        }
                    >
                        Team List
                    </NavLink>
                    <NavLink
                        to="/matches/create"
                        className={({ isActive }) =>
                            `px-4 py-2 rounded ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50"
                            }`
                        }
                    >
                        Matches
                    </NavLink>
                    <NavLink
                        to="/match-history"
                        className={({ isActive }) =>
                            `block px-4 py-2 rounded ${isActive
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 hover:bg-blue-50"
                            }`
                        }
                    >
                        Match History
                    </NavLink>
                    <NavLink
                        to="/tournaments/create"
                        className={({ isActive }) =>
                            `block px-4 py-2 rounded ${isActive
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 hover:bg-blue-50"
                            }`
                        }
                    >
                        Create Tournament
                    </NavLink>
                    <NavLink
                        to="/tournaments"
                        className={({ isActive }) =>
                            `block px-4 py-2 rounded ${isActive
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 hover:bg-blue-50"
                            }`
                        }
                    >
                        Tournaments
                    </NavLink>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col sm:ml-64 min-w-0">
                {/* Mobile top bar */}
                <div className="sm:hidden p-4 bg-white shadow-md flex justify-between items-center">
                    <button
                        className="text-xl font-bold"
                        onClick={() => setSidebarOpen(true)}
                    >
                        ☰
                    </button>
                    <h2 className="font-bold text-blue-600">VolleyScorer</h2>
                </div>

                {/* Page content */}
                <main className="p-4 min-w-0">{children}</main>
            </div>
        </div>
    );
}
