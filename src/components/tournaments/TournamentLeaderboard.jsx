import { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    onSnapshot
} from "firebase/firestore";
import { db } from "../../firebase";

const TournamentLeaderboard = ({ tournamentId }) => {
    const [stats, setStats] = useState([]);

    useEffect(() => {
        if (!tournamentId) return;

        const q = query(
            collection(db, "teamStats"),
            where("tournamentId", "==", tournamentId),
        );

        const unsub = onSnapshot(q, (snap) => {
            setStats(
                snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data()
                }))
            );
        });

        return () => unsub();
    }, [tournamentId]);

    if (!stats.length) {
        return (
            <div className="bg-white p-4 rounded shadow">
                <p className="text-sm text-gray-500">
                    No matches played yet
                </p>
            </div>
        );
    }

    const sortedStats = [...stats].sort((a, b) => {
        // 1️⃣ Points (higher first)
        if ((b.points ?? 0) !== (a.points ?? 0)) {
            return (b.points ?? 0) - (a.points ?? 0);
        }

        // 2️⃣ Wins (higher first)
        if ((b.wins ?? 0) !== (a.wins ?? 0)) {
            return (b.wins ?? 0) - (a.wins ?? 0);
        }

        // 3️⃣ Played (lower first → better efficiency)
        return (a.played ?? 0) - (b.played ?? 0);
    });


    return (
        <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Leaderboard</h2>

            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="text-left">Team</th>
                        <th>Played</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Points</th>
                    </tr>
                </thead>

                <tbody>
                    {sortedStats.map((t) => (
                        <tr key={t.id} className="border-b">
                            <td>{t.teamName}</td>
                            <td className="text-center">{t.played}</td>
                            <td className="text-center">{t.wins}</td>
                            <td className="text-center">{t.losses ?? 0}</td>
                            <td className="text-center font-semibold">{t.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TournamentLeaderboard;
