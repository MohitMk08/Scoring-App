import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, role, loading } = useAuth();

    // ⏳ Wait until Firebase check completes
    if (loading) {
        return null; // you can replace with spinner if needed
    }

    // ❌ Not logged in
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // ✅ If no role restriction
    if (!allowedRoles) {
        return children;
    }

    // ❌ Role not allowed
    if (!allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
