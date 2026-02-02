import React, { useEffect, useState } from "react";
import {
    addDoc,
    collection,
    getDocs,
    updateDoc,
    doc,
    Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";

const CreateTournament = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [rules, setRules] = useState("");
    const [location, setLocation] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [teams, setTeams] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);

    const [loading, setLoading] = useState(false);

    // 🔹 Fetch all teams
    useEffect(() => {
        const fetchTeams = async () => {
            const snap = await getDocs(collection(db, "teams"));
            const data = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));
            setTeams(data);
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
        if (!name.trim()) {
            alert("Tournament name is required");
            return;
        }

        if (selectedTeams.length < 2) {
            alert("Select at least 2 teams");
            return;
        }

        try {
            setLoading(true);

            // 1️⃣ Create tournament
            const tournamentRef = await addDoc(collection(db, "tournaments"), {
                name,
                rules: rules || "",
                location: location || "",
                startDate: startDate
                    ? Timestamp.fromDate(new Date(startDate))
                    : null,
                endDate: endDate
                    ? Timestamp.fromDate(new Date(endDate))
                    : null,
                status: "upcoming",
                createdAt: Timestamp.now(),
            });

            const tournamentId = tournamentRef.id;

            // 2️⃣ Attach teams to tournament
            for (const team of selectedTeams) {
                await updateDoc(doc(db, "teams", team.id), {
                    tournamentId,
                });
            }

            alert("Tournament created successfully");
            navigate(`/tournaments/${tournamentId}`);
        } catch (error) {
            console.error("Error creating tournament:", error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-6">
            <DashboardLayout>
                <h1 className="text-xl font-semibold">Create Tournament</h1>

                {/* Tournament Name */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Tournament Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Enter tournament name"
                    />
                </div>

                {/* Rules */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Tournament Rules / Details
                    </label>
                    <textarea
                        value={rules}
                        onChange={(e) => setRules(e.target.value)}
                        rows={4}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Enter rules, format, or notes"
                    />
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Tournament Location / Venue
                    </label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="e.g. City Stadium, Mumbai"
                    />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                </div>

                {/* Team Selection */}
                <div className="mb-4">
                    <h2 className="text-sm font-medium mb-2">
                        Select Teams ({selectedTeams.length})
                    </h2>

                    {teams.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No teams available
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {teams.map((team) => {
                                const selected = selectedTeams.find(
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
                                        {/* <p className="text-xs text-gray-500">
                                            Players: —
                                        </p> */}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Submit */}
                <button
                    onClick={handleCreateTournament}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg disabled:opacity-60"
                >
                    {loading ? "Creating..." : "Create Tournament"}
                </button>
            </DashboardLayout>
        </div>
    );
};

export default CreateTournament;
