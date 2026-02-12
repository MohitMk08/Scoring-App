import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";

const getCountdown = (startDate) => {
    const diff = startDate - new Date();

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds };
};

const TournamentListPage = () => {
    const [tournaments, setTournaments] = useState([]);
    const [, forceTick] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "tournaments"), (snap) => {
            const data = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));
            setTournaments(data);
        });

        // keep countdown ticking
        const timer = setInterval(() => {
            forceTick((t) => t + 1);
        }, 1000);

        return () => {
            unsub();
            clearInterval(timer);
        };
    }, []);

    return (
        <div className="p-4 max-w-6xl mx-auto">

            <h1 className="text-xl font-semibold mb-4">
                Tournaments
            </h1>

            {tournaments.length === 0 ? (
                <p className="text-gray-500 text-sm">
                    No tournaments created yet.
                </p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tournaments.map((t) => {
                        const startDate = t.startDate?.toDate();
                        const endDate = t.endDate?.toDate();

                        // ✅ SOURCE OF TRUTH
                        const status = t.status || "upcoming";

                        const countdown =
                            status === "upcoming" && startDate
                                ? getCountdown(startDate)
                                : null;

                        return (
                            <div
                                key={t.id}
                                onClick={() =>
                                    navigate(`/tournaments/${t.id}`)
                                }
                                className="bg-white rounded-xl shadow-sm border p-4 cursor-pointer hover:shadow-md transition"
                            >
                                {/* TITLE */}
                                <h2 className="font-semibold text-lg">
                                    {t.name}
                                </h2>

                                {/* STATUS BADGE */}
                                <span
                                    className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${status === "upcoming"
                                        ? "bg-blue-100 text-blue-700"
                                        : status === "ongoing"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-green-100 text-green-700"
                                        }`}
                                >
                                    {status.toUpperCase()}
                                </span>

                                {/* DATES */}
                                <div className="text-xs text-gray-500 mt-2">
                                    {startDate?.toLocaleDateString()} →{" "}
                                    {endDate?.toLocaleDateString()}
                                </div>

                                {/* UPCOMING COUNTDOWN */}
                                {countdown && (
                                    <div className="mt-3 text-sm font-medium text-blue-700">
                                        Starts in:{" "}
                                        {countdown.days}d{" "}
                                        {countdown.hours}h{" "}
                                        {countdown.minutes}m{" "}
                                        {countdown.seconds}s
                                    </div>
                                )}

                                {/* ONGOING */}
                                {status === "ongoing" && (
                                    <div className="mt-3 text-sm text-red-600 font-semibold">
                                        🔴 Live Now
                                    </div>
                                )}

                                {/* COMPLETED */}
                                {status === "completed" && (
                                    <div className="mt-3 text-sm text-green-700 font-medium">
                                        🏆 Winner:{" "}
                                        {t.winnerTeamName || "—"}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

        </div >
    );
};

export default TournamentListPage;
