import { X } from "lucide-react";

export default function PlayerProfileModal({ player, onClose }) {
    if (!player) return null;

    const getInitials = (name = "") =>
        name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl relative">

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-500 hover:text-black"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex items-center gap-4">
                        {player.photoURL ? (
                            <img
                                src={player.photoURL}
                                className="w-16 h-16 rounded-full object-cover"
                                alt={player.name}
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-600">
                                {getInitials(player.name)}
                            </div>
                        )}

                        <div>
                            <h2 className="text-xl font-bold">{player.name}</h2>
                            <p className="text-sm text-gray-500">
                                {player.category || "No category"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Mobile</span>
                        <span className="font-medium">{player.mobile}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Category</span>
                        <span className="font-medium">{player.category}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Team</span>
                        <span className="font-medium">
                            {player.teamName || "No team "}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
