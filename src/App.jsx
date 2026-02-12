import { Routes, Route, useLocation } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Players from "./pages/Players";
import Teams from "./pages/Teams";
import TeamListPage from "./pages/TeamListPage";
import MatchesPage from "./pages/MatchesPage";
import MatchHistory from "./pages/MatchHistory";
import TournamentListPage from "./pages/tournaments/TournamentListPage";
import CreateTournament from "./pages/tournaments/CreateTournament";
import TournamentDetailsPage from "./pages/tournaments/TournamentDetailsPage";
import CreateMatchPage from "./pages/CreateMatchPage";
import EditTournament from "./pages/EditTournament";
import MatchLivePage from "./pages/matches/MatchLivePage";

import { Toaster } from "react-hot-toast";

function App() {
  const location = useLocation();

  const hideLayout =
    location.pathname.toLowerCase() === "/login" ||
    location.pathname.toLowerCase() === "/register";

  return (
    <>
      {hideLayout ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      ) : (
        <DashboardLayout>
          <Routes>

            {/* ✅ HOME – All Logged In Users */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={["admin", "captain", "player"]}>
                  <Home />
                </ProtectedRoute>
              }
            />

            {/* ✅ PLAYER REGISTRATION – All Users */}
            <Route
              path="/players"
              element={
                <ProtectedRoute allowedRoles={["admin", "captain", "player"]}>
                  <Players />
                </ProtectedRoute>
              }
            />

            {/* ✅ TEAM MANAGEMENT – Admin + Captain */}
            <Route
              path="/teams"
              element={
                <ProtectedRoute allowedRoles={["admin", "captain"]}>
                  <Teams />
                </ProtectedRoute>
              }
            />

            <Route
              path="/teamlistpage"
              element={
                <ProtectedRoute allowedRoles={["admin", "captain"]}>
                  <TeamListPage />
                </ProtectedRoute>
              }
            />

            {/* ✅ MATCH CREATION – Admin + Captain */}
            <Route
              path="/matches/create"
              element={
                <ProtectedRoute allowedRoles={["admin", "captain"]}>
                  <MatchesPage />
                </ProtectedRoute>
              }
            />

            {/* ✅ MATCH HISTORY – All Logged In */}
            <Route
              path="/match-history"
              element={
                <ProtectedRoute allowedRoles={["admin", "captain", "player"]}>
                  <MatchHistory />
                </ProtectedRoute>
              }
            />

            {/* ✅ TOURNAMENT LIST – All Logged In */}
            <Route
              path="/tournaments"
              element={
                <ProtectedRoute allowedRoles={["admin", "captain", "player"]}>
                  <TournamentListPage />
                </ProtectedRoute>
              }
            />

            {/* ✅ CREATE TOURNAMENT – Admin + Captain */}
            <Route
              path="/tournaments/create"
              element={
                <ProtectedRoute allowedRoles={["admin", "captain"]}>
                  <CreateTournament />
                </ProtectedRoute>
              }
            />

            {/* ✅ TOURNAMENT DETAILS – All Logged In */}
            <Route
              path="/tournaments/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "captain", "player"]}>
                  <TournamentDetailsPage />
                </ProtectedRoute>
              }
            />

            {/* ✅ CREATE MATCH INSIDE TOURNAMENT – Admin + Captain */}
            <Route
              path="/tournaments/:id/create-match"
              element={
                <ProtectedRoute allowedRoles={["admin", "captain"]}>
                  <CreateMatchPage />
                </ProtectedRoute>
              }
            />

            {/* ✅ EDIT TOURNAMENT – ADMIN ONLY */}
            <Route
              path="/tournaments/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <EditTournament />
                </ProtectedRoute>
              }
            />

            {/* ✅ LIVE SCORING – Admin + Captain */}
            <Route
              path="/matches/live/:matchId"
              element={
                <ProtectedRoute allowedRoles={["admin", "captain"]}>
                  <MatchLivePage />
                </ProtectedRoute>
              }
            />

          </Routes>
        </DashboardLayout>
      )}

      <Toaster position="top-right" />
    </>
  );
}

export default App;
