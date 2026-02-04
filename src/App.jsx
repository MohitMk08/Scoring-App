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
import Home from "./pages/Home";
import MatchLivePage from "./pages/matches/MatchLivePage";

function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Home />} />

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
      <Route path="/matches/live/:matchId" element={<MatchLivePage />} />

      {/* ❌ Catch-all → redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
