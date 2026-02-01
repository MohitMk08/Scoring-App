import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function MatchLive({ matchId, teamsMap }) {
    const [match, setMatch] = useState(null);
    const [pointsA, setPointsA] = useState(0);
    const [pointsB, setPointsB] = useState(0);

    // Load match in real-time
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "matches", matchId), (docSnap) => {
            if (docSnap.exists()) {
                setMatch({ id: docSnap.id, ...docSnap.data() });
            }
        });
        return () => unsub();
    }, [matchId]);

    if (!match) {
        return <p className="text-center">Loading match...</p>;
    }

    const teamAName = teamsMap[match.teamAId]?.name || "Team A";
    const teamBName = teamsMap[match.teamBId]?.name || "Team B";

    const setsToWin = Math.ceil(match.totalSets / 2);

    // ✅ NEW: set validation rule
    const isSetValid = pointsA >= 15 || pointsB >= 15;

    // Add completed set
    const addSet = async () => {
        if (match.status === "finished") return;

        // ✅ SAFETY CHECK (prevents 0-0 bug)
        if (!isSetValid) {
            alert("At least one team must score 15 points to record a set");
            return;
        }

        let updatedTeamAScore = match.teamAScore;
        let updatedTeamBScore = match.teamBScore;

        if (pointsA > pointsB) updatedTeamAScore++;
        else updatedTeamBScore++;

        let status = "live";
        let winnerTeamId = null;

        // Auto end match
        if (
            updatedTeamAScore === setsToWin ||
            updatedTeamBScore === setsToWin
        ) {
            status = "finished";
            winnerTeamId =
                updatedTeamAScore > updatedTeamBScore
                    ? match.teamAId
                    : match.teamBId;
        }

        await updateDoc(doc(db, "matches", matchId), {
            setScores: [...match.setScores, { teamA: pointsA, teamB: pointsB }],
            teamAScore: updatedTeamAScore,
            teamBScore: updatedTeamBScore,
            status,
            winnerTeamId
        });

        setPointsA(0);
        setPointsB(0);
    };

    return (
        <div className="p-4 max-w-md mx-auto space-y-5 bg-white rounded-xl shadow">
            {/* Winner Banner */}
            {match.status === "finished" && (
                <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center font-semibold">
                    🏆 Winner: {teamsMap[match.winnerTeamId]?.name}
                </div>
            )}
            {match.status === "finished" && (
                <div className="bg-gray-800 text-white text-center py-2 rounded-lg text-sm font-semibold">
                    MATCH FINISHED
                </div>
            )}

            {/* Match Header */}
            <div className="text-center">
                <h2 className="font-semibold text-lg">
                    {teamAName} vs {teamBName}
                </h2>
                <p className="text-sm text-gray-600">
                    Best of {match.totalSets} sets
                </p>
                <p className="mt-1 font-medium">
                    Sets: {match.teamAScore} - {match.teamBScore}
                </p>
            </div>

            {/* Score Controllers */}
            <div className="grid grid-cols-2 gap-4">
                {/* Team A */}
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="font-semibold mb-2 truncate">{teamAName}</p>
                    <p className="text-4xl font-bold mb-3">{pointsA}</p>
                    <div className="flex justify-center gap-3">
                        <button
                            disabled={match.status === "finished"}
                            onClick={() => setPointsA(Math.max(0, pointsA - 1))}
                            className={`px-4 py-2 rounded-lg text-white
                                ${match.status === "finished"
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-red-500"
                                }`}
                        >
                            ➖
                        </button>
                        <button
                            disabled={match.status === "finished"}
                            onClick={() => setPointsA(pointsA + 1)}
                            className={`px-4 py-2 rounded-lg text-white
                                ${match.status === "finished"
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-600"
                                }`}
                        >
                            ➕
                        </button>
                    </div>
                </div>

                {/* Team B */}
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="font-semibold mb-2 truncate">{teamBName}</p>
                    <p className="text-4xl font-bold mb-3">{pointsB}</p>
                    <div className="flex justify-center gap-3">
                        <button
                            disabled={match.status === "finished"}
                            onClick={() => setPointsB(Math.max(0, pointsB - 1))}
                            className={`px-4 py-2 rounded-lg text-white
                                ${match.status === "finished"
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-red-500"
                                }`}
                        >
                            ➖
                        </button>
                        <button
                            disabled={match.status === "finished"}
                            onClick={() => setPointsB(pointsB + 1)}
                            className={`px-4 py-2 rounded-lg text-white
                                ${match.status === "finished"
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-600"
                                }`}
                        >
                            ➕
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Set Button */}
            {match.status === "live" && (
                <>
                    <button
                        onClick={addSet}
                        disabled={!isSetValid}
                        className={`w-full py-2 rounded-lg text-white
                            ${isSetValid
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-gray-300 cursor-not-allowed"
                            }
                        `}
                    >
                        Add Set Score
                    </button>

                    {!isSetValid && (
                        <p className="text-xs text-red-500 text-center">
                            One team must reach at least 15 points to save a set
                        </p>
                    )}
                </>
            )}

            {/* Set History */}
            <div>
                <h3 className="font-semibold mb-2">Set History</h3>
                <div className="space-y-1">
                    {match.setScores.map((set, idx) => (
                        <div
                            key={idx}
                            className="flex justify-between text-sm bg-gray-100 px-3 py-1 rounded"
                        >
                            <span>Set {idx + 1}</span>
                            <span>
                                {set.teamA} - {set.teamB}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
