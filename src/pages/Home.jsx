import { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    limit
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import LiveMatchReadonly from "../components/LiveMatchReadonly";

export default function Home({ user }) {
    const navigate = useNavigate();

    const [liveMatches, setLiveMatches] = useState([]);
    const [recentMatches, setRecentMatches] = useState([]);
    const [ongoingTournaments, setOngoingTournaments] = useState([]);

    /* ---------------- LIVE MATCHES ---------------- */
    useEffect(() => {
        const q = query(
            collection(db, "matches"),
            where("status", "==", "live"),
            orderBy("startedAt", "asc")
        );

        return onSnapshot(q, snap => {
            setLiveMatches(
                snap.docs.map(d => ({ id: d.id, ...d.data() }))
            );
        });
    }, []);

    /* ---------------- RECENT MATCHES ---------------- */
    useEffect(() => {
        const q = query(
            collection(db, "matches"),
            where("status", "==", "finished"),
            orderBy("finishedAt", "desc"),
            limit(5)
        );

        return onSnapshot(q, snap => {
            setRecentMatches(
                snap.docs.map(d => ({ id: d.id, ...d.data() }))
            );
        });
    }, []);

    /* ---------------- ONGOING TOURNAMENTS ---------------- */
    useEffect(() => {
        const q = query(
            collection(db, "tournaments"),
            where("status", "==", "ongoing"),
            orderBy("createdAt", "desc")
        );

        return onSnapshot(q, snap => {
            setOngoingTournaments(
                snap.docs.map(d => ({ id: d.id, ...d.data() }))
            );
        });
    }, []);

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Home</h1>

                    {user && (
                        <div className="flex items-center gap-3">
                            {user.photoURL && (
                                <img
                                    src={user.photoURL}
                                    className="w-9 h-9 rounded-full"
                                    alt="profile"
                                />
                            )}
                            <span className="text-sm font-medium">
                                {user.displayName || user.phoneNumber}
                            </span>
                        </div>
                    )}
                </div>

                {/* LIVE MATCHES */}
                <section className="space-y-3">
                    <h2 className="font-semibold text-lg">Live Matches</h2>

                    {liveMatches.length === 0 && (
                        <p className="text-sm text-gray-500">
                            No live matches right now
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {liveMatches.map(match => (
                            <div
                                key={match.id}
                                onClick={() => navigate(`/matches/live/${match.id}`)}
                                className="cursor-pointer"
                            >
                                <LiveMatchReadonly matchId={match.id} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* ONGOING TOURNAMENTS */}
                <section className="space-y-3">
                    <h2 className="font-semibold text-lg">Ongoing Tournaments</h2>

                    {ongoingTournaments.length === 0 && (
                        <p className="text-sm text-gray-500">
                            No ongoing tournaments
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ongoingTournaments.map(t => (
                            <div
                                key={t.id}
                                onClick={() => navigate(`/tournaments/${t.id}`)}
                                className="bg-white rounded-xl p-4 shadow hover:shadow-md transition cursor-pointer"
                            >
                                <p className="font-semibold truncate">{t.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Status: Ongoing
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* RECENT MATCHES */}
                <section className="space-y-3">
                    <h2 className="font-semibold text-lg">Recent Matches</h2>

                    {recentMatches.length === 0 && (
                        <p className="text-sm text-gray-500">
                            No matches played yet
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {recentMatches.map(m => (
                            <div
                                key={m.id}
                                className="bg-white rounded-xl p-4 shadow"
                            >
                                <div className="flex justify-between font-medium text-sm">
                                    <span>{m.teamAName}</span>
                                    <span>
                                        {m.teamAScore} - {m.teamBScore}
                                    </span>
                                    <span>{m.teamBName}</span>
                                </div>

                                {m.setScores?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2 text-xs text-gray-600">
                                        {m.setScores.map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-gray-100 rounded">
                                                {s.teamA}-{s.teamB}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </DashboardLayout>
    );
}
