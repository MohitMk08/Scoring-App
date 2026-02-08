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
            const tourRef = doc(db, "tournaments", tournamentId);
            const tourSnap = await getDoc(tourRef);

            if (tourSnap.exists()) {
                const tourData = tourSnap.data();
                setTournament(tourData);

                // fetch team docs
                const teamPromises = tourData.teams.map((teamId) =>
                    getDoc(doc(db, "teams", teamId))
                );

                const teamSnaps = await Promise.all(teamPromises);

                const teamList = teamSnaps
                    .filter((t) => t.exists())
                    .map((t) => ({
                        id: t.id,
                        ...t.data(),
                    }));

                setTeams(teamList);
            }

            setLoading(false);
        };

        loadData();
    }, [tournamentId]);

    // 🔹 Create match
    const handleCreateMatch = async () => {
        if (!teamA || !teamB) {
            alert("Please select both teams");
            return;
        }

        if (teamA === teamB) {
            alert("Team A and Team B cannot be the same");
            return;
        }

        const teamAObj = teams.find((t) => t.id === teamA);
        const teamBObj = teams.find((t) => t.id === teamB);

        // await addDoc(collection(db, "matches"), {
        //     tournamentId,
        //     teamAId: teamAObj.id,
        //     teamAName: teamAObj.name,
        //     teamBId: teamBObj.id,
        //     teamBName: teamBObj.name,
        //     teamAScore: 0,
        //     teamBScore: 0,
        //     status: "upcoming",
        //     createdAt: serverTimestamp(),
        // });

        await addDoc(collection(db, "matches"), {
            type: tournamentId ? "tournament" : "individual",

            tournamentId: tournamentId || null,
            tournamentName: tournamentName || null,

            teamAId,
            teamAName,
            teamBId,
            teamBName,

            status: "live",

            totalSets,
            pointsPerSet,

            // 🔥 LIVE STATE (CRITICAL)
            currentSet: 1,
            currentPoints: {
                teamA: 0,
                teamB: 0
            },

            setScores: [],

            teamASetsWon: 0,
            teamBSetsWon: 0,

            winnerTeamId: null,

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });


        navigate(`/tournaments/${tournamentId}`);
    };

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className="px-3 py-4 max-w-xl mx-auto space-y-4">
            {/* Header */}
            <h1 className="text-xl font-bold">
                Create Match
            </h1>

            <p className="text-sm text-gray-600">
                Tournament: {tournament?.name}
            </p>

            {/* Team A */}
            <div>
                <label className="text-sm font-medium">
                    Team A
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

            {/* Team B */}
            <div>
                <label className="text-sm font-medium">
                    Team B
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

            {/* Actions */}
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
