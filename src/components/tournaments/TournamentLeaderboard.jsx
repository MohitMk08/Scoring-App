import React, { useEffect, useState } from "react";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";

const TournamentLeaderboard = ({ tournamentId }) => {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        if (!tournamentId) return;

        const q = query(
            collection(db, "tournaments", tournamentId, "teams"),
            orderBy("points", "desc"),
            orderBy("wins", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            setTeams(
                snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }))
            );
        });

        return () => unsub();
    }, [tournamentId]);

    if (teams.length === 0) return null;

    return (
        <div className="bg-white rounded-lg p-4 shadow">
            <h2 className="font-semibold mb-3">Leaderboard</h2>

            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-gray-500">
                        <th>Team</th>
                        <th>P</th>
                        <th>W</th>
                        <th>L</th>
                        <th>Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((t) => (
                        <tr key={t.id} className="border-t">
                            <td className="py-1">{t.name}</td>
                            <td>{t.played}</td>
                            <td>{t.wins}</td>
                            <td>{t.losses}</td>
                            <td className="font-semibold">{t.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TournamentLeaderboard;
