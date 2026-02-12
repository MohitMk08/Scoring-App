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
    location.pathname === "/Login" ||
    location.pathname === "/register";

  return (
    <>
      {hideLayout ? (
        <Routes>
          <Route path="/Login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      ) : (
        <ProtectedRoute>
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/players" element={<Players />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teamlistpage" element={<TeamListPage />} />
              <Route path="/matches/create" element={<MatchesPage />} />
              <Route path="/match-history" element={<MatchHistory />} />
              <Route path="/tournaments" element={<TournamentListPage />} />
              <Route path="/tournaments/create" element={<CreateTournament />} />
              <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
              <Route path="/tournaments/:id/create-match" element={<CreateMatchPage />} />
              <Route path="/tournaments/:id/edit" element={<EditTournament />} />
              <Route path="/matches/live/:matchId" element={<MatchLivePage />} />
            </Routes>
          </DashboardLayout>
        </ProtectedRoute>
      )}

      <Toaster position="top-right" />
    </>
  );
}

export default App;
