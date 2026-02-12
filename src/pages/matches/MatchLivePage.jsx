import React, { useEffect, useState } from "react";
import {
    doc,
    updateDoc,
    onSnapshot,
    Timestamp,
    query,
    where,
    getDocs,
    collection,
    increment
} from "firebase/firestore";
import { db } from "../../firebase";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";

const MatchLivePage = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);



    // 🔹 Listen to match
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "matches", matchId), (snap) => {
            if (snap.exists()) {
                setMatch({ id: snap.id, ...snap.data() });
                setLoading(false);
            }
        });

        return () => unsub();
    }, [matchId]);

    if (loading) return "Loading...";
    if (!match) return "Match not found";

    const neededSets = Math.ceil((match.totalSets || 3) / 2);
    const isReadOnly = match.status === "finished";

    // 🔹 Start match
    const startMatch = async () => {
        await updateDoc(doc(db, "matches", matchId), {
            status: "live",
            currentSet: 1,
            sets: [{ teamA: 0, teamB: 0 }],
            startedAt: Timestamp.now(),
        });
    };

    // 🔹 Update teamStats AFTER match ends
    const updateTeamStats = async (winnerTeamId) => {
        const q = query(
            collection(db, "teamStats"),
            where("tournamentId", "==", match.tournamentId)
        );

        const snap = await getDocs(q);

        const teamAStat = snap.docs.find(d => d.data().teamId === match.teamAId);
        const teamBStat = snap.docs.find(d => d.data().teamId === match.teamBId);

        if (!teamAStat || !teamBStat) return;

        const winnerStat =
            winnerTeamId === match.teamAId ? teamAStat : teamBStat;

        const loserStat =
            winnerTeamId === match.teamAId ? teamBStat : teamAStat;

        // both teams played
        await updateDoc(winnerStat.ref, {
            played: increment(1),
            wins: increment(1),
            points: increment(2),
        });

        await updateDoc(loserStat.ref, {
            played: increment(1),
            losses: increment(1),
        });
    };


    // 🔹 Score update
    const updateScore = async (team) => {
        if (match.status !== "live") return;

        const sets = [...match.sets];
        const idx = match.currentSet - 1;

        sets[idx][team] += 1;

        const a = sets[idx].teamA;
        const b = sets[idx].teamB;

        const setWon =
            (a >= 25 || b >= 25) && Math.abs(a - b) >= 2;

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

                // 🔥 SINGLE SOURCE OF TRUTH UPDATE
                await updateTeamStats(winnerId);

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

    // 🔹 Undo
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
                            className={`px-6 py-3 rounded-lg text-white
                                        ${isReadOnly
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700"}
                                `}
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
                            className={`px-6 py-3 rounded-lg text-white
                                        ${isReadOnly
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700"}
                                `}
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

            {/* 🔹 Completed Sets (Live Summary) */}
            {match.status === "live" && match.currentSet > 1 && (
                <div className="bg-gray-100 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-semibold text-gray-700 text-center">
                        Completed Sets
                    </p>

                    {match.sets
                        .slice(0, match.currentSet - 1)
                        .map((set, idx) => (
                            <div
                                key={idx}
                                className="flex justify-between bg-white px-3 py-1 rounded text-sm"
                            >
                                <span>Set {idx + 1}</span>
                                <span className="font-semibold">
                                    {set.teamA} - {set.teamB}
                                </span>
                            </div>
                        ))}
                </div>
            )}


            {match.status === "finished" && (
                <div className="bg-green-100 border border-green-300 p-3 rounded-lg text-sm space-y-2">
                    <p className="font-semibold text-green-800 text-center">
                        Match Finished 🏆
                    </p>

                    <p className="text-center">
                        Winner:{" "}
                        <strong>
                            {match.winnerTeamId === match.teamAId
                                ? match.teamAName
                                : match.teamBName}
                        </strong>
                    </p>

                    <div className="space-y-1">
                        {match.sets?.map((set, idx) => (
                            <div
                                key={idx}
                                className="flex justify-between bg-white px-2 py-1 rounded"
                            >
                                <span>Set {idx + 1}</span>
                                <span>
                                    {set.teamA} - {set.teamB}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {match.status === "finished" && (
                <button
                    onClick={() => navigate(`/tournaments/${match.tournamentId}`)}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg"
                >
                    Back to Tournament
                </button>
            )}
        </div>
    );
};

export default MatchLivePage;
