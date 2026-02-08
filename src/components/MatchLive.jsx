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

    // 🔹 SINGLE SOURCE OF TRUTH
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

    const totalSets = match.totalSets || 3;
    const neededSets = Math.ceil(totalSets / 2);
    const pointsLimit = match.pointsPerSet || 15;

    // 🔹 START MATCH
    const startMatch = async () => {
        await updateDoc(doc(db, "matches", matchId), {
            status: "live",
            livePoints: { teamA: 0, teamB: 0 },
            setScores: [],
            teamAScore: 0,
            teamBScore: 0,
            startedAt: Timestamp.now(),
        });
    };

    // 🔹 UPDATE SCORE (TOURNAMENT STYLE)
    const updateScore = async (team) => {
        if (match.status !== "live") return;

        const livePoints = { ...match.livePoints };
        livePoints[team] += 1;

        const a = livePoints.teamA;
        const b = livePoints.teamB;

        const setWon =
            (a >= pointsLimit || b >= pointsLimit) &&
            Math.abs(a - b) >= 2;

        // 🟢 SET FINISHED
        if (setWon) {
            const setScores = [...match.setScores, livePoints];

            const teamAScore =
                match.teamAScore + (a > b ? 1 : 0);
            const teamBScore =
                match.teamBScore + (b > a ? 1 : 0);

            // 🔴 MATCH FINISHED
            if (teamAScore === neededSets || teamBScore === neededSets) {
                await updateDoc(doc(db, "matches", matchId), {
                    setScores,
                    teamAScore,
                    teamBScore,
                    status: "finished",
                    winnerTeamId:
                        teamAScore > teamBScore
                            ? match.teamAId
                            : match.teamBId,
                    finishedAt: Timestamp.now(),
                });
                return;
            }

            // 🟡 NEXT SET
            await updateDoc(doc(db, "matches", matchId), {
                setScores,
                teamAScore,
                teamBScore,
                livePoints: { teamA: 0, teamB: 0 },
            });

            return;
        }

        // 🔵 NORMAL POINT
        await updateDoc(doc(db, "matches", matchId), {
            livePoints,
        });
    };

    // 🔹 UNDO LAST POINT
    const undoLastPoint = async () => {
        if (match.status !== "live") return;

        const livePoints = { ...match.livePoints };

        if (livePoints.teamA > 0 || livePoints.teamB > 0) {
            if (livePoints.teamA >= livePoints.teamB && livePoints.teamA > 0) {
                livePoints.teamA -= 1;
            } else if (livePoints.teamB > 0) {
                livePoints.teamB -= 1;
            }

            await updateDoc(doc(db, "matches", matchId), {
                livePoints,
            });
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4 space-y-4 bg-white rounded-xl shadow">
            <h1 className="text-xl font-bold text-red-500">Live Match</h1>

            {match.status === "upcoming" && (
                <>
                    <div className="flex justify-between text-lg font-semibold">
                        <span>{match.teamAName}</span>
                        <span>vs</span>
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
                        <span>
                            Sets {match.teamAScore} - {match.teamBScore}
                        </span>
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
                            {match.livePoints?.teamA ?? 0}
                            {" : "}
                            {match.livePoints?.teamB ?? 0}
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

            {/* 🔹 SET SUMMARY */}
            {match.setScores?.length > 0 && (
                <div className="space-y-1">
                    {match.setScores.map((s, i) => (
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

            {match.status === "finished" && (
                <>
                    <div className="text-center font-semibold text-green-700">
                        🏆 Winner:{" "}
                        {match.winnerTeamId === match.teamAId
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
