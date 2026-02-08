import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";

export default function LiveMatchReadonly({ matchId }) {
    const [match, setMatch] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "matches", matchId), (snap) => {
            if (snap.exists()) {
                setMatch({ id: snap.id, ...snap.data() });
            }
        });

        return () => unsub();
    }, [matchId]);

    if (!match) return null;

    return (
        <div className="bg-white rounded-2xl p-4 shadow-md space-y-3 w-full max-w-md mx-auto">
            {/* 🏆 Tournament name */}
            {match.tournamentName && (
                <p className="text-xs font-semibold text-indigo-600 text-center">
                    🏆 {match.tournamentName}
                </p>
            )}

            {/* Teams + SET SCORE */}
            <div className="flex justify-between items-center font-semibold text-sm">
                <span className="truncate">{match.teamAName}</span>

                <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-bold">
                    {match.teamAScore ?? 0} - {match.teamBScore ?? 0}
                </span>

                <span className="truncate">{match.teamBName}</span>
            </div>

            {/* LIVE BADGE */}
            {match.status === "live" && (
                <div className="text-center text-red-600 font-bold text-xs tracking-wide">
                    ● LIVE
                </div>
            )}

            {/* LIVE POINTS */}
            <div className="flex justify-center items-center gap-4 text-3xl font-bold">
                <span>{match.livePoints?.teamA ?? 0}</span>
                <span className="text-gray-400">:</span>
                <span>{match.livePoints?.teamB ?? 0}</span>
            </div>

            {/* LAST SET SUMMARY */}
            {match.setScores?.length > 0 && (
                <div className="text-xs text-gray-500 text-center">
                    Last set:{" "}
                    {match.setScores.at(-1).teamA} -{" "}
                    {match.setScores.at(-1).teamB}
                </div>
            )}

            {/* FINISHED STATE */}
            {match.status === "finished" && (
                <div className="text-center text-green-700 text-sm font-semibold">
                    🏆 Winner:{" "}
                    {match.winnerTeamId === match.teamAId
                        ? match.teamAName
                        : match.teamBName}
                </div>
            )}
        </div>
    );
}
