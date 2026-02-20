import { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import LiveMatchReadonly from "../components/LiveMatchReadonly";
import { requestNotificationPermission } from "../firebase-messaging";

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

/* 🔥 FETCH TEAM LOGOS DIRECTLY */
const attachLogosToMatches = async (matches) => {
    const updated = await Promise.all(
        matches.map(async (m) => {
            try {
                const teamADoc = await getDoc(doc(db, "teams", m.teamAId));
                const teamBDoc = await getDoc(doc(db, "teams", m.teamBId));

                return {
                    ...m,
                    teamALogo: teamADoc.exists() ? teamADoc.data().logoUrl : null,
                    teamBLogo: teamBDoc.exists() ? teamBDoc.data().logoUrl : null,
                };
            } catch (err) {
                console.error("Logo fetch error:", err);
                return m;
            }
        })
    );

    return updated;
};

export default function Home({ user }) {
    const navigate = useNavigate();

    const [liveMatches, setLiveMatches] = useState([]);
    const [recentMatches, setRecentMatches] = useState([]);
    const [ongoingTournaments, setOngoingTournaments] = useState([]);

    /* ---------------- LIVE MATCHES ---------------- */
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

            data.sort(
                (a, b) =>
                    (b.updatedAt?.seconds || 0) -
                    (a.updatedAt?.seconds || 0)
            );

            setLiveMatches(data);
        });
    }, []);

    /* ---------------- RECENT MATCHES ---------------- */
    useEffect(() => {
        const q = query(
            collection(db, "matches"),
            where("status", "==", "finished")
        );

        return onSnapshot(q, async snap => {
            let data = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));

            data.sort(
                (a, b) =>
                    (b.finishedAt?.seconds || 0) -
                    (a.finishedAt?.seconds || 0)
            );

            data = data.slice(0, 5);

            const withLogos = await attachLogosToMatches(data);
            setRecentMatches(withLogos);
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
                {/* <button
                    onClick={async () => {
                        const token = await requestNotificationPermission();
                        console.log("Token:", token);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Enable Notifications
                </button> */}

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

                        let a = 0;
                        let b = 0;

                        // 🔑 SINGLE SOURCE OF TRUTH FOR SCORE
                        if (m.sets && m.sets.length > 0) {
                            const result = getSetsWon(m.sets);
                            a = result.a;
                            b = result.b;
                        } else if (
                            m.teamAScore !== undefined &&
                            m.teamBScore !== undefined
                        ) {
                            a = m.teamAScore;
                            b = m.teamBScore;
                        }

                        const winnerId = m.winnerTeamId || m.winnerId;

                        const isAWinner =
                            winnerId
                                ? winnerId === m.teamAId
                                : a > b;

                        const isBWinner =
                            winnerId
                                ? winnerId === m.teamBId
                                : b > a;

                        return (
                            <div
                                key={m.id}
                                onClick={() => navigate(`/matches/${m.id}`)}
                                className="bg-white rounded-xl p-3 sm:p-4 shadow space-y-3 hover:shadow-md transition cursor-pointer"
                            >
                                {/* Tournament + Date */}
                                <div className="flex items-center justify-between text-xs text-gray-400 flex-wrap gap-1">
                                    <span className="truncate">
                                        {m.tournamentName
                                            ? `🏆 ${m.tournamentName}`
                                            : m.tournamentId
                                                ? "🏆 Tournament Match"
                                                : "🤝 Individual Match"}
                                    </span>

                                    {m.finishedAt && (
                                        <span>
                                            {new Date(
                                                m.finishedAt.seconds * 1000
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                {/* Teams + Score */}
                                <div className="flex justify-between items-center w-full text-sm font-medium">

                                    {/* Team A */}
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <img
                                            src={m.teamALogo && m.teamALogo.length > 10
                                                ? m.teamALogo
                                                : "/team-placeholder.png"}
                                            alt={m.teamAName}
                                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border shrink-0"
                                        />
                                        <span
                                            className={`truncate ${isAWinner ? "text-green-600 font-bold" : ""
                                                }`}
                                        >
                                            {m.teamAName}
                                        </span>
                                    </div>

                                    {/* Score */}
                                    <span className="text-lg sm:text-xl font-bold text-gray-800 px-2 shrink-0">
                                        {a} - {b}
                                    </span>

                                    {/* Team B */}
                                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                                        <span
                                            className={`truncate ${isBWinner ? "text-green-600 font-bold" : ""
                                                }`}
                                        >
                                            {m.teamBName}
                                        </span>
                                        <img
                                            src={m.teamBLogo && m.teamBLogo.length > 10
                                                ? m.teamBLogo
                                                : "/team-placeholder.png"}
                                            alt={m.teamBName}
                                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border shrink-0"
                                        />
                                    </div>
                                </div>

                                {/* 🔥 UNIVERSAL SET SUMMARY (sets + setScores supported) */}
                                {(() => {

                                    const summarySets =
                                        (Array.isArray(m.sets) && m.sets.length > 0)
                                            ? m.sets
                                            : (Array.isArray(m.setScores) && m.setScores.length > 0)
                                                ? m.setScores
                                                : null;

                                    if (summarySets) {
                                        return (
                                            <div className="flex flex-wrap gap-1 sm:gap-2 text-xs text-gray-600">
                                                {summarySets.map((s, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-1 bg-gray-100 rounded-md border font-medium text-[11px] sm:text-xs min-w-12 text-center"
                                                    >
                                                        {s.teamA}-{s.teamB}
                                                    </span>
                                                ))}
                                            </div>
                                        );
                                    }

                                    return null;

                                })()}


                                {/* Winner Label */}
                                {(isAWinner || isBWinner) && (
                                    <p className="text-xs text-green-600 font-semibold">
                                        🥇 Winner:{" "}
                                        {isAWinner
                                            ? m.teamAName
                                            : m.teamBName}
                                    </p>
                                )}
                            </div>
                        );
                    })}

                </div>
            </section>
        </div>
    );
}
