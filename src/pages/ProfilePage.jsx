import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiUser, FiMail, FiLogOut, FiCamera, FiX, FiEdit } from "react-icons/fi";
import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    query,
    where
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../firebase";

function Profile() {
    const navigate = useNavigate();
    const { currentUser, role, loading, logout } = useAuth();

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [photoBase64, setPhotoBase64] = useState("");

    const [matchesPlayed, setMatchesPlayed] = useState(0);
    const [teamName, setTeamName] = useState("");
    const [tournamentName, setTournamentName] = useState("");
    const [isWinner, setIsWinner] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        const fetchAllData = async () => {
            if (!currentUser) return;

            // 1️⃣ Fetch user basic data
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                setName(data.name || currentUser.displayName || "");
                setCategory(data.category || "");
                setPhotoBase64(data.photoBase64 || "");
            }

            // 2️⃣ Find Player document using email
            const playerQuery = query(
                collection(db, "players"),
                where("name", "==", userSnap.data()?.name || currentUser.displayName)
            );

            const playerSnap = await getDocs(playerQuery);

            if (playerSnap.empty) return;

            const playerDoc = playerSnap.docs[0];
            const playerId = playerDoc.id;

            // 3️⃣ Find team using PLAYER DOCUMENT ID
            const teamQuery = query(
                collection(db, "teams"),
                where("playerIds", "array-contains", playerId)
            );

            const teamSnap = await getDocs(teamQuery);

            if (teamSnap.empty) return;

            const teamDoc = teamSnap.docs[0];
            const teamData = teamDoc.data();
            const teamId = teamDoc.id;

            setTeamName(teamData.name);

            // 4️⃣ Count matches
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

            // 5️⃣ Tournament info
            if (teamData.tournamentId) {
                const tournamentRef = doc(db, "tournaments", teamData.tournamentId);
                const tournamentSnap = await getDoc(tournamentRef);

                if (tournamentSnap.exists()) {
                    const tournamentData = tournamentSnap.data();
                    setTournamentName(tournamentData.name || "Tournament");

                    if (tournamentData.winnerTeamId === teamId) {
                        setIsWinner(true);
                    }
                }
            }
        };

        fetchAllData();
    }, [currentUser]);

    const convertToBase64 = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        setUploading(true);

        const base64 = await convertToBase64(file);

        await setDoc(
            doc(db, "users", currentUser.uid),
            { photoBase64: base64 },
            { merge: true }
        );

        setPhotoBase64(base64);
        setUploading(false);
    };

    const handleSave = async () => {
        setSaving(true);

        await setDoc(
            doc(db, "users", currentUser.uid),
            { name, category },
            { merge: true }
        );

        await updateProfile(currentUser, { displayName: name });

        setEditMode(false);
        setSaving(false);
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex justify-center items-center px-4 py-10">

            <div className="w-full max-w-2xl bg-white/90 backdrop-blur-md shadow-xl rounded-3xl p-8 relative border border-gray-100">

                {/* Close Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition"
                >
                    <FiX size={22} />
                </button>

                {/* Header */}
                <div className="flex flex-col items-center text-center">

                    {/* Profile Image */}
                    <div className="relative">
                        {photoBase64 ? (
                            <img
                                src={photoBase64}
                                alt="Profile"
                                className="w-28 h-28 rounded-full object-cover ring-4 ring-indigo-200 shadow-md"
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl shadow-md">
                                <FiUser />
                            </div>
                        )}

                        <label className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition">
                            <FiCamera size={16} />
                            <input type="file" hidden onChange={handleImageChange} />
                        </label>
                    </div>

                    <h2 className="mt-4 text-2xl font-bold text-gray-800">
                        {name || "My Profile"}
                    </h2>

                    <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                        <FiMail /> {currentUser?.email}
                    </p>

                    {category && (
                        <span className="mt-2 px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-600 rounded-full">
                            {category}
                        </span>
                    )}
                </div>

                {/* Stats Section */}
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

                {/* Winner Badge */}
                {isWinner && (
                    <div className="mt-6 bg-linear-to-r from-yellow-400 to-orange-400 text-white text-center py-3 rounded-xl font-semibold shadow-md">
                        🏆 Tournament Winner
                    </div>
                )}

                {/* Edit Section */}
                <div className="mt-8">

                    {editMode ? (
                        <>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full border border-gray-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none p-3 rounded-xl mb-3"
                            />

                            <input
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Category"
                                className="w-full border border-gray-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none p-3 rounded-xl mb-4"
                            />

                            <button
                                onClick={handleSave}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl transition font-medium shadow-sm"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl transition font-medium shadow-sm flex items-center justify-center gap-2"
                        >
                            <FiEdit />
                            Edit Profile
                        </button>
                    )}

                    <button
                        onClick={logout}
                        className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl transition font-medium shadow-sm flex items-center justify-center gap-2"
                    >
                        <FiLogOut />
                        Logout
                    </button>

                </div>

            </div>
        </div>
    );
}

export default Profile;