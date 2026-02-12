import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import DashboardLayout from "../layout/DashboardLayout";
import toast from "react-hot-toast";

export default function EditTournament() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState(null);
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [rules, setRules] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTournament = async () => {
            const ref = doc(db, "tournaments", id);
            const snap = await getDoc(ref);

            if (!snap.exists()) {
                navigate("/tournaments");
                return;
            }

            const data = snap.data();
            setTournament({ id: snap.id, ...data });

            setName(data.name || "");
            setLocation(data.location || "");
            setRules(data.rules || "");

            if (data.startDate) {
                setStartDate(data.startDate.toDate().toISOString().slice(0, 16));
            }

            if (data.endDate) {
                setEndDate(data.endDate.toDate().toISOString().slice(0, 16));
            }

            setLoading(false);
        };

        loadTournament();
    }, [id, navigate]);

    const handleUpdate = async () => {
        // ---- VALIDATIONS ----

        if (!name.trim()) {
            toast.error("Tournament name is required");
            return;
        }

        if (tournament.status === "upcoming") {
            if (!location.trim()) {
                toast.error("Location is required");
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
        }

        // ---- UPDATE LOGIC (unchanged) ----
        const updates = {
            name,
            rules
        };

        if (tournament.status === "upcoming") {
            updates.location = location;
            updates.startDate = new Date(startDate);
            updates.endDate = new Date(endDate);
        }

        await updateDoc(doc(db, "tournaments", id), updates);

        toast.success("Tournament updated");
        navigate(`/tournaments/${id}`);
    };

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure? This will delete the tournament permanently."
        );

        if (!confirmed) return;

        await deleteDoc(doc(db, "tournaments", id));
        toast.success("Tournament deleted");
        navigate("/tournaments");
    };

    if (loading) {
        return (

            <div className="p-4 text-center text-gray-500">Loading...</div>

        );
    }

    if (tournament.status === "completed") {
        return (

            <div className="p-4 text-center text-red-600">
                Completed tournaments cannot be edited.
            </div>

        );
    }

    return (

        <div className="px-3 py-4 max-w-3xl mx-auto space-y-4">
            <h1 className="text-xl font-semibold">Edit Tournament</h1>

            {/* Name */}
            <input
                className="w-full border rounded-lg px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tournament Name *"
            />

            {/* Location */}
            {tournament.status === "upcoming" && (
                <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location *"
                />
            )}

            {/* Dates */}
            {tournament.status === "upcoming" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    />
                    <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    />
                </div>
            )}

            {/* Rules */}
            <textarea
                rows={4}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Tournament rules (optional)"
                className="w-full border rounded-lg px-3 py-2"
            />

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-2">
                <button
                    onClick={handleDelete}
                    className="text-red-600 border border-red-300 px-4 py-2 rounded-lg"
                >
                    Delete
                </button>

                <button
                    onClick={handleUpdate}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                    Save Changes
                </button>
            </div>
        </div>

    );
}
