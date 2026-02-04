import React, { useEffect, useState } from "react";
import {
    doc,
    onSnapshot,
    updateDoc,
    Timestamp
} from "firebase/firestore";
import { db } from "../../firebase";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";

const MatchLivePage = () => {
    const { matchId } = useParams();
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "matches", matchId), (snap) => {
            if (snap.exists()) {
                setMatch({ id: snap.id, ...snap.data() });
                setLoading(false);
            }
        });

        return () => unsub();
    }, [matchId]);

    if (loading) return <DashboardLayout>Loading...</DashboardLayout>;
    if (!match) return <DashboardLayout>Match not found</DashboardLayout>;

    const neededSets = Math.ceil((match.totalSets || 3) / 2);

    const startMatch = async () => {
        await updateDoc(doc(db, "matches", matchId), {
            status: "live",
            currentSet: 1,
            sets: [{ teamA: 0, teamB: 0 }],
            startedAt: Timestamp.now()
        });
    };

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

            if (aSets === neededSets || bSets === neededSets) {
                await updateDoc(doc(db, "matches", matchId), {
                    sets,
                    status: "finished",
                    winnerTeamId:
                        aSets > bSets ? match.teamAId : match.teamBId,
                    finishedAt: Timestamp.now()
                });
                return;
            }

            sets.push({ teamA: 0, teamB: 0 });

            await updateDoc(doc(db, "matches", matchId), {
                sets,
                currentSet: match.currentSet + 1
            });
            return;
        }

        await updateDoc(doc(db, "matches", matchId), { sets });
    };

    const undoLastPoint = async () => {
        if (match.status !== "live") return;

        const sets = [...match.sets];
        const idx = match.currentSet - 1;
        const currentSet = sets[idx];

        if (currentSet.teamA > 0 || currentSet.teamB > 0) {
            if (currentSet.teamA >= currentSet.teamB && currentSet.teamA > 0) {
                currentSet.teamA -= 1;
            } else if (currentSet.teamB > 0) {
                currentSet.teamB -= 1;
            }

            sets[idx] = currentSet;
            await updateDoc(doc(db, "matches", matchId), { sets });
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-xl mx-auto p-4 space-y-4 bg-white rounded-xl shadow">
                <h1 className="text-xl font-bold text-red-500">Live Match</h1>

                {match.status === "upcoming" && (
                    <><div className="flex justify-between text-lg font-semibold">
                        <span>{match.teamAName}</span>
                        <span>Set {match.currentSet || 1}</span>
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
                                disabled={match.status === "finished"}
                                onClick={() => updateScore("teamA")}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
                            >
                                +1
                            </button>

                            <div className="text-3xl font-bold">
                                {match.sets?.[match.currentSet - 1]?.teamA}
                                {" : "}
                                {match.sets?.[match.currentSet - 1]?.teamB}
                            </div>

                            <button
                                disabled={match.status === "finished"}
                                onClick={() => updateScore("teamB")}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
                            >
                                +1
                            </button>
                        </div>
                    </>
                )}

                {match.status === "live" && (
                    <><button
                        onClick={undoLastPoint}
                        className="w-full py-2 bg-yellow-500 text-white rounded-lg"
                    >
                        Undo Last Point
                    </button>
                        <div className="space-y-2 mt-4">
                            <h3 className="font-semibold text-sm">Set History</h3>

                            {match.sets.map((set, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between bg-gray-100 px-3 py-1 rounded text-sm"
                                >
                                    <span>Set {i + 1}</span>
                                    <span>{set.teamA} - {set.teamB}</span>
                                </div>
                            ))}
                        </div>
                    </>

                )}

                {match.status === "finished" && (
                    <>
                        <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center">
                            Match Finished 🏆
                        </div>

                        <div className="space-y-2 mt-4">
                            <h3 className="font-semibold text-sm">Set History</h3>

                            {match.sets.map((set, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between bg-gray-100 px-3 py-1 rounded text-sm"
                                >
                                    <span>Set {i + 1}</span>
                                    <span>{set.teamA} - {set.teamB}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate(`/tournaments/${match.tournamentId}`)}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg"
                        >
                            Back to Tournament
                        </button>

                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MatchLivePage;
