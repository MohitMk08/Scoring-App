import React, { useEffect, useState } from "react";
import {
    doc,
    updateDoc,
    onSnapshot,
    Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const MatchLive = ({ matchId }) => {
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔹 Listen to match (SINGLE SOURCE)
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "matches", matchId), (snap) => {
            if (snap.exists()) {
                setMatch({ id: snap.id, ...snap.data() });
                setLoading(false);
            }
        });

        return () => unsub();
    }, [matchId]);

    if (loading) return <p className="text-center">Loading...</p>;
    if (!match) return <p className="text-center">Match not found</p>;

    const isReadOnly = match.status === "finished";

    const neededSets = Math.ceil((match.totalSets || 3) / 2);
    const pointsLimit = match.pointsPerSet || 15;

    // 🔹 Start match
    const startMatch = async () => {
        await updateDoc(doc(db, "matches", matchId), {
            status: "live",
            currentSet: 1,
            sets: [{ teamA: 0, teamB: 0 }],
            startedAt: Timestamp.now(),
        });
    };

    // 🔹 Score update (TOURNAMENT STYLE)
    const updateScore = async (team) => {
        if (match.status !== "live") return;

        const sets = [...match.sets];
        const idx = match.currentSet - 1;

        sets[idx][team] += 1;

        const a = sets[idx].teamA;
        const b = sets[idx].teamB;

        const setWon =
            (a >= pointsLimit || b >= pointsLimit) &&
            Math.abs(a - b) >= 2;

        if (setWon) {
            const aSets = sets.filter(s => s.teamA > s.teamB).length;
            const bSets = sets.filter(s => s.teamB > s.teamA).length;

            // 🔴 MATCH FINISHED
            if (aSets === neededSets || bSets === neededSets) {
                const winnerId =
                    aSets > bSets ? match.teamAId : match.teamBId;

                await updateDoc(doc(db, "matches", matchId), {
                    sets,
                    status: "finished",
                    winnerTeamId: winnerId,
                    finishedAt: Timestamp.now(),
                });

                return;
            }

            // next set
            sets.push({ teamA: 0, teamB: 0 });

            await updateDoc(doc(db, "matches", matchId), {
                sets,
                currentSet: match.currentSet + 1,
            });

            return;
        }

        await updateDoc(doc(db, "matches", matchId), { sets });
    };

    // 🔹 Undo last point
    const undoLastPoint = async () => {
        if (match.status !== "live") return;

        const sets = [...match.sets];
        const idx = match.currentSet - 1;

        if (sets[idx].teamA > 0 || sets[idx].teamB > 0) {
            if (sets[idx].teamA >= sets[idx].teamB && sets[idx].teamA > 0) {
                sets[idx].teamA -= 1;
            } else if (sets[idx].teamB > 0) {
                sets[idx].teamB -= 1;
            }

            await updateDoc(doc(db, "matches", matchId), { sets });
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4 space-y-4 bg-white rounded-xl shadow">
            <h1 className="text-xl font-bold text-red-500">Live Match</h1>

            {match.status === "upcoming" && (
                <>
                    <div className="flex justify-between text-lg font-semibold">
                        <span>{match.teamAName}</span>
                        <span>Set 1</span>
                        <span>{match.teamBName}</span>
                    </div>

                    <button
                        onClick={startMatch}
                        className="w-full bg-green-600 text-white py-2 rounded-lg"
                    >
                        Start Match
                    </button>
                </>
            )}

            {match.status !== "upcoming" && (
                <>
                    <div className="flex justify-between text-lg font-semibold">
                        <span>{match.teamAName}</span>
                        <span>Set {match.currentSet}</span>
                        <span>{match.teamBName}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            disabled={isReadOnly}
                            onClick={() => updateScore("teamA")}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg disabled:bg-gray-400"
                        >
                            +1
                        </button>

                        <div className="text-3xl font-bold">
                            {match.sets?.[match.currentSet - 1]?.teamA}
                            {" : "}
                            {match.sets?.[match.currentSet - 1]?.teamB}
                        </div>

                        <button
                            disabled={isReadOnly}
                            onClick={() => updateScore("teamB")}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg disabled:bg-gray-400"
                        >
                            +1
                        </button>
                    </div>
                </>
            )}

            {match.status === "live" && (
                <button
                    onClick={undoLastPoint}
                    className="w-full py-2 bg-yellow-500 text-white rounded-lg"
                >
                    Undo Last Point
                </button>
            )}

            {/* 🔹 Set Summary (same as tournament) */}
            {match.sets?.length > 0 && (
                <div className="space-y-1">
                    {match.sets.map((s, i) => (
                        <div
                            key={i}
                            className="flex justify-between text-sm bg-gray-100 px-3 py-1 rounded"
                        >
                            <span>Set {i + 1}</span>
                            <span>{s.teamA} - {s.teamB}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ✅ AFTER FINISH */}
            {match.status === "finished" && (
                <>
                    <div className="text-center font-semibold text-green-700">
                        🏆 Winner: {match.winnerTeamId === match.teamAId
                            ? match.teamAName
                            : match.teamBName}
                    </div>

                    <button
                        onClick={() => navigate("/")}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg"
                    >
                        Go to Home
                    </button>
                </>
            )}
        </div>
    );
};

export default MatchLive;
