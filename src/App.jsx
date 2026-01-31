import { Routes, Route, Navigate } from "react-router-dom";
import Players from "./pages/Players";
import Teams from "./pages/Teams";
import TeamListPage from "./pages/TeamListPage";
import MatchesPage from "./pages/MatchesPage";
import MatchHistory from "./pages/MatchHistory";
import TournamentListPage from "./pages/tournaments/TournamentListPage";
import CreateTournament from "./pages/tournaments/CreateTournament"
import TournamentDetailsPage from "./pages/tournaments/TournamentDetailsPage";
import EditTournament from "./pages/EditTournament";
import CreateMatchPage from "./pages/CreateMatchPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/players" />} />

      <Route path="/players" element={<Players />} />
      <Route path="/teams" element={<Teams />} />
      <Route path="/teamlistpage" element={<TeamListPage />} />
      <Route path="/matches" element={<MatchesPage />} />
      <Route path="/match-history" element={<MatchHistory />} />
      <Route path="/tournaments" element={<TournamentListPage />} />
      <Route path="/tournaments/create" element={<CreateTournament />} />
      <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
      <Route path="/tournaments/:id/create-match" element={<CreateMatchPage />} />
      <Route path="/tournaments/:id/edit" element={<EditTournament />} />
      {/* Redirect unknown paths to /players */}
      <Route path="*" element={<Navigate to="/players" />} />
    </Routes>
  );
}

export default App;
