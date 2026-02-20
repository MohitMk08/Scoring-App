import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    collection,
    doc,
    getDoc,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";

const CreateMatchPage = () => {
    const { id: tournamentId } = useParams();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState(null);
    const [teams, setTeams] = useState([]);
    const [teamA, setTeamA] = useState("");
    const [teamB, setTeamB] = useState("");
    const [loading, setLoading] = useState(true);

    // 🔹 Load tournament & teams
    useEffect(() => {
        const loadData = async () => {
            try {
                const tourRef = doc(db, "tournaments", tournamentId);
                const tourSnap = await getDoc(tourRef);

                if (tourSnap.exists()) {
                    const tourData = tourSnap.data();
                    setTournament(tourData);

                    const teamPromises = tourData.teams.map((teamId) =>
                        getDoc(doc(db, "teams", teamId))
                    );

                    const teamSnaps = await Promise.all(teamPromises);

                    const teamList = teamSnaps
                        .filter((t) => t.exists())
                        .map((t) => ({
                            id: t.id,
                            ...t.data(),   // ⚠️ make sure team doc contains logo field
                        }));

                    setTeams(teamList);
                }
            } catch (err) {
                toast.error("Failed to load tournament data");
            }

            setLoading(false);
        };

        loadData();
    }, [tournamentId]);

    // 🔹 Create match
    const handleCreateMatch = async () => {
        if (!teamA || !teamB) {
            toast.error("Please select both teams");
            return;
        }

        if (teamA === teamB) {
            toast.error("Team A and Team B cannot be the same");
            return;
        }

        const teamAObj = teams.find((t) => t.id === teamA);
        const teamBObj = teams.find((t) => t.id === teamB);

        if (!teamAObj || !teamBObj) {
            toast.error("Invalid team selection");
            return;
        }

        toast.loading("Creating match...", { id: "create-match" });

        try {
            await addDoc(collection(db, "matches"), {
                type: tournamentId ? "tournament" : "individual",

                tournamentId: tournamentId || null,
                tournamentName: tournament?.name || null,

                teamAId: teamAObj.id,
                teamAName: teamAObj.name,
                teamALogo: teamAObj.logoUrl || "",   // ✅ ADDED

                teamBId: teamBObj.id,
                teamBName: teamBObj.name,
                teamBLogo: teamBObj.logoUrl || "",   // ✅ ADDED

                status: "live",

                totalSets: 3,
                pointsPerSet: 25,

                currentSet: 1,
                currentPoints: {
                    teamA: 0,
                    teamB: 0,
                },

                setScores: [],

                teamASetsWon: 0,
                teamBSetsWon: 0,

                winnerTeamId: null,

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast.success("Match created successfully ✅", {
                id: "create-match",
            });

            navigate(`/tournaments/${tournamentId}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to create match", {
                id: "create-match",
            });
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className="px-3 py-4 max-w-xl mx-auto space-y-4">
            <h1 className="text-xl font-bold">Create Match</h1>

            <p className="text-sm text-gray-600">
                Tournament: {tournament?.name}
            </p>

            <div>
                <label className="text-sm font-medium">
                    Team A <span className="text-red-500">*</span>
                </label>
                <select
                    value={teamA}
                    onChange={(e) => setTeamA(e.target.value)}
                    className="w-full mt-1 border rounded-lg p-2"
                >
                    <option value="">Select Team A</option>
                    {teams.map((team) => (
                        <option
                            key={team.id}
                            value={team.id}
                            disabled={team.id === teamB}
                        >
                            {team.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-sm font-medium">
                    Team B <span className="text-red-500">*</span>
                </label>
                <select
                    value={teamB}
                    onChange={(e) => setTeamB(e.target.value)}
                    className="w-full mt-1 border rounded-lg p-2"
                >
                    <option value="">Select Team B</option>
                    {teams.map((team) => (
                        <option
                            key={team.id}
                            value={team.id}
                            disabled={team.id === teamA}
                        >
                            {team.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex gap-2 pt-2">
                <button
                    onClick={() => navigate(-1)}
                    className="flex-1 border rounded-lg py-2"
                >
                    Cancel
                </button>

                <button
                    onClick={handleCreateMatch}
                    className="flex-1 bg-green-600 text-white rounded-lg py-2"
                >
                    Create Match
                </button>
            </div>
        </div>
    );
};

export default CreateMatchPage;
