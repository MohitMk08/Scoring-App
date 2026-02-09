import { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import LiveMatchReadonly from "../components/LiveMatchReadonly";

/* 🔑 SINGLE SOURCE OF TRUTH */
const getSetsWon = (sets = []) => {
    let a = 0;
    let b = 0;

    sets.forEach(s => {
        if (s.teamA > s.teamB) a++;
        if (s.teamB > s.teamA) b++;
    });

    return { a, b };
};

export default function Home({ user }) {
    const navigate = useNavigate();

    const [liveMatches, setLiveMatches] = useState([]);
    const [recentMatches, setRecentMatches] = useState([]);
    const [ongoingTournaments, setOngoingTournaments] = useState([]);

    /* ---------------- LIVE MATCHES (REAL-TIME) ---------------- */
    useEffect(() => {
        const q = query(
            collection(db, "matches"),
            where("status", "==", "live")
        );

        return onSnapshot(q, snap => {
            const data = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));

            // client-side sort (latest activity first)
            data.sort(
                (a, b) =>
                    (b.updatedAt?.seconds || 0) -
                    (a.updatedAt?.seconds || 0)
            );

            setLiveMatches(data);
        });
    }, []);

    /* ---------------- RECENT MATCHES (LAST 5) ---------------- */
    useEffect(() => {
        const q = query(
            collection(db, "matches"),
            where("status", "==", "finished")
        );

        return onSnapshot(q, snap => {
            const data = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));

            data.sort(
                (a, b) =>
                    (b.finishedAt?.seconds || 0) -
                    (a.finishedAt?.seconds || 0)
            );

            setRecentMatches(data.slice(0, 5));
        });
    }, []);

    /* ---------------- ONGOING TOURNAMENTS ---------------- */
    useEffect(() => {
        const q = query(
            collection(db, "tournaments"),
            where("status", "==", "ongoing")
        );

        return onSnapshot(q, snap => {
            const data = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));

            data.sort(
                (a, b) =>
                    (b.createdAt?.seconds || 0) -
                    (a.createdAt?.seconds || 0)
            );

            setOngoingTournaments(data);
        });
    }, []);

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

                {/* ---------- HEADER ---------- */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Home</h1>

                    {user && (
                        <div className="flex items-center gap-3">
                            {user.photoURL && (
                                <img
                                    src={user.photoURL}
                                    className="w-9 h-9 rounded-full border"
                                    alt="profile"
                                />
                            )}
                            <span className="text-sm font-medium">
                                {user.displayName || user.phoneNumber}
                            </span>
                        </div>
                    )}
                </div>

                {/* ---------- LIVE MATCHES ---------- */}
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
                                onClick={() =>
                                    navigate(`/matches/live/${match.id}`)
                                }
                                className="cursor-pointer"
                            >
                                {/* 🔴 READ-ONLY LIVE VIEW */}
                                <LiveMatchReadonly matchId={match.id} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* ---------- ONGOING TOURNAMENTS ---------- */}
                <section className="space-y-3">
                    <h2 className="font-semibold text-lg">
                        Ongoing Tournaments
                    </h2>

                    {ongoingTournaments.length === 0 && (
                        <p className="text-sm text-gray-500">
                            No ongoing tournaments
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ongoingTournaments.map(t => (
                            <div
                                key={t.id}
                                onClick={() =>
                                    navigate(`/tournaments/${t.id}`)
                                }
                                className="bg-white rounded-xl p-4 shadow hover:shadow-md transition cursor-pointer"
                            >
                                <p className="font-semibold truncate">
                                    {t.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Status: Ongoing
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ---------- RECENT MATCHES ---------- */}
                <section className="space-y-3">
                    <h2 className="font-semibold text-lg">Recent Matches</h2>

                    {recentMatches.length === 0 && (
                        <p className="text-sm text-gray-500">
                            No matches played yet
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {recentMatches.map(m => {
                            const { a, b } = getSetsWon(m.sets || []);

                            return (
                                <div
                                    key={m.id}
                                    className="bg-white rounded-xl p-4 shadow"
                                >
                                    <div className="flex justify-between font-medium text-sm">
                                        <span>{m.teamAName}</span>
                                        <span>{a} - {b}</span>
                                        <span>{m.teamBName}</span>
                                    </div>

                                    <p className="text-xs text-gray-400 mt-1">
                                        {m.tournamentId
                                            ? "Tournament Match"
                                            : "Individual Match"}
                                    </p>

                                    {m.sets?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2 text-xs text-gray-600">
                                            {m.sets.map((s, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 bg-gray-100 rounded"
                                                >
                                                    {s.teamA}-{s.teamB}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

            </div>
        </DashboardLayout>
    );
}
