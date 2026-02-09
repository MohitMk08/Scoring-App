import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";

export default function LiveMatchReadonly({ matchId }) {
    const [match, setMatch] = useState(null);

    useEffect(() => {
        return onSnapshot(doc(db, "matches", matchId), snap => {
            if (snap.exists()) {
                setMatch({ id: snap.id, ...snap.data() });
            }
        });
    }, [matchId]);

    if (!match || !match.sets) return null;

    const currentSetNo =
        match.currentSet || match.sets.length || 1;

    const currentSet =
        match.sets[currentSetNo - 1] || { teamA: 0, teamB: 0 };

    const lastCompletedSet =
        match.sets.length > 1
            ? match.sets[match.sets.length - 2]
            : null;

    return (
        <div className="bg-white rounded-xl p-4 shadow space-y-2">

            {/* TOURNAMENT NAME */}
            {match.tournamentName && (
                <p className="text-xs font-semibold text-indigo-600 truncate">
                    🏆 {match.tournamentName}
                </p>
            )}

            {/* TEAMS + CURRENT SET */}
            <div className="flex justify-between items-center font-semibold text-sm">
                <span className="truncate">{match.teamAName}</span>
                <span className="text-xs text-gray-500">
                    Set {currentSetNo}
                </span>
                <span className="truncate text-right">{match.teamBName}</span>
            </div>

            {/* LIVE BADGE */}
            <div className="text-center text-red-600 font-bold text-xs">
                ● LIVE
            </div>

            {/* CURRENT SET SCORE */}
            <div className="flex justify-center gap-6 text-3xl font-bold">
                <span>{currentSet.teamA}</span>
                <span>:</span>
                <span>{currentSet.teamB}</span>
            </div>

            {/* LAST SET SUMMARY */}
            {lastCompletedSet && (
                <div className="text-xs text-gray-500 text-center">
                    Last set: {lastCompletedSet.teamA} - {lastCompletedSet.teamB}
                </div>
            )}
        </div>
    );
}
