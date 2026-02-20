import React, { useEffect, useState } from "react";
import {
    addDoc,
    collection,
    getDocs,
    updateDoc,
    doc,
    Timestamp,
    setDoc
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { createMatches } from "../../utils/createMatches";
import toast from "react-hot-toast";
import { getAuth } from "firebase/auth";




const CreateTournament = () => {
    const navigate = useNavigate();

    const [format, setFormat] = useState("round-robin");
    const [name, setName] = useState("");
    const [rules, setRules] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [teams, setTeams] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);

    const [loading, setLoading] = useState(false);

    // 🔹 Fetch all teams
    useEffect(() => {
        const fetchTeams = async () => {
            const snap = await getDocs(collection(db, "teams"));
            setTeams(
                snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }))
            );
        };

        fetchTeams();
    }, []);

    // 🔹 Toggle team selection
    const toggleTeam = (team) => {
        setSelectedTeams((prev) =>
            prev.find((t) => t.id === team.id)
                ? prev.filter((t) => t.id !== team.id)
                : [...prev, team]
        );
    };

    // 🔹 Create tournament
    const handleCreateTournament = async () => {
        // ---------- VALIDATIONS ----------
        if (!name.trim()) {
            toast.error("Tournament name is required");
            return;
        }

        if (!startDate || !endDate) {
            toast.error("Start and end date are required");
            return;
        }

        if (new Date(startDate) >= new Date(endDate)) {
            toast.error("End date must be after start date");
            return;
        }

        if (selectedTeams.length < 2) {
            toast.error("Select at least 2 teams");
            return;
        }

        try {
            setLoading(true);

            // 1️⃣ Create tournament
            const tournamentRef = await addDoc(collection(db, "tournaments"), {
                name,
                rules: rules || "",
                startDate: Timestamp.fromDate(new Date(startDate)),
                endDate: Timestamp.fromDate(new Date(endDate)),
                status: "upcoming",
                format,
                createdAt: Timestamp.now(),
            });

            const tournamentId = tournamentRef.id;

            // 2️⃣ Create tournament teams (SUBCOLLECTION)
            for (const team of selectedTeams) {
                await setDoc(
                    doc(db, "tournaments", tournamentId, "teams", team.id),
                    {
                        name: team.name,
                        played: 0,
                        wins: 0,
                        losses: 0,
                        points: 0,
                    }
                );
            }

            // 3️⃣ Create matches
            await createMatches(tournamentId, selectedTeams, format);

            // 4️⃣ Attach tournamentId to teams
            for (const team of selectedTeams) {
                await updateDoc(doc(db, "teams", team.id), {
                    tournamentId,
                });
            }

            toast.success("Tournament created successfully");
            navigate(`/tournaments/${tournamentId}`);

        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while creating tournament");
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="max-w-3xl mx-auto p-4 space-y-6">
            <h1 className="text-xl font-semibold">Create Tournament</h1>

            {/* Tournament Name */}
            <div>
                <label className="block text-sm font-medium mb-1">
                    Tournament Name *
                </label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Enter tournament name"
                />
            </div>

            {/* Format */}
            <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
            >
                <option value="round-robin">Round Robin</option>
                <option value="double-round-robin">Double Round Robin</option>
                <option value="knockout">Knockout</option>
            </select>

            {/* Rules */}
            <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={4}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Tournament rules (optional)"
            />

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                />
            </div>

            {/* Team Selection */}
            <div>
                <h2 className="text-sm font-medium mb-2">
                    Select Teams ({selectedTeams.length})
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {teams.map((team) => {
                        const selected = selectedTeams.some(
                            (t) => t.id === team.id
                        );

                        return (
                            <div
                                key={team.id}
                                onClick={() => toggleTeam(team)}
                                className={`border rounded-lg p-3 cursor-pointer ${selected
                                    ? "border-indigo-600 bg-indigo-50"
                                    : "hover:bg-gray-50"
                                    }`}
                            >
                                <p className="font-medium text-sm">
                                    {team.name}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={handleCreateTournament}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg disabled:opacity-60"
            >
                {loading ? "Creating..." : "Create Tournament"}
            </button>
        </div>

    );
};

export default CreateTournament;
