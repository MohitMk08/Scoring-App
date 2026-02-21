import { useEffect, useState } from "react";
import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "firebase/firestore";
import { db } from "../firebase";
import { FiUser, FiMail, FiX } from "react-icons/fi";

export default function PlayerProfileModal({ player, onClose }) {

    const [matchesPlayed, setMatchesPlayed] = useState(0);
    const [teamName, setTeamName] = useState("");
    const [tournamentName, setTournamentName] = useState("");
    const [isWinner, setIsWinner] = useState(false);

    useEffect(() => {
        if (!player) return;

        const fetchData = async () => {

            // 1️⃣ Find Team
            const teamQuery = query(
                collection(db, "teams"),
                where("playerIds", "array-contains", player.id)
            );

            const teamSnap = await getDocs(teamQuery);

            if (teamSnap.empty) return;

            const teamDoc = teamSnap.docs[0];
            const teamData = teamDoc.data();
            const teamId = teamDoc.id;

            setTeamName(teamData.name);

            // 2️⃣ Count Matches
            const q1 = query(
                collection(db, "matches"),
                where("teamAId", "==", teamId)
            );

            const q2 = query(
                collection(db, "matches"),
                where("teamBId", "==", teamId)
            );

            const snap1 = await getDocs(q1);
            const snap2 = await getDocs(q2);

            setMatchesPlayed(snap1.size + snap2.size);

            // 3️⃣ Tournament
            if (teamData.tournamentId) {
                const tournamentRef = doc(db, "tournaments", teamData.tournamentId);
                const tournamentSnap = await getDoc(tournamentRef);

                if (tournamentSnap.exists()) {
                    const tournamentData = tournamentSnap.data();
                    setTournamentName(tournamentData.name);

                    if (tournamentData.winnerTeamId === teamId) {
                        setIsWinner(true);
                    }
                }
            }
        };

        fetchData();
    }, [player]);

    if (!player) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">

            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 relative animate-fadeIn">

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                >
                    <FiX size={22} />
                </button>

                {/* Header */}
                <div className="flex flex-col items-center text-center">

                    {player.profilePic ? (
                        <img
                            src={player.profilePic}
                            alt={player.name}
                            className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-200 shadow-md"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl shadow-md">
                            <FiUser />
                        </div>
                    )}

                    <h2 className="mt-4 text-2xl font-bold text-gray-800">
                        {player.name}
                    </h2>

                    {player.category && (
                        <span className="mt-2 px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-600 rounded-full">
                            {player.category}
                        </span>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-8 text-center">

                    <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
                        <p className="text-lg font-bold text-indigo-600">
                            {teamName || "-"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Team</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
                        <p className="text-lg font-bold text-purple-600">
                            {matchesPlayed}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Matches</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
                        <p className="text-lg font-bold text-pink-600">
                            {tournamentName || "-"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Tournament</p>
                    </div>
                </div>

                {isWinner && (
                    <div className="mt-6 bg-linear-to-r from-yellow-400 to-orange-400 text-white text-center py-3 rounded-xl font-semibold shadow-md">
                        🏆 Tournament Winner
                    </div>
                )}

            </div>
        </div>
    );
}